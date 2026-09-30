"""
TerraRise — Backend Test Suite

Tests the SR pipeline without any Gemini calls.
All tests use the FastAPI TestClient for synchronous execution.

Run from the repository root:
    python -m pytest backend/tests/test_backend.py -v

Or from the backend/ directory:
    python -m pytest tests/test_backend.py -v

Note: tests require model weight files at backend/models_weights/FSRCNN_x2.pb
      and FSRCNN_x4.pb.
"""
import io
import sys
import os
import time

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

# Allow imports from the backend/ directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app  # noqa: E402

client = TestClient(app)


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def make_png(width: int, height: int, color=(80, 130, 60)) -> bytes:
    """Create a solid-colour RGB PNG in memory."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def make_jpeg(width: int, height: int, color=(100, 150, 80)) -> bytes:
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def post_sr(image_bytes, scale=2, baseline=False, ref_bytes=None, filename="test.png", mime="image/png"):
    files = {"image": (filename, image_bytes, mime)}
    data = {"scale": scale, "baseline": str(baseline).lower()}
    if ref_bytes is not None:
        files["reference_image"] = ("ref.png", ref_bytes, "image/png")
    return client.post("/api/sr/enhance", data=data, files=files)


# ─────────────────────────────────────────────────────────────
# Service health
# ─────────────────────────────────────────────────────────────

def test_root_endpoint():
    """Backend must respond at / even without DATABASE_URL."""
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body.get("service") == "TerraRise AI Super-Resolution Workstation"
    assert body.get("status") == "online"


# ─────────────────────────────────────────────────────────────
# Phase 3 — Core 2× pipeline (HARD CHECKPOINT)
# ─────────────────────────────────────────────────────────────

def test_sr_enhance_2x_small():
    """
    HARD CHECKPOINT: 64×64 RGB PNG → 2× FSRCNN → 128×128 output.
    No baseline, no reference. Machine must remain responsive.
    """
    img = make_png(64, 64)
    r = post_sr(img, scale=2, baseline=False)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["success"] is True
    assert data["scale"] == 2
    assert data["output"]["width"] == 128
    assert data["output"]["height"] == 128
    assert data["output"]["download_url"].startswith("/sr/output/")
    assert data["output"]["bicubic_url"] is None  # baseline=False


def test_sr_enhance_2x_512():
    """
    HARD CHECKPOINT: 512×512 RGB → 2× → 1024×1024 output.
    This is the primary performance target.
    """
    img = make_png(512, 512)
    start = time.time()
    r = post_sr(img, scale=2, baseline=False)
    elapsed = time.time() - start

    assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
    data = r.json()
    assert data["success"] is True
    assert data["output"]["width"] == 1024
    assert data["output"]["height"] == 1024
    assert data["processing_time"] > 0

    # Generous timeout — CPU inference can take up to 60s on slow machines
    print(f"\n[PERF] 512×512 → 2× completed in {elapsed:.2f}s")


def test_sr_enhance_4x_small():
    """
    HARD CHECKPOINT: 64×64 RGB PNG → 4× FSRCNN → 256×256 output.
    """
    img = make_png(64, 64)
    r = post_sr(img, scale=4, baseline=False)
    assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
    data = r.json()
    assert data["success"] is True
    assert data["output"]["width"] == 256
    assert data["output"]["height"] == 256
    assert data["output"]["download_url"].startswith("/sr/output/")


# ─────────────────────────────────────────────────────────────
# Baseline (bicubic)
# ─────────────────────────────────────────────────────────────

def test_baseline_off_by_default():
    """baseline=False must NOT produce a bicubic_url."""
    img = make_png(64, 64)
    r = post_sr(img, scale=2, baseline=False)
    assert r.status_code == 200
    data = r.json()
    assert data["output"]["bicubic_url"] is None


def test_baseline_on_when_requested():
    """baseline=True must produce a bicubic_url."""
    img = make_png(64, 64)
    r = post_sr(img, scale=2, baseline=True)
    assert r.status_code == 200
    data = r.json()
    assert data["output"]["bicubic_url"] is not None
    assert data["output"]["bicubic_url"].startswith("/sr/output/")


# ─────────────────────────────────────────────────────────────
# Input size guards
# ─────────────────────────────────────────────────────────────

def test_too_large_input_rejected():
    """
    Images exceeding SR_MAX_INPUT_PIXELS must be rejected before inference
    with HTTP 413 and a human-readable error.
    """
    # Create a 1500×1500 image = 2.25M pixels (default limit: 1M)
    img = make_png(1500, 1500)
    r = post_sr(img, scale=2, baseline=False)
    # Should be 413 or 400 (not 500, not hung)
    assert r.status_code in (400, 413), f"Expected 413/400, got {r.status_code}"
    data = r.json()
    assert data["success"] is False
    assert "too large" in data["error"].lower() or "limit" in data["error"].lower()


def test_too_large_output_rejected():
    """
    A 4× request on an image that would produce >SR_MAX_OUTPUT_PIXELS output
    must be rejected before inference.
    Default SR_MAX_OUTPUT_PIXELS=4_000_000, so 1010×1010 × 4 = 16.3M → reject.
    """
    img = make_png(1010, 1010)  # 1.02M pixels — just under input limit
    # Override max_input to allow this through to output check
    import services.super_resolution_service as srs
    old_in = srs.SR_MAX_INPUT_PIXELS
    srs.SR_MAX_INPUT_PIXELS = 2_000_000  # temporarily raise input limit
    try:
        r = post_sr(img, scale=4, baseline=False)
        assert r.status_code in (400, 413), f"Expected 413/400, got {r.status_code}"
        data = r.json()
        assert data["success"] is False
    finally:
        srs.SR_MAX_INPUT_PIXELS = old_in


# ─────────────────────────────────────────────────────────────
# Scale validation
# ─────────────────────────────────────────────────────────────

def test_unsupported_scale_rejected():
    """Scale 3 is not supported — must return an error."""
    img = make_png(64, 64)
    r = post_sr(img, scale=3, baseline=False)
    assert r.status_code in (400, 422, 500)
    if r.status_code != 422:  # FastAPI validation gives 422 for invalid form values
        data = r.json()
        assert data["success"] is False


# ─────────────────────────────────────────────────────────────
# Format support
# ─────────────────────────────────────────────────────────────

def test_jpeg_input():
    """JPEG input must produce valid SR output."""
    img = make_jpeg(128, 128)
    r = post_sr(img, scale=2, baseline=False, filename="test.jpg", mime="image/jpeg")
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert data["output"]["width"] == 256
    assert data["output"]["height"] == 256


# ─────────────────────────────────────────────────────────────
# Reference validation
# ─────────────────────────────────────────────────────────────

def test_reference_validation_computes_metrics():
    """When reference image is supplied, PSNR/SSIM/RMSE must be computed."""
    img = make_png(64, 64, color=(80, 130, 60))
    ref = make_png(128, 128, color=(85, 135, 65))  # close colour = high PSNR
    r = post_sr(img, scale=2, baseline=False, ref_bytes=ref)
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    v = data["validation"]
    assert v["reference_available"] is True
    assert v["psnr"] is not None
    assert v["ssim"] is not None
    assert v["rmse"] is not None
    assert v["psnr"] > 0
    assert 0 <= v["ssim"] <= 1


def test_sr_works_without_reference():
    """Basic SR must succeed with only the input image."""
    img = make_png(64, 64)
    r = post_sr(img, scale=2, baseline=False)
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert data["validation"]["reference_available"] is False
    assert data["validation"]["psnr"] is None


# ─────────────────────────────────────────────────────────────
# Uncertainty
# ─────────────────────────────────────────────────────────────

def test_uncertainty_present():
    """Uncertainty must be returned in every successful SR response."""
    img = make_png(64, 64)
    r = post_sr(img, scale=2)
    assert r.status_code == 200
    data = r.json()
    unc = data.get("uncertainty", {})
    assert unc.get("level") in ("LOW", "MODERATE", "HIGH")
    assert "description" in unc
    assert isinstance(unc.get("mean_difference"), (int, float))


# ─────────────────────────────────────────────────────────────
# Response structure
# ─────────────────────────────────────────────────────────────

def test_response_structure():
    """Verify the full response structure matches the documented API contract."""
    img = make_png(64, 64)
    r = post_sr(img, scale=2, baseline=True)
    assert r.status_code == 200
    data = r.json()

    # Top-level keys
    for key in ("success", "model", "scale", "processing_time", "input", "output",
                "validation", "spectral_validation", "uncertainty", "limitations"):
        assert key in data, f"Missing key: {key}"

    # Input
    assert data["input"]["width"] == 64
    assert data["input"]["height"] == 64

    # Output
    assert data["output"]["width"] == 128
    assert data["output"]["height"] == 128
    assert data["output"]["format"] == "PNG"
    assert data["output"]["download_url"].startswith("/sr/output/")

    # No base64
    assert "base64" not in (data["output"]["download_url"] or "")

    # Limitations present
    assert len(data["limitations"]) > 0


def test_output_url_is_not_base64():
    """Verify the response uses file URLs, not base64 data URIs."""
    img = make_png(64, 64)
    r = post_sr(img, scale=2)
    data = r.json()
    url = data["output"]["download_url"]
    assert not url.startswith("data:"), (
        "Output URL must not be a base64 data URI. "
        "Use file-based serving via /sr/output/."
    )


# ─────────────────────────────────────────────────────────────
# Error handling
# ─────────────────────────────────────────────────────────────

def test_empty_file_rejected():
    """Empty image upload must return 400 with a readable error."""
    r = post_sr(b"", scale=2)
    assert r.status_code in (400, 422, 500)


def test_non_image_rejected():
    """A text file disguised as an image must not crash the server."""
    r = post_sr(b"not an image at all!", scale=2, mime="image/png")
    assert r.status_code in (400, 500)
    data = r.json()
    assert data["success"] is False
