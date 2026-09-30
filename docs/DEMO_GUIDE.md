# SatQuery AI Demo Guide

## Start

Backend:

```bash
cd backend
uvicorn main:app --reload
```

Frontend:

```bash
npm run dev
```

## Demo 1 — VQA

Use the built-in NASA Earthdata imagery.

Query:

```text
Describe this optical satellite observation in detail.
```

Expected:
- VQA task
- answer
- confidence
- uncertainty
- evidence
- execution trace

## Demo 2 — Temporal

Load T1 and T2.

Query:

```text
What changed between these two observations?
```

For the strongest scientific demonstration, use images of the same area from different dates.

## Demo 3 — Optical + SAR

Load:
- optical observation
- genuine SAR observation

Query:

```text
Compare the optical features with the SAR observation. What differences are visible?
```

Expected:
- optical analysis
- SAR analysis
- multimodal fusion
- multimodal evidence

## Demo 4 — TIFF

Upload a `.tif` or `.tiff` file.

The browser may show a TIFF preview placeholder while the backend preprocesses the file for Gemini.

Expected path:

```text
TIFF
→ backend
→ Pillow
→ RGB representation
→ Gemini
→ analysis
```

## Missing-data demos

Temporal without T2 should return a requirement state rather than fabricating a change result.

Optical + SAR without SAR should similarly return an input requirement state.

## Judge explanation

> SatQuery AI converts natural-language remote-sensing questions into inspectable analysis workflows. It can reason over single observations, compare temporal observations, correlate optical and SAR imagery, and return structured evidence, confidence, and uncertainty instead of only generating conversational text.

## Demo discipline

Avoid repeatedly submitting identical live Gemini queries. Use only the intended end-to-end demonstrations during presentation.
