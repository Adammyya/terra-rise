# SatQuery AI Architecture

## Architectural principle

The frontend and analysis engine are intentionally separated:

```text
React UI
   ↓
services/api
   ↓
FastAPI
   ↓
workflow orchestrator
   ↓
specialized agents
   ↓
Gemini / deterministic preprocessing
   ↓
structured analysis response
   ↓
Zustand
   ↓
Result / Evidence / Trace UI
```

Business logic should not live inside presentation components.

## Frontend

### `src/components/shell/`

Workstation shell, navigation, history, settings, authentication, and composition.

### `src/components/imagery/`

Imagery viewer, upload flow, zoom/pan, and evidence overlays.

### `src/components/query/`

Natural-language query input and request orchestration.

### `src/components/analysis/`

Results, confidence, uncertainty, traces, workflow visualization, temporal context, multimodal context, and report export.

### `src/store/`

Zustand state for:
- imagery
- analysis
- auth
- workspace/agent state

## Backend

### `backend/main.py`

FastAPI application and `/ai/analyze` endpoint.

### `backend/orchestrator/`

Task routing and workflow execution.

### `backend/agents/`

Specialized workflows for:
- VQA
- temporal comparison
- optical + SAR
- qualitative grounding

### `backend/services/gemini_service.py`

Shared Gemini service for:
- multimodal request creation
- language mirroring
- structured JSON
- retry handling
- quota/model errors
- TIFF preprocessing

### Database/auth

`backend/database.py`, `backend/models.py`, and auth routers provide PostgreSQL-backed identity and analysis history.

## Result contract

```json
{
  "task": "...",
  "workflow": "...",
  "answer": "...",
  "confidence": 0.0,
  "uncertainty": "...",
  "evidence": {
    "type": "...",
    "description": "...",
    "spatial_evidence_available": false,
    "requirements_status": "..."
  },
  "trace_events": [],
  "execution": {
    "model": "...",
    "workflow": "...",
    "agents": [],
    "latency_ms": 0
  }
}
```

## Multi-image execution

`/ai/analyze` may receive:
- one primary image
- an optional second image

Examples:
- T1 + T2 for temporal analysis
- optical + SAR for multimodal analysis

The semantic meaning of the second image is determined by the workflow.

## Evidence-first design

Keep three concepts distinct:

**Observation** — directly visible or reliably extracted.

**Inference** — model interpretation based on those observations.

**Limitation** — what the system cannot reliably establish.

## Future planner

The final orchestration layer should look like:

```text
Query
  ↓
Planner
  ↓
Analysis Plan
  ├── required inputs
  ├── selected agents
  ├── execution order
  └── evidence requirements
        ↓
Agent execution
        ↓
Evidence collection
        ↓
Evidence fusion
        ↓
Final explanation
```

Planning should be deterministic/local where possible and should not consume Gemini quota merely to select an agent.
