# SatQuery AI Evaluation Plan

## Goal

Evaluate SatQuery as a multimodal remote-sensing assistant, not only as a conversational model.

## Evaluation dimensions

### Task routing

Measure whether queries reach the intended path:
- VQA
- temporal
- optical + SAR
- grounding
- composite intent

### Requirement handling

Verify honest behavior for:
- temporal without T2
- SAR without SAR
- unsupported file
- failed preprocessing

### Evidence availability

Record:
- evidence type
- evidence description
- spatial evidence
- temporal evidence
- multimodal evidence
- requirement status

### Response quality

For a labeled set, record:
- semantic answer agreement
- unsupported claims
- missing qualifications
- evidence consistency

### Confidence

Track confidence distributions and compare confidence behavior across successful, unsupported, and ambiguous inputs.

Do not call model confidence calibrated accuracy unless calibration has been independently evaluated.

## Example manifest

```json
{
  "id": "example-001",
  "task": "temporal",
  "query": "What changed between T1 and T2?",
  "image_t1": "path/to/t1.jpg",
  "image_t2": "path/to/t2.jpg",
  "expected_requirements_met": true,
  "reference_answer": "...",
  "reference_evidence": {
    "type": "TEMPORAL"
  }
}
```

## Automated testing

Prefer deterministic tests for:
- routing
- schema validation
- missing-input behavior
- TIFF preprocessing
- metadata extraction
- image normalization
- grounding-region validation
- evidence fusion

Mock Gemini in unit tests rather than repeatedly calling the live API.

## Live smoke testing

Use only a small number of manual end-to-end requests for deployment or presentation verification.
