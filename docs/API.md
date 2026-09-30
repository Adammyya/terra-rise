# SatQuery AI API Notes

## POST `/ai/analyze`

### Multipart form

```text
query   = natural-language query
image   = primary observation
image2  = optional second observation
```

The second image is used for workflows such as temporal comparison and optical + SAR analysis.

### Authorization

Authenticated requests may include:

```http
Authorization: Bearer <token>
```

### Response

```json
{
  "task": "satellite_vqa",
  "workflow": "Single Image VQA",
  "answer": "...",
  "confidence": 0.95,
  "uncertainty": "...",
  "evidence": {
    "type": "VISUAL",
    "description": "...",
    "spatial_evidence_available": false,
    "requirements_status": "..."
  },
  "trace_events": [],
  "execution": {
    "model": "gemini-2.5-flash",
    "workflow": "Single Image VQA",
    "agents": ["vqa_agent"],
    "latency_ms": 1234
  },
  "image": {
    "filename": "example.jpg",
    "mime_type": "image/jpeg"
  }
}
```

Extended responses may include metadata for a second observation and future evidence fields.

## Error semantics

Typical classes include:
- `400` — invalid/missing input
- `429` — model quota/capacity unavailable
- `503` — backend/model/service failure

## Authentication

Authentication and history routes live under:

```text
/api/auth
```

They include registration, login, current-user lookup, and analysis-history functionality.

## Contract principles

1. Do not fabricate unavailable evidence.
2. Keep optional fields nullable.
3. Preserve single-image compatibility.
4. Give the second image an explicit semantic role.
5. Separate metadata facts from model interpretation.
