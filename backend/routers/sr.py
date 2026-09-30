"""
TerraRise -- SR Router
POST /api/sr/enhance  -- Primary super-resolution endpoint
POST /api/sr/analyze  -- Optional downstream Gemini analysis

Performance notes:
- Inference runs in asyncio.to_thread() -- never blocks the FastAPI event loop
- Output images are saved to disk and served via static URL -- NO base64 in JSON
- Bicubic baseline is computed ONLY when baseline=True
- Input and output pixel limits are checked BEFORE inference
- CPU thread count is set in the service layer
"""
from __future__ import annotations

import asyncio
import io
import os
import time
import uuid
from pathlib import Path

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image

from services.super_resolution_service import (
    calculate_metrics,
    compute_uncertainty,
    sr_model,
)

router = APIRouter()

# -
# Output directory -- served as static files by main.py
# -
OUTPUT_DIR = Path(__file__).parent.parent / "sr_outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Retain at most this many output files on disk (simple cleanup)
MAX_OUTPUT_FILES = int(os.getenv("SR_MAX_OUTPUT_FILES", "50"))


def _prune_old_outputs() -> None:
    """
    Remove oldest PNG files from the output directory once the count
    exceeds MAX_OUTPUT_FILES. This prevents unbounded disk growth.
    """
    files = sorted(OUTPUT_DIR.glob("*.png"), key=lambda p: p.stat().st_mtime)
    while len(files) > MAX_OUTPUT_FILES:
        try:
            files.pop(0).unlink(missing_ok=True)
        except OSError:
            break


def _save_image(img_rgb: np.ndarray, prefix: str) -> str:
    """
    Save an RGB numpy array as PNG and return a download URL path.
    Returns: relative URL string e.g. "/sr/output/enhanced_<uuid>.png"
    """
    filename = f"{prefix}_{uuid.uuid4().hex[:12]}.png"
    path = OUTPUT_DIR / filename
    Image.fromarray(img_rgb).save(str(path), format="PNG")
    return f"/sr/output/{filename}"


def _load_image_rgb(file_bytes: bytes) -> np.ndarray:
    """Open image bytes as RGB numpy array."""
    pil = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return np.array(pil)


# -
# Primary endpoint
# -

