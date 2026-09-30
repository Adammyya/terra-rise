# TerraRise

### Deep Learning Super-Resolution Mapping for Medium-Resolution Satellite Imagery

TerraRise is an Earth-observation workstation focused on **deep-learning-based super-resolution of medium-resolution satellite imagery**. The goal is to produce higher-resolution reconstructions that are easier to inspect and more useful for downstream remote-sensing analysis, while making uncertainty, validation, and geospatial context visible to the user.

> **Scientific principle:** a super-resolved image is a model-generated reconstruction on a finer output pixel grid. It is not equivalent to newly observed high-resolution ground-truth imagery.

---

## Why TerraRise?

Medium-resolution satellite imagery provides wide-area coverage and frequent observations, but its spatial detail can be insufficient for tasks such as:

- identifying smaller built-up structures
- tracing narrow roads
- inspecting field boundaries
- examining localized surface changes
- supporting detailed urban, agricultural, and disaster analysis

TerraRise is designed to explore how **deep-learning super-resolution** can improve the visual and analytical usefulness of these observations.

---

## Product Vision

TerraRise follows the workflow:

```text
IMPORT
   ↓
INSPECT
   ↓
PREPROCESS
   ↓
SUPER-RESOLVE
   ↓
VALIDATE
   ↓
COMPARE
   ↓
EXPLAIN
   ↓
EXPORT
```

The intended experience is not simply:

```text
image → resize → download
```

Instead:

```text
medium-resolution imagery
        ↓
deep-learning reconstruction
        ↓
original vs enhanced comparison
        ↓
quality assessment
        ↓
uncertainty / artifact awareness
        ↓
geospatial and metadata inspection
        ↓
downstream remote-sensing analysis
        ↓
scientific report
```

---

## Core Capabilities

The TerraRise architecture is being developed around the following capabilities:

### Deep-Learning Super-Resolution

A genuine pretrained super-resolution model is intended to generate the enhanced imagery.

TerraRise should **not** treat bicubic interpolation, resizing, sharpening, or interpolation-only methods as the primary SR model.

### 2× / 4× Reconstruction

The interface is designed to support selectable scaling factors such as:

```text
2×
4×
```

The output represents a **finer reconstructed pixel grid**, not guaranteed physical ground-truth resolution.

### Original vs Super-Resolved Comparison

The workstation is designed to support:

- split view
- side-by-side comparison
- swipe comparison
- synchronized zoom/pan
- reconstructed-detail difference view

### Quality Assessment

Where an appropriate high-resolution reference is available, TerraRise is intended to support quantitative validation such as:

- PSNR
- SSIM
- RMSE

When a reference image is unavailable, TerraRise should explicitly report that quantitative reference validation is unavailable rather than inventing values.

### Spectral Consistency

For compatible multispectral inputs, the project is designed to preserve and assess spectral information where the chosen model and processing pipeline support it.

For RGB-only processing, TerraRise must clearly label the limitation rather than claiming full multispectral super-resolution.

### Uncertainty and Artifact Awareness

TerraRise is intended to distinguish:

- observed information
- model-reconstructed detail
- uncertain regions
- validation-supported results
- unsupported claims

### Geospatial Metadata

For TIFF/GeoTIFF inputs, the system is designed to inspect and preserve reliable metadata where practical, including:

- CRS
- pixel scale
- tiepoints
- transform
- dimensions
- band count
- data type

Metadata must never be fabricated.

### Optional Downstream Analysis

An optional natural-language analysis layer may be used after super-resolution for questions such as:

> What structures appear more distinguishable after enhancement?

> Compare the original and enhanced imagery.

This analysis is secondary. **The super-resolution pipeline must not depend on Gemini availability.**

---

## Scientific Limitations

Super-resolution is an inference problem.

TerraRise must not claim that it:

- creates ground-truth information that was never observed
- guarantees true physical resolution improvement
- converts a 10 m observation into true 2.5 m ground truth
- provides scientifically validated metrics without a suitable reference
- preserves all spectral information when processing is RGB-only
- preserves geospatial metadata when the output format or pipeline cannot safely do so

A key product statement is:

> **Generated fine-scale details are model-reconstructed and should be treated as inferred information rather than newly observed ground truth.**

---

## Architecture

The project builds on a React + FastAPI architecture inherited from the original remote-sensing workstation and is being adapted around a dedicated SR pipeline.

### Frontend

```text
React
├── Scientific workstation UI
├── Imagery viewer
├── SR controls
├── Original / enhanced comparison
├── Quality metrics
├── Uncertainty
├── Metadata
├── Reports
└── Download / export
```

### Backend

```text
FastAPI
├── Image validation
├── Metadata extraction
├── Preprocessing
├── Super-resolution service
├── Validation metrics
├── Export
└── Optional analysis services
```

### Intended SR flow

```text
Upload
  ↓
Validate
  ↓
Inspect metadata
  ↓
Preprocess
  ↓
Deep-learning SR model
  ↓
Postprocess
  ↓
Validation
  ↓
Comparison
  ↓
Export
```

---

## Technology Direction

The current repository is based on:

- React
- Vite
- FastAPI
- Python
- Tailwind CSS
- Zustand
- TIFF / GeoTIFF processing tools

