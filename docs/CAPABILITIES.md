# SatQuery AI Capabilities

## Single-image VQA

One observation plus a natural-language question produces:
- direct answer
- confidence
- uncertainty
- evidence
- execution trace

Example:

```text
What vegetation patterns are visible in this observation?
```

## Scene description

Users can request a structured visual description of visible land-surface and scene characteristics.

## Temporal comparison

### Inputs

```text
T1 — earlier/baseline observation
T2 — later/comparison observation
```

Example:

```text
What changed between these observations?
```

Interpretation must account for:
- alignment
- illumination
- seasonality
- atmosphere
- clouds
- sensor differences

## Optical + SAR

### Inputs

```text
Optical observation
SAR observation
```

The current implementation performs visual cross-modal correlation. It is not raw SAR signal processing.

## TIFF / GeoTIFF

TIFF/GeoTIFF files can be accepted and visually processed through an RGB representation. RGB conversion may discard additional bands.

## Grounding

The current grounding path provides qualitative location reasoning. Exact metric coordinates or validated geographic bounding boxes must not be fabricated.

## Evidence

Evidence may include:
- visual observations
- temporal evidence
- multimodal evidence
- requirements status
- spatial regions
- raster metadata
- uncertainty

## Reports

The workstation can export a text intelligence report containing:
- query
- task/workflow
- answer
- confidence
- uncertainty
- evidence
- requirement/limitation notes
