from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
import cv2
import numpy as np
from PIL import Image
import io
import time
import os
import base64
from backend.services.super_resolution_service import sr_model, calculate_metrics, compute_uncertainty

router = APIRouter()

@router.post("/sr/enhance")
async def enhance_image(
    image: UploadFile = File(...),
    scale: int = Form(...),
    reference_image: UploadFile = File(None),
    baseline: bool = Form(False)
):
    try:
        contents = await image.read()
        pil_img = Image.open(io.BytesIO(contents)).convert('RGB')
        img_np = np.array(pil_img)
        # OpenCV uses BGR, so convert RGB to BGR for processing
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        h, w, c = img_bgr.shape
        start_time = time.time()
        
        enhanced_bgr = sr_model.enhance(img_bgr, scale)
        
        processing_time = time.time() - start_time
        enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)
        
        # Save output
        out_pil = Image.fromarray(enhanced_rgb)
        out_io = io.BytesIO()
        out_pil.save(out_io, format="PNG")
        out_b64 = base64.b64encode(out_io.getvalue()).decode('utf-8')
        download_url = f"data:image/png;base64,{out_b64}"
        
        # Baseline (Bicubic)
        bicubic_bgr = cv2.resize(img_bgr, (enhanced_bgr.shape[1], enhanced_bgr.shape[0]), interpolation=cv2.INTER_CUBIC)
        bicubic_rgb = cv2.cvtColor(bicubic_bgr, cv2.COLOR_BGR2RGB)
        bicubic_io = io.BytesIO()
        Image.fromarray(bicubic_rgb).save(bicubic_io, format="PNG")
        bicubic_url = f"data:image/png;base64,{base64.b64encode(bicubic_io.getvalue()).decode('utf-8')}"

        val_metrics = {
            "reference_available": False,
            "psnr": None,
            "ssim": None,
            "rmse": None
        }
        
        if reference_image:
            ref_contents = await reference_image.read()
            ref_pil = Image.open(io.BytesIO(ref_contents)).convert('RGB')
            ref_np = np.array(ref_pil)
            p, s, r = calculate_metrics(ref_np, enhanced_rgb)
            val_metrics = {
                "reference_available": True,
                "psnr": float(p),
                "ssim": float(s),
                "rmse": float(r)
            }
            
        uncertainty = compute_uncertainty(img_np, enhanced_rgb, scale)

        return {
            "success": True,
            "model": sr_model.model_name,
            "scale": scale,
            "processing_time": processing_time,
            "input": {
                "width": w,
                "height": h,
                "bands": c,
                "format": image.filename.split('.')[-1],
                "pixel_size": None
            },
            "output": {
                "width": enhanced_rgb.shape[1],
                "height": enhanced_rgb.shape[0],
                "format": "PNG",
                "download_url": download_url,
                "bicubic_url": bicubic_url if baseline else None
            },
            "metadata": {},
            "validation": val_metrics,
            "spectral_validation": {"status": "UNAVAILABLE", "message": "SPECTRAL VALIDATION UNAVAILABLE — RGB INPUT"},
            "uncertainty": uncertainty,
            "limitations": [
                "The generated fine-scale detail is model-reconstructed and should not be interpreted as newly observed ground-truth information.",
                "Visual SR currently operates on an RGB representation."
            ]
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

from backend.services.gemini_service import call_gemini

@router.post("/sr/analyze")
async def analyze_sr_image(
    image: UploadFile = File(...),
    query: str = Form(...)
):
    try:
        contents = await image.read()
        
        system_prompt = """
You are TerraRise, an expert Earth-observation AI. 
The user is providing an image (either the original medium-resolution observation or a super-resolved reconstruction).
Answer their query as a professional geospatial analyst. Do not invent details.
Format the output as a valid JSON object with the exact keys:
{
  "task": "downstream_analysis",
  "answer": "Your detailed response here."
}
        """
        
        result = call_gemini(
            system_prompt=system_prompt,
            user_prompt=query,
            image_bytes=contents,
            mime_type=image.content_type or "image/jpeg"
        )
        
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})
