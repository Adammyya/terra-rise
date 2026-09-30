# SatQuery AI - Remote-Sensing Intelligence Workstation

## Project Overview
SatQuery AI is an advanced, multimodal visual question answering (VQA) and intelligence platform designed for Earth observation data. It bridges the gap between complex satellite imagery (Optical, SAR, Multi-temporal) and actionable natural language insights.

### SIH Problem Statement Context
This project addresses the critical need for rapid, accessible interpretation of satellite data for disaster management, agricultural monitoring, and urban planning. It provides a farmer-friendly, multi-lingual, and highly capable AI agent that translates raw pixels into structured operational intelligence.

## Architecture & Workflows
SatQuery AI follows a strict **ASK → UNDERSTAND → ANALYZE → EVIDENCE → EXPLAIN → VERIFY** loop.
1. **ASK:** User submits a natural language query in English, Hindi, or Hinglish, alongside satellite imagery (T1, T2, SAR, or GeoTIFF).
2. **UNDERSTAND:** A deterministic planner parses the intent and requires inputs (e.g., temporal routing requires T2).
3. **ANALYZE:** Modular agents execute specific analysis tasks via multimodal LLM inference (Gemini 2.5 Flash).
4. **EVIDENCE:** The system extracts structured evidence (visual bounding boxes, geospatial metadata, pixel-difference ratios).
5. **EXPLAIN:** Findings are presented in the user's requested language.
6. **VERIFY:** Execution traces, confidence metrics, and visual overlays are rendered for human-in-the-loop validation.

## Supported Analysis Capabilities
- **Single-Image VQA:** General semantic querying over any uploaded optical satellite image.
- **Scene Description:** Qualitative categorization and summarization of land-cover.
- **Temporal Change Detection:** Bi-temporal (T1/T2) visual difference calculation, bounding box extraction, and semantic change description.
- **Optical + SAR Fusion:** Multimodal correlation between visual optical features and SAR backscatter amplitude proxies.
- **Spatial Grounding:** Approximate, image-relative visual bounding box localization (normalized coordinates).
- **TIFF/GeoTIFF Ingestion:** Automated backend normalization to RGB for visual inspection, with metadata extraction (Pixel Scale, Tiepoints, Band Count).

## Evidence Schema & Uncertainty
All agent outputs conform to a strict JSON evidence contract. The system forces models to return a `confidence` metric (0.0-1.0) and an `uncertainty` string explaining limitations (e.g., poor alignment, cloud cover). Evidence includes `regions`, `geospatial_metadata`, and `visual_difference_available`.

## Scientific Limitations (Honesty First)
- **Geospatial Grounding:** Coordinates returned by the AI are normalized (0-1) image-relative visual bounds, NOT metric geographic coordinates (lat/lon).
- **SAR Analysis:** The system analyzes SAR amplitude renderings as visual structural proxies. It does not perform raw interferometric phase unwrapping or polarimetric decomposition.
- **Adaptation vs. Fine-tuning:** The system uses heavy zero-shot prompt engineering. Actual domain fine-tuning requires offline adaptation.

## Local Setup & Deployment
### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL
- Gemini API Key

### Environment Variables
Create a `.env` in the `backend/` directory:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/satquery
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### Running Locally
1. **Frontend:**
   ```bash
   npm install
   npm run dev
   ```
2. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

## Evaluation Layer
A lightweight scaffold for reproducible remote-sensing evaluation is located in `backend/eval/`. This includes predefined agent profiles and a deterministic evaluation utility to run offline benchmarking.
