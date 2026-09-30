import json
import os
import time
import io

from dotenv import load_dotenv
from google import genai
from google.genai import types

try:
    from PIL import Image
except ImportError:
    Image = None

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL")

client = genai.Client()

def preprocess_image(image_bytes: bytes, mime_type: str) -> tuple[bytes, str, str, dict]:
    """
    Converts unsupported formats like TIFF to JPEG for Gemini.
    Returns (processed_bytes, new_mime_type, extracted_metadata_string, geospatial_metadata).
    """
    metadata_msg = ""
    geospatial_metadata = None
    if mime_type.lower() in ["image/tiff", "image/tif"]:
        if not Image:
            raise RuntimeError("TIFF processing requires the 'pillow' library, which is not installed.")

        try:
            img = Image.open(io.BytesIO(image_bytes))
            geospatial_metadata = {
                "is_geotiff": False,
                "width": img.width,
                "height": img.height,
                "band_count": len(img.getbands()),
                "pixel_scale": None,
                "tiepoint": None,
                "crs": None,
                "limitations": "Raw CRS interpretation is unavailable without dedicated geospatial libraries."
            }

            # Detect GeoTIFF tags (33550: PixelScale, 33922: Tiepoint, 34735: GeoKeyDirectory)
            if hasattr(img, "tag_v2"):
                tags = img.tag_v2.keys()
                is_geo = False
                if 33550 in tags or 33922 in tags or 34735 in tags:
                    is_geo = True
                    metadata_msg = "\\n\\n[SYSTEM METADATA: Uploaded image is a GeoTIFF containing embedded geospatial metadata (Pixel Scale/Tiepoints). Note: Raw coordinate/CRS interpretation is currently limited to visual approximations.]"
                    geospatial_metadata["is_geotiff"] = True
                    geospatial_metadata["pixel_scale"] = img.tag_v2.get(33550)
                    geospatial_metadata["tiepoint"] = img.tag_v2.get(33922)
                else:
                    metadata_msg = "\\n\\n[SYSTEM METADATA: Uploaded image is a standard TIFF.]"
            else:
                metadata_msg = "\\n\\n[SYSTEM METADATA: Uploaded image is a standard TIFF.]"

            if img.mode != 'RGB':
                img = img.convert('RGB')

            output = io.BytesIO()
            img.save(output, format="JPEG", quality=90)
            return output.getvalue(), "image/jpeg", metadata_msg, geospatial_metadata
        except Exception as e:
            raise ValueError(f"TIFF preprocessing failed: {str(e)}") from e

    return image_bytes, mime_type, metadata_msg, geospatial_metadata


def call_gemini(
    system_prompt: str,
    user_prompt: str,
    image_bytes: bytes,
    mime_type: str,
    image2_bytes: bytes = None,
    mime_type2: str = None,
) -> dict:
    lang_instruction = (
        "IMPORTANT: Mirror the exact language, script, and stylistic tone of the user's query. "
        "If the query is in English, answer in English. "
        "If the query is in Hindi, answer in Hindi. "
        "If the query is a mix of Hindi and English (Hinglish), answer in natural Hinglish "
        "using the same Roman script mix, retaining technical remote-sensing terminology in English "
        "where natural. Do NOT force formal translation or randomly switch to English."
    )

    CORE_INSTRUCTIONS = f"""
LANGUAGE RULE (HIGHEST PRIORITY):
{lang_instruction}
The 'answer' field language MUST match the user query language exactly. Do NOT translate the user's language. Technical terms (SAR, NDVI, vegetation, RGB, temporal) may remain in English regardless of query language.

CRITICAL ANSWERING RULES:
1. DIRECT ANSWER: Answer the USER'S SPECIFIC QUESTION directly. Do NOT give a generic image description unless the user explicitly asks to "describe the image" or "what do you see".
2. STRUCTURE: answer = (A) Direct Yes/No or specific answer → (B) 1-2 sentences of visual evidence → (C) limitation if uncertain.
3. FARMER-FRIENDLY: Simple, clear, practical. Avoid jargon or explain it simply.
4. NO HALLUCINATION: Only state what is VISIBLE. If you cannot confirm crop disease, flood risk, exact coordinates etc. from this single image, say so clearly in the SAME language as the query.
5. CONCISE: 2-5 sentences in the 'answer' field.
NOTE: Apply language and content rules only to 'answer' and 'evidence.description' fields. Do NOT translate JSON keys.
"""

    # Preprocess images (e.g. TIFF to JPEG) and extract metadata
    proc_image_bytes, proc_mime, meta_msg1, geo_meta1 = preprocess_image(image_bytes, mime_type)
    system_prompt = system_prompt + "\\n" + CORE_INSTRUCTIONS + meta_msg1

    contents = [
        system_prompt,
        user_prompt,
        types.Part.from_bytes(
            data=proc_image_bytes,
            mime_type=proc_mime,
        ),
    ]

    # Temporal analysis can provide Observation T2.
    if image2_bytes:
        proc_image2_bytes, proc_mime2, meta_msg2, geo_meta2 = preprocess_image(image2_bytes, mime_type2 or "image/jpeg")
        if meta_msg2:
            contents[0] += "\\n" + meta_msg2.replace("SYSTEM METADATA:", "SYSTEM METADATA (T2):")

        contents.append(
            types.Part.from_bytes(
                data=proc_image2_bytes,
                mime_type=proc_mime2,
            )
        )

    max_attempts = 3
    current_model = GEMINI_MODEL

    for attempt in range(1, max_attempts + 1):
        try:
            response = client.models.generate_content(
                model=current_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )

            raw_text = response.text or "{}"

            try:
                result = json.loads(raw_text)
                if geo_meta1:
                    result.setdefault("evidence", {})
                    result["evidence"]["geospatial_metadata"] = geo_meta1
                return result
            except json.JSONDecodeError:
                clean_text = raw_text.strip()

                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]

                if clean_text.startswith("```"):
                    clean_text = clean_text[3:]

                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]

                result = json.loads(clean_text.strip())

                if geo_meta1:
                    result.setdefault("evidence", {})
                    result["evidence"]["geospatial_metadata"] = geo_meta1
                return result

        except Exception as exc:
            error_text = str(exc)

            # Model not found — wrong name, wrong API version, or not enabled on this key.
            # Never retry; surface a clear message immediately.
            if "404" in error_text or "NOT_FOUND" in error_text:
                raise Exception(
                    f"GEMINI_MODEL_NOT_FOUND: '{current_model}' is not available "
                    "for this API key / version. Set a valid GEMINI_MODEL in Render env vars."
                ) from exc

            if "429" in error_text or "RESOURCE_EXHAUSTED" in error_text:
                if current_model == GEMINI_MODEL and GEMINI_FALLBACK_MODEL:
                    # Switch to fallback model immediately — no sleep, no retry count spent
                    current_model = GEMINI_FALLBACK_MODEL
                    continue
                else:
                    # Fallback also exhausted (or no fallback configured)
                    raise Exception("GEMINI_QUOTA_EXHAUSTED") from exc

            # Retry only genuinely transient server errors
            is_transient = "503" in error_text or "UNAVAILABLE" in error_text

            if not is_transient or attempt == max_attempts:
                raise

            # Exponential backoff: 2 s, then 4 s
            time.sleep(2 ** attempt)

    raise Exception("Max retries exceeded for Gemini API call.")