@router.post("/sr/enhance")
async def enhance_image(
    image: UploadFile = File(...),
    scale: int = Form(2),                    # default 2x (was 4x -- performance fix)
    reference_image: UploadFile = File(None),
    baseline: bool = Form(False),            # default False (was True -- performance fix)
):
    """
    Run FSRCNN deep-learning super-resolution on an uploaded image.

    The heavy inference is offloaded to a thread pool via asyncio.to_thread()
    so the FastAPI event loop remains responsive.

    Returns a lightweight JSON response with output URLs -- NOT base64 payloads.
    """
    print(f"\n[SR] request received: {image.filename}, scale={scale}x, baseline={baseline}")

    try:
        # - 1. Read input -
        contents = await image.read()
        if not contents:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Uploaded image file is empty."},
            )

        # - 2. Decode image -
        try:
            img_rgb = _load_image_rgb(contents)
        except Exception as exc:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": f"Cannot decode image: {exc}"},
            )

        h, w = img_rgb.shape[:2]
        c = img_rgb.shape[2] if img_rgb.ndim == 3 else 1
        input_ext = (image.filename or "image.png").rsplit(".", 1)[-1].upper()

        print(f"[SR] input: {w}x{h}, bands={c}, format={input_ext}")

        # - 3. Pre-flight size check (before any inference) -
        # The service raises ValueError with a human-readable message if
        # input or output pixel counts exceed configured limits.
        try:
            sr_model._check_size_limits(h, w, scale)
        except ValueError as size_err:
            print(f"[SR] size check FAILED: {size_err}")
            return JSONResponse(
                status_code=413,
                content={"success": False, "error": str(size_err)},
            )

        # - 4. Run FSRCNN in thread pool (non-blocking) -
        # cv2 uses BGR; convert before handing to the model.
        img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

        start_time = time.time()
        print("[SR] dispatching inference to thread pool...")

        enhanced_bgr: np.ndarray = await asyncio.to_thread(
            sr_model.enhance, img_bgr, scale
        )

        processing_time = time.time() - start_time
        print(f"[SR] inference complete in {processing_time:.2f}s")

        # - 5. Convert output back to RGB -
        enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)
        out_h, out_w = enhanced_rgb.shape[:2]

        # - 6. Save enhanced image to disk, return URL -
        _prune_old_outputs()
        download_url = _save_image(enhanced_rgb, "enhanced")
        print(f"[SR] output saved -> {download_url}")

        # - 7. Optional bicubic baseline (only when requested) -
        bicubic_url = None
        if baseline:
            print("[SR] computing bicubic baseline...")
            bicubic_bgr = cv2.resize(
                img_bgr,
                (out_w, out_h),
                interpolation=cv2.INTER_CUBIC,
            )
            bicubic_rgb = cv2.cvtColor(bicubic_bgr, cv2.COLOR_BGR2RGB)
            bicubic_url = _save_image(bicubic_rgb, "bicubic")

        # - 8. Optional reference validation -
        val_metrics: dict = {
            "reference_available": False,
            "psnr": None,
            "ssim": None,
            "rmse": None,
        }

        if reference_image is not None:
            try:
                ref_contents = await reference_image.read()
                ref_rgb = _load_image_rgb(ref_contents)
                p, s, r = calculate_metrics(ref_rgb, enhanced_rgb)
                val_metrics = {
                    "reference_available": True,
                    "psnr": round(p, 4),
                    "ssim": round(s, 6),
                    "rmse": round(r, 4),
                }
                print(f"[SR] validation: PSNR={p:.2f}dB SSIM={s:.4f} RMSE={r:.4f}")
            except Exception as ref_err:
                print(f"[SR] reference validation failed: {ref_err}")
                # Non-fatal -- SR still succeeded
                val_metrics["error"] = str(ref_err)

        # - 9. Uncertainty (heuristic) -
        uncertainty = compute_uncertainty(img_rgb, enhanced_rgb, scale)

        # - 10. Return lightweight JSON -
        print("[SR] response returned")
        return {
            "success": True,
            "model": sr_model.model_name,
            "scale": scale,
            "processing_time": round(processing_time, 3),
            "input": {
                "width": w,
                "height": h,
                "bands": c,
                "format": input_ext,
                "pixel_count": w * h,
            },
            "output": {
                "width": out_w,
                "height": out_h,
                "format": "PNG",
                "pixel_count": out_w * out_h,
                "download_url": download_url,
                "bicubic_url": bicubic_url,
            },
            "validation": val_metrics,
            "spectral_validation": {
                "status": "UNAVAILABLE",
                "message": (
                    "SPECTRAL VALIDATION UNAVAILABLE -- RGB INPUT. "
                    "Full multispectral band validation requires multi-band input."
                ),
            },
            "uncertainty": uncertainty,
            "limitations": [
                (
                    f"The generated fine-scale detail is model-reconstructed "
                    f"({scale}x super-resolved reconstruction on a finer output pixel grid) "
                    f"and should not be interpreted as newly observed ground-truth information."
                ),
                "Visual SR currently operates on an RGB representation.",
                (
                    f"Processed in {processing_time:.2f}s on CPU using FSRCNN. "
                    f"Output: {out_w}x{out_h} pixels."
                ),
            ],
        }

    except ValueError as ve:
        print(f"[SR] validation error: {ve}")
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(ve)},
        )
    except FileNotFoundError as fnf:
        print(f"[SR] model weights missing: {fnf}")
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": f"SR model weights unavailable: {fnf}",
            },
        )
    except Exception as exc:
        print(f"[SR] unexpected error: {exc}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(exc)},
        )


# -
# Optional downstream Gemini analysis
# -

@router.post("/sr/analyze")
async def analyze_sr_image(
    image: UploadFile = File(...),
    query: str = Form(...),
):
    """
    Optional downstream AI analysis of an SR output image using Gemini.

    The core SR pipeline does NOT depend on this endpoint.
    If Gemini is unavailable, this returns a graceful error.
    """
    try:
        from services.gemini_service import call_gemini

        contents = await image.read()

        system_prompt = (
            "You are TerraRise, an expert Earth-observation AI. "
            "The user is providing an image (either the original medium-resolution "
            "observation or a super-resolved reconstruction). "
            "Answer their query as a professional geospatial analyst. "
            "Do not invent details. "
            "Format the output as a valid JSON object: "
            '{"task": "downstream_analysis", "answer": "Your response here."}'
        )

        result = call_gemini(
            system_prompt=system_prompt,
            user_prompt=query,
            image_bytes=contents,
            mime_type=image.content_type or "image/jpeg",
        )
        return result

    except ImportError:
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "Gemini service is not available in this deployment.",
            },
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(exc)},
        )
