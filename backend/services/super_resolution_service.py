"""
TerraRise -- Super-Resolution Service
Model: FSRCNN (Fast Super-Resolution Convolutional Neural Network)
Backend: OpenCV DNN Super Resolution
Device: CPU
Weights: FSRCNN_x2.pb, FSRCNN_x4.pb

IMPORTANT: This service implements real deep-learning SR inference.
Do NOT replace with cv2.resize, PIL resize, or any interpolation method.
Bicubic interpolation exists ONLY as a comparison baseline.
"""
import cv2
from cv2 import dnn_superres
import os
import asyncio
import numpy as np
from skimage.metrics import peak_signal_noise_ratio as psnr, structural_similarity as ssim

# -
# CPU thread guard
# OpenCV DNN runs multi-threaded by default.
# Unconstrained, it will consume ALL available cores, making
# the machine unresponsive during inference.
# 2 threads is a safe default for a development/CI CPU environment.
# Increase SR_CPU_THREADS for production multi-core servers.
# -
_CPU_THREADS = int(os.getenv("SR_CPU_THREADS", "2"))
cv2.setNumThreads(_CPU_THREADS)

# -
# Input / output pixel safety limits
# Default: 1,000,000 input pixels (e.g. 1000x1000)
# A 4x run on 1000x1000 yields 4000x4000 = 16M pixels -- too large
# for CPU inference without significant latency.
# -
SR_MAX_INPUT_PIXELS: int = int(os.getenv("SR_MAX_INPUT_PIXELS", "1000000"))
SR_MAX_OUTPUT_PIXELS: int = int(os.getenv("SR_MAX_OUTPUT_PIXELS", "5000000"))

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "..", "models_weights")


class SuperResolutionModel:
    """
    FSRCNN super-resolution model wrapper.

    Caches loaded models by scale so weights are not reloaded per-request.
    Thread safety note: OpenCV DNN models are NOT thread-safe. When using
    asyncio.to_thread(), each call gets its own GIL slot but shares state.
    For production multi-worker setups, use per-worker model instances.
    """

    def __init__(self, model_name: str = "FSRCNN"):
        self.model_name = model_name
        self.supported_scales = [2, 4]
        self._sr_models: dict = {}

    # ------------------------------------------------------------------
    def load(self, scale: int) -> dnn_superres.DnnSuperResImpl:
        """Load and cache the FSRCNN model for the given scale."""
        if scale not in self.supported_scales:
            raise ValueError(
                f"Scale {scale}x is not supported. "
                f"Supported: {self.supported_scales}"
            )

        if scale not in self._sr_models:
            sr = dnn_superres.DnnSuperResImpl_create()
            model_path = os.path.normpath(
                os.path.join(WEIGHTS_DIR, f"{self.model_name}_x{scale}.pb")
            )

            if not os.path.exists(model_path):
                raise FileNotFoundError(
                    f"SR model weights not found: {model_path}\n"
                    f"Download FSRCNN weights and place them in backend/models_weights/."
                )

            sr.readModel(model_path)
            sr.setModel(self.model_name.lower(), scale)
            self._sr_models[scale] = sr

            print("========================================")
            print(f"[SR] model:   {self.model_name}")
            print(f"[SR] device:  CPU (OpenCV DNN, threads={_CPU_THREADS})")
            print(f"[SR] weights: {model_path}")
            print(f"[SR] scale:   {scale}x")
            print("[SR] status:  READY")
            print("========================================")

        return self._sr_models[scale]

    # ------------------------------------------------------------------
    def _check_size_limits(self, h: int, w: int, scale: int) -> None:
        """
        Validate input and output pixel counts before inference.
        Raises ValueError with a human-readable message if limits are exceeded.
        We check BEFORE inference so the server never hangs on a predictable
        large-image rejection.
        """
        input_pixels = h * w
        output_pixels = (h * scale) * (w * scale)

        if input_pixels > SR_MAX_INPUT_PIXELS:
            raise ValueError(
                f"Input image is too large for CPU super-resolution "
                f"({w}x{h} = {input_pixels:,} pixels, "
                f"limit: {SR_MAX_INPUT_PIXELS:,} pixels). "
                f"Please use a smaller image or crop the region of interest."
            )

        if output_pixels > SR_MAX_OUTPUT_PIXELS:
            raise ValueError(
                f"{scale}x reconstruction would produce an output of "
                f"{w*scale}x{h*scale} = {output_pixels:,} pixels, "
                f"which exceeds the CPU output limit ({SR_MAX_OUTPUT_PIXELS:,} pixels). "
                f"Try 2x or a smaller input image."
            )

    # ------------------------------------------------------------------
    def enhance(self, image_bgr: np.ndarray, scale: int) -> np.ndarray:
        """
        Run FSRCNN super-resolution on a BGR image (OpenCV convention).

        This is a SYNCHRONOUS call. The FastAPI route must call this
        inside asyncio.to_thread() to avoid blocking the event loop.

        Returns: super-resolved BGR image.
        """
        h, w = image_bgr.shape[:2]
        self._check_size_limits(h, w, scale)

        sr = self.load(scale)
        print(f"[SR] inference: {w}x{h} -> {w*scale}x{h*scale} (scale={scale}x)")
        return sr.upsample(image_bgr)


