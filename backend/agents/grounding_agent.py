from services.gemini_service import call_gemini

SYSTEM_PROMPT = """You are SatQuery AI, a specialized scientific remote-sensing intelligence engine.
Your role is to attempt spatial localization of features within Earth observation satellite imagery.

The user is asking a specific question related to locating a feature.
Analyze the image to determine if the feature exists and answer the user's question directly.

CRITICAL INSTRUCTION:
You do NOT have access to a reliable metric spatial coordinate or GIS mapping.
However, you MUST provide approximate visual image-relative bounding boxes normalized to 0.0-1.0.
Do NOT fabricate geospatial coordinates (lat/lon).

You must respond ONLY with a valid JSON object with this exact structure:
{
  "answer": "Concise qualitative description of where the feature is located.",
  "confidence": 0.85,
  "uncertainty": "Exact metric spatial grounding is unavailable. Coordinates are image-relative approximations.",
  "evidence": {
    "type": "VISUAL",
    "description": "Approximate visual regions of interest.",
    "spatial_evidence_available": true,
    "regions": [
      {
        "label": "feature name",
        "x": 0.10,
        "y": 0.20,
        "width": 0.25,
        "height": 0.20,
        "confidence": 0.78,
        "basis": "approximate_visual_region"
      }
    ],
    "requirements_status": "Valid approximate image-relative grounding provided."
  }
}
If no feature is found, return spatial_evidence_available as false and an empty regions list.
"""

def run_grounding(query: str, image_bytes: bytes, mime_type: str, image_filename: str) -> dict:
    user_prompt = f"User Query: {query}\nImage Filename: {image_filename}\nAnalyze the image and return the required JSON."

    parsed = call_gemini(SYSTEM_PROMPT, user_prompt, image_bytes, mime_type)

    confidence = parsed.get("confidence")
    if confidence is not None:
        try:
            confidence = max(0.0, min(1.0, float(confidence)))
        except ValueError:
            confidence = None

    # Validate regions
    evidence = parsed.get("evidence", {})
    regions = evidence.get("regions", [])
    valid_regions = []
    for r in regions:
        try:
            if 0 <= r.get("x", -1) <= 1 and 0 <= r.get("y", -1) <= 1 and r.get("width", -1) > 0 and r.get("height", -1) > 0:
                valid_regions.append(r)
        except Exception:
            pass
    if evidence:
        evidence["regions"] = valid_regions
        evidence["spatial_evidence_available"] = bool(valid_regions)

    return {
        "answer": parsed.get("answer", "Qualitative location analysis completed."),
        "confidence": confidence,
        "uncertainty": parsed.get("uncertainty", "Exact metric spatial grounding is unavailable."),
        "evidence": evidence if evidence else {
            "type": "VISUAL",
            "description": "Visual spectrum analysis of surface features.",
            "spatial_evidence_available": False,
            "regions": [],
            "requirements_status": "No valid regions identified.",
        }
    }
