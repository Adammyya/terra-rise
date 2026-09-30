# TerraRise Model Card

## FSRCNN — Fast Super-Resolution Convolutional Neural Network

---

### Model Identity

| Field | Value |
|-------|-------|
| **Model Name** | FSRCNN (Fast Super-Resolution Convolutional Neural Network) |
| **Variant** | FSRCNN (not FSRCNN-s) |
| **Architecture** | Convolutional neural network (5 layers) |
| **Implementation** | OpenCV DNN Super Resolution (`cv2.dnn_superres`) |
| **Weight Format** | TensorFlow `.pb` (frozen graph) |
| **Supported Scales** | 2× and 4× |

---

### Weight Files

| File | Scale | Source |
|------|-------|--------|
| `backend/models_weights/FSRCNN_x2.pb` | 2× | OpenCV contrib pre-trained weights |
| `backend/models_weights/FSRCNN_x4.pb` | 4× | OpenCV contrib pre-trained weights |

**Weight Source:** OpenCV DNN Super Resolution model zoo  
(https://github.com/Xilinx/mlperf_inference_community/tree/master/vision/classification_and_detection/tools/openCV-DNN-models or distributed with `opencv-contrib-python`)

**Pre-trained on:** BSD500 + ImageNet patches (RGB images, general domain)

**Fine-tuned on satellite imagery:** ❌ NO — these are general-purpose RGB weights

---

### Intended Use

TerraRise uses FSRCNN to reconstruct a higher-resolution representation of a medium-resolution satellite image by applying learned image priors.

**Appropriate uses:**
- Generating a finer output pixel grid for visual inspection
- Demonstrating deep-learning SR capability vs. bicubic interpolation
- Academic/research demonstration of SRM techniques
- Educational presentation of SR pipeline outputs

**Inappropriate uses (do not claim):**
- Recovering true physical ground-truth spatial information
- Replacing newly-captured high-resolution satellite imagery
- Making precise measurements from SR outputs
- Detecting objects at sub-pixel scales relative to the original input
- Claiming 2.5m resolution from a 10m input

---

### Input Format

| Property | Value |
|----------|-------|
| **Format** | PNG, JPEG, TIFF (RGB, 8-bit per channel) |
| **Color space** | RGB (3-channel) |
| **Bit depth** | 8-bit uint8 |
| **Multispectral** | ❌ Not supported — RGB representation only |
| **Maximum input** | Configurable via `SR_MAX_INPUT_PIXELS` (default: 1,000,000 px) |

---

### Output Format

| Property | Value |
|----------|-------|
| **Format** | PNG |
| **Color space** | RGB |
| **Dimensions** | input_width × scale, input_height × scale |
| **Maximum output** | Configurable via `SR_MAX_OUTPUT_PIXELS` (default: 4,000,000 px) |

---

### Execution Environment

| Property | Value |
|----------|-------|
| **Hardware** | CPU (no GPU required) |
| **Runtime** | OpenCV DNN (`cv2.dnn_superres.DnnSuperResImpl`) |
| **Thread control** | `SR_CPU_THREADS` environment variable (default: 2) |
| **Inference mode** | Synchronous (offloaded to thread pool via `asyncio.to_thread`) |

---

### Performance (approximate, CPU-only)

> Timings are highly hardware-dependent. These are rough estimates on a 4-core laptop.

| Input | Scale | Approximate Time |
|-------|-------|-----------------|
| 256×256 | 2× | 0.5–2s |
| 512×512 | 2× | 2–8s |
| 512×512 | 4× | 8–30s |
| 1000×1000 | 2× | 15–60s |

**4× is significantly slower than 2×.** For initial testing, always use 2×.

---

### Known Limitations

1. **Not trained on satellite imagery.** FSRCNN was trained on general RGB images. Fine-scale structures specific to remote sensing (field boundaries, road textures, building edges) may not be reconstructed faithfully.

2. **RGB only.** Multi-spectral bands (NIR, SWIR, etc.) are not processed. Only visible RGB is super-resolved.

3. **Model-reconstructed detail.** All fine-scale detail added by the model is a learned reconstruction, not a new observation. It should not be used for precise measurement or ground-truth comparison without validation.

4. **Ringing and blocking artifacts.** FSRCNN can produce compression-like artifacts at high contrast edges, particularly at 4×.

5. **CPU speed.** Inference is slow on CPU. Large images at 4× can take minutes. Use the pixel limits.

6. **No geospatial-aware training.** The model has no understanding of satellite geometry, sensor noise, or spectral physics.

7. **No calibrated uncertainty.** The uncertainty score is a heuristic (FSRCNN vs. bicubic difference), not a calibrated probabilistic confidence estimate.

---

### Quality Metrics

Metrics are computed **only** when a trusted high-resolution reference image is provided.

| Metric | Description |
|--------|-------------|
| **PSNR** | Peak Signal-to-Noise Ratio (dB) — higher is better |
| **SSIM** | Structural Similarity Index — 0 to 1, higher is better |
| **RMSE** | Root Mean Square Error — lower is better |

**Never fabricate metrics.** If no reference is provided, all metric fields show `null`.

---

### Licensing

FSRCNN architecture: Dong et al., 2016 — "Accelerating the Super-Resolution Convolutional Neural Network"  
OpenCV DNN weights: Distributed under Apache 2.0 or OpenCV license as part of opencv-contrib.

Please verify the exact license of the `.pb` weight files you are using before commercial deployment.

---

### Scientific Citation

```
C. Dong, C. C. Loy, and X. Tang.
Accelerating the Super-Resolution Convolutional Neural Network.
ECCV 2016.
```

---

### Changelog

| Date | Change |
|------|--------|
| 2026-09-30 | Initial TerraRise integration, performance fixes, file-based output serving |