# Module-level singleton -- loaded once, reused across requests
sr_model = SuperResolutionModel()


# -
# Quality metrics
# -

def calculate_metrics(
    reference_rgb: np.ndarray,
    enhanced_rgb: np.ndarray,
) -> tuple[float, float, float]:
    """
    Compute PSNR, SSIM, RMSE between reference and enhanced images.

    If dimensions differ, the enhanced image is resized to match the reference
    using bicubic interpolation before metric calculation.

    Returns: (psnr_db, ssim, rmse)
    """
    if reference_rgb.shape != enhanced_rgb.shape:
        enhanced_rgb = cv2.resize(
            enhanced_rgb,
            (reference_rgb.shape[1], reference_rgb.shape[0]),
            interpolation=cv2.INTER_CUBIC,
        )

    ref_f = reference_rgb.astype(np.float32)
    enh_f = enhanced_rgb.astype(np.float32)

    p = psnr(reference_rgb, enhanced_rgb, data_range=255)
    s = ssim(
        reference_rgb,
        enhanced_rgb,
        multichannel=True,
        channel_axis=-1,
        data_range=255,
    )
    r = float(np.sqrt(np.mean((ref_f - enh_f) ** 2)))

    return float(p), float(s), r


# -
# Uncertainty estimation
# -

def compute_uncertainty(
    original_rgb: np.ndarray,
    enhanced_rgb: np.ndarray,
    scale: int,
) -> dict:
    """
    Compute a heuristic reconstruction uncertainty score by comparing the
    FSRCNN output against a bicubic baseline at the same output resolution.

    A large pixel-level difference indicates the model is hallucinating
    detail not supported by the input -- HIGH uncertainty.
    A small difference indicates the SR output is close to simple upsampling.

    Categories:
        LOW      -- reconstruction closely matches bicubic baseline
        MODERATE -- moderate structural changes introduced by the model
        HIGH     -- significant model-reconstructed detail; treat with caution

    This is a heuristic, NOT a calibrated probabilistic confidence measure.
    """
    bicubic = cv2.resize(
        original_rgb,
        (enhanced_rgb.shape[1], enhanced_rgb.shape[0]),
        interpolation=cv2.INTER_CUBIC,
    )
    diff = np.abs(
        enhanced_rgb.astype(np.float32) - bicubic.astype(np.float32)
    )
    mean_diff = float(np.mean(diff))

    if mean_diff < 5.0:
        level = "LOW"
        desc = (
            "Reconstruction closely matches bicubic baseline. "
            "The model has introduced minimal additional detail."
        )
    elif mean_diff < 15.0:
        level = "MODERATE"
        desc = (
            "Moderate reconstruction changes detected. "
            "The model has introduced some additional structure -- "
            "review fine details carefully before interpretation."
        )
    else:
        level = "HIGH"
        desc = (
            "High uncertainty: the source observation contains limited "
            "high-frequency information. Fine structures in this reconstruction "
            "are largely model-generated and should not be interpreted as "
            "newly observed ground-truth information."
        )

    return {
        "level": level,
        "mean_difference": mean_diff,
        "description": desc,
        "note": (
            "Uncertainty is a heuristic based on FSRCNN vs bicubic difference. "
            "It is not a calibrated probability."
        ),
    }
