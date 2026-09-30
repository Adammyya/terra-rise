from services.gemini_service import call_gemini

SYSTEM_PROMPT = """You are SatQuery AI, a specialized scientific remote-sensing intelligence engine.
Your role is to perform multimodal fusion between Optical and Synthetic Aperture Radar (SAR) observations.

CRITICAL INSTRUCTION:
You are analyzing an Optical image (Observation 1) and a SAR image (Observation 2). The SAR image is a grayscale visual proxy of radar backscatter amplitude.
Focus on how structural geometry, surface roughness, and shadow patterns in the SAR image correlate with the spectral features in the Optical image. 
Acknowledge that you are correlating visual radar amplitude, not raw interferometric phase data or polarimetric decomposition.

You must respond ONLY with a valid JSON object with this exact structure:
{
  "answer": "Direct answer to the multimodal fusion query, followed by supporting observation.",
  "confidence": 0.85,
  "uncertainty": "Explanation of potential sensor alignment or backscatter interpretation ambiguities.",
  "evidence": {
    "type": "MULTIMODAL",
    "description": "Factual evidence of the cross-sensor correlation.",
    "spatial_evidence_available": false,
    "requirements_status": "Optical and user-supplied SAR observation accepted for visual multimodal comparison."
  }
}
"""

def run_optical_sar(query: str, image_bytes: bytes, mime_type: str, image_filename: str, sar_bytes: bytes = None, sar_mime: str = None, sar_filename: str = None) -> dict:
    if not sar_bytes:
        # Fallback if no SAR image is provided
        return {
            "answer": "Synthetic Aperture Radar (SAR) input is required for true cross-sensor radar backscatter analysis. Currently, only an optical modality observation is loaded.",
            "confidence": None,
            "uncertainty": "Data requirements not met. Missing authentic SAR sensor input.",
            "evidence": {
                "type": "METADATA",
                "description": "Missing required SAR data.",
                "spatial_evidence_available": False,
                "requirements_status": "SAR SENSOR INPUT REQUIRED.",
            }
        }

    user_prompt = f"User Query: {query}\nOptical Image Filename (Observation 1): {image_filename}\nSAR Image Filename (Observation 2): {sar_filename}\nAnalyze the multimodal correlation between the optical and SAR images and return the required JSON."

    result = call_gemini(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        image_bytes=image_bytes,
        mime_type=mime_type,
        image2_bytes=sar_bytes,
        mime_type2=sar_mime
    )

    # Enforce evidence type
    if "evidence" not in result or not isinstance(result["evidence"], dict):
        result["evidence"] = {}
    result["evidence"]["type"] = "MULTIMODAL"
    result["evidence"]["requirements_status"] = "Optical and user-supplied SAR observation accepted for visual multimodal comparison."

    return result