The exact SR model and inference implementation should be documented here once the model is selected and validated.

Candidate deployment-safe directions include lightweight pretrained deep-learning super-resolution models such as:

- FSRCNN
- EDSR
- another verified lightweight pretrained SR model

The final model should be selected based on:

1. genuine deep-learning inference
2. reproducibility
3. CPU/deployment feasibility
4. 2× / 4× support where available
5. model-weight availability and licensing
6. reliable local and hosted execution

---

## Validation Strategy

TerraRise should distinguish between:

### Reference-based validation

When a trusted high-resolution reference exists:

```text
Medium-resolution input
        ↓
TerraRise SR
        ↓
Super-resolved output
        ↓
Compare with reference
        ↓
PSNR / SSIM / RMSE
```

### No-reference mode

When no reference exists:

```text
Super-resolved output
        ↓
Qualitative inspection
        ↓
Uncertainty / artifact analysis
```

No-reference mode must not invent PSNR, SSIM, or RMSE.

---

## Baseline Comparison

Where practical, TerraRise can compare the deep-learning model against a classical interpolation baseline:

```text
Bicubic
    vs
Deep-Learning SR
```

This helps demonstrate that the system is not simply resizing the image.

---

## Intended Applications

TerraRise is designed with downstream remote-sensing scenarios in mind, including:

- urban analysis
- agricultural monitoring
- land-cover interpretation
- disaster assessment
- localized surface inspection
- feature visibility analysis

The project focuses on **improving interpretability and analytical utility**, not replacing ground-truth measurements.

---

## Current Project Status

This repository is the TerraRise development branch created from the stable SATQUERY-AI foundation.

The existing infrastructure provides a starting point for:

- satellite imagery upload
- TIFF/GeoTIFF handling
- scientific workstation UI
- reports
- authentication/history
- evaluation utilities
- responsive frontend structure

The dedicated TerraRise super-resolution pipeline is being implemented and validated in this repository.

Feature claims in this README should be updated as implementation and validation are completed.

---

## Local Development

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r ../requirements.txt
uvicorn main:app --reload
```

The exact SR model setup may add an additional model-weight/download step. That step should be documented once the selected model is finalized.

---

## Testing

Useful checks include:

```bash
npm run build
python -m compileall backend
git diff --check
```

For the SR system, deterministic tests should cover:

- image validation
- supported formats
- scale selection
- model loading
- output dimensions
- TIFF / GeoTIFF metadata
- reference-image validation
- PSNR / SSIM / RMSE
- baseline comparison
- uncertainty states
- download/export
- API error handling

Gemini calls should not be required for SR unit tests.

---

## Deployment

### Frontend

Vercel

Typical production setting:

```text
VITE_API_URL=<TerraRise backend URL>
```

### Backend

Render

Typical start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Production deployment should use environment variables for configuration and must never commit API secrets.

---

## Project Structure

A target structure for the TerraRise implementation is:

```text
TERRA-RISE/
├── backend/
│   ├── services/
│   │   └── super_resolution_service.py
│   ├── eval/
│   └── ...
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CAPABILITIES.md
│   ├── SCIENTIFIC_LIMITATIONS.md
│   ├── DEMO_GUIDE.md
│   ├── EVALUATION.md
│   ├── MODEL_CARD.md
│   └── terra-rise-ref.jpeg
│
├── public/
├── src/
│   ├── components/
│   │   └── srm/
│   ├── services/
│   │   └── api/
│   │       └── srApi.js
│   ├── store/
│   │   └── srStore.js
│   └── ...
│
├── package.json
├── requirements.txt
├── vite.config.js
└── README.md
```

---

## Roadmap

### Phase 1 — Core SR

- [ ] Select and integrate pretrained deep-learning SR model
- [ ] 2× inference
- [ ] 4× inference
- [ ] CPU-safe inference
- [ ] API contract

### Phase 2 — Scientific Inspection

- [ ] Original vs enhanced viewer
- [ ] Difference view
- [ ] Metadata inspection
- [ ] GeoTIFF handling
- [ ] Uncertainty representation

### Phase 3 — Validation

- [ ] Optional reference imagery
- [ ] PSNR
- [ ] SSIM
- [ ] RMSE
- [ ] Bicubic baseline
- [ ] Spectral consistency where supported

### Phase 4 — Productization

- [ ] Downloadable enhanced imagery
- [ ] Scientific report
- [ ] Responsive mobile layout
- [ ] Vercel deployment
- [ ] Render deployment
- [ ] Demo dataset
- [ ] Hackathon demo workflow

---

## Responsible AI / Remote-Sensing Note

TerraRise is intended to make model-assisted Earth-observation interpretation more useful while preserving transparency about what the model can and cannot establish.

A visually sharper reconstruction is not automatically a scientifically more accurate observation.

For decision-making applications, outputs should be validated against appropriate reference data and interpreted with the reported limitations and uncertainty.

---

## License

Add the project's chosen license once the final model, pretrained weights, and dependency licenses have been reviewed.

---

## Acknowledgement

TerraRise is built as an independent hackathon research prototype focused on practical deep-learning super-resolution for Earth-observation imagery.
