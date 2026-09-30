import io
from PIL import Image, ImageChops, ImageStat
from services.gemini_service import call_gemini

SYSTEM_PROMPT = """You are SatQuery AI, a specialized scientific remote-sensing intelligence engine.
Your role is to perform temporal change detection between two co-registered Earth observation satellite images.

You will be provided with two images:
- Observation T1 = earlier/baseline observation
- Observation T2 = later/comparison observation

You will also receive a user query.

Analyze the differences between T1 and T2 and directly answer the user's specific question about:
- what changed
- where the change is visually apparent
- the direction/type of change when visually supportable
- whether the evidence is sufficient

CRITICAL INSTRUCTION:
Do not hallucinate exact geographic coordinates or synthetic change masks.
Describe changes visually and accurately based on observable spatial and spectral differences.
Do not just describe the images generically unless the user asks for a general comparison.

If the images are not sufficiently aligned or comparable, clearly state that limitation.

You must respond ONLY with a valid JSON object with this exact structure:
{
  "answer": "Concise factual description of the changes observed between T1 and T2.",
  "confidence": 0.85,
  "uncertainty": "Explanation of potential alignment errors, lighting differences, seasonal effects, or other limitations.",
  "evidence": {
    "type": "TEMPORAL",
    "description": "Factual evidence of the change based on comparative visual features.",
    "spatial_evidence_available": false,
    "requirements_status": "Temporal pair successfully analyzed."
  }
}
"""

def calculate_visual_difference(img1_bytes: bytes, img2_bytes: bytes):
    try:
        img1 = Image.open(io.BytesIO(img1_bytes)).convert("RGB")
        img2 = Image.open(io.BytesIO(img2_bytes)).convert("RGB")

        if img1.size != img2.size:
            img2 = img2.resize(img1.size)

        diff = ImageChops.difference(img1, img2)
        stat = ImageStat.Stat(diff)
        mean_diff = sum(stat.mean) / len(stat.mean) / 255.0

        # very coarse threshold for regions
        diff_gray = diff.convert("L")
        threshold = 50
        bbox = diff_gray.point(lambda p: p > threshold and 255).getbbox()

        regions = []
        if bbox:
            w, h = img1.size
            regions.append({
                "label": "coarse_visual_change",
                "x": bbox[0] / w,
                "y": bbox[1] / h,
                "width": (bbox[2] - bbox[0]) / w,
                "height": (bbox[3] - bbox[1]) / h,
                "confidence": min(1.0, mean_diff * 5),
                "basis": "approximate_visual_region"
            })

        return {
            "visual_difference_available": True,
            "approximate_changed_regions": regions,
            "difference_ratio": round(mean_diff, 4),
            "comparison_limitations": "Differences may be due to lighting, alignment, or season."
        }
    except Exception as e:
        return {
            "visual_difference_available": False,
            "comparison_limitations": f"Failed to compute visual difference: {str(e)}"
        }


def run_temporal(
    query: str,
    image_bytes: bytes,
    mime_type: str,
    image_filename: str,
    image2_bytes: bytes = None,
    mime_type2: str = None,
    image2_filename: str = None,
) -> dict:

    if not image2_bytes:
        return {
            "answer": (
                "Temporal change detection requires two co-registered observations. "
                "Currently, only a single baseline observation is loaded."
            ),
            "confidence": None,
            "uncertainty": "Data requirements not met. Missing Observation T2.",
            "evidence": {
                "type": "METADATA",
                "description": "Missing required temporal data pair.",
                "spatial_evidence_available": False,
                "requirements_status": "Temporal analysis requires two observations.",
            },
        }

    user_prompt = (
        f"User Query: {query}\n"
        f"Observation T1 Filename: {image_filename}\n"
        f"Observation T2 Filename: {image2_filename}\n\n"
        "The first supplied image is Observation T1 and the second supplied image "
        "is Observation T2. Compare them directly and answer the user's query. "
        "Return only the required JSON object."
    )

    result = call_gemini(
        SYSTEM_PROMPT,
        user_prompt,
        image_bytes,
        mime_type,
        image2_bytes,
        mime_type2,
    )

    if not isinstance(result, dict):
        raise ValueError("Temporal Gemini response was not a JSON object.")

    result.setdefault("evidence", {})
    result["evidence"]["type"] = "TEMPORAL"
    result["evidence"].setdefault(
        "requirements_status",
        "Temporal pair successfully analyzed.",
    )

    diff_data = calculate_visual_difference(image_bytes, image2_bytes)
    result["evidence"]["visual_difference_available"] = diff_data.get("visual_difference_available", False)
    result["evidence"]["approximate_changed_regions"] = diff_data.get("approximate_changed_regions", [])
    result["evidence"]["difference_ratio"] = diff_data.get("difference_ratio")
    result["evidence"]["comparison_limitations"] = diff_data.get("comparison_limitations")

    return result
