# Scientific Limitations and Trust Model

SatQuery AI is intended to demonstrate multimodal remote-sensing intelligence while clearly separating visible evidence from unsupported inference.

## Confidence

A confidence value returned by Gemini is a model output. It is not, by itself:
- benchmark accuracy
- statistical calibration
- probability of correctness
- independently validated scientific confidence

## Coordinates

Do not infer latitude/longitude from visual appearance.

Approximate image-relative regions must be labeled as image-relative visual evidence.

## SAR

A grayscale or processed SAR image may contain backscatter-related structural information. That does not imply access to:
- raw complex SAR data
- interferometric phase
- coherence
- full polarimetric information
- sensor calibration metadata

## Temporal change

A T1/T2 difference can result from true surface change or imaging conditions. Visual comparison should not automatically be described as confirmed physical change.

## GeoTIFF

RGB conversion may discard:
- additional bands
- radiometric detail
- sensor-specific values
- scientifically important raster information

Metadata extraction is not equivalent to full GIS analysis.

## Provenance

Do not claim a file is from a particular satellite, sensor, date, geographic region, or resolution without reliable source metadata.

## Evidence states

**Available** — directly provided or reliably computed.

**Unavailable** — required data is missing.

**Approximate** — visually or image-relatively inferred.

**Uncertain** — multiple plausible explanations remain.

This trust model is a core product requirement.
