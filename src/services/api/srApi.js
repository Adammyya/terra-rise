/**
 * TerraRise — SR API Service
 *
 * All backend communication for the super-resolution pipeline.
 *
 * API_BASE reads from the VITE_API_URL environment variable so the frontend
 * can target:
 *  - Local dev:    http://127.0.0.1:8000  (default)
 *  - Render prod:  https://your-terrarise-backend.onrender.com
 *
 * Do NOT hardcode production URLs here.
 * Do NOT return base64 image data — all images are served as URLs.
 */

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

/**
 * @typedef {Object} SREnhanceParams
 * @property {File} image           - The input satellite image file
 * @property {number} scale         - Reconstruction scale: 2 or 4
 * @property {File|null} reference  - Optional high-resolution reference image
 * @property {boolean} baseline     - Whether to compute bicubic baseline
 */

/**
 * Run FSRCNN super-resolution on the provided image.
 *
 * @param {SREnhanceParams} params
 * @returns {Promise<Object>} Structured SR result from the backend
 * @throws {Error} With a human-readable message on failure
 */
export async function enhanceImage({ image, scale = 2, reference = null, baseline = false }) {
  if (!image) {
    throw new Error("No image provided for super-resolution.");
  }

  if (![2, 4].includes(scale)) {
    throw new Error(`Unsupported scale: ${scale}. Use 2 or 4.`);
  }

  const formData = new FormData();
  formData.append("image", image);
  formData.append("scale", String(scale));
  formData.append("baseline", String(baseline));

  if (reference) {
    formData.append("reference_image", reference);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}/api/sr/enhance`, {
      method: "POST",
      body: formData,
    });
  } catch (networkErr) {
    throw new Error(
      `Cannot reach TerraRise backend at ${API_BASE}. ` +
        `Check that the backend is running. (${networkErr.message})`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Backend returned non-JSON response (HTTP ${response.status}). ` +
        "Check server logs."
    );
  }

  if (!response.ok || !data.success) {
    const msg =
      data.error ||
      data.detail ||
      `Server error: HTTP ${response.status}`;
    throw new Error(msg);
  }

  // Resolve output image URLs to absolute URLs using the same API_BASE.
  // The backend returns paths like "/sr/output/enhanced_xxxx.png".
  const resolved = {
    ...data,
    output: {
      ...data.output,
      download_url: resolveUrl(data.output?.download_url),
      bicubic_url: resolveUrl(data.output?.bicubic_url),
    },
  };

  return resolved;
}

/**
 * Optional downstream AI analysis of an SR output image via Gemini.
 * The core SR pipeline does NOT depend on this function.
 *
 * @param {File} image   - The enhanced image file or blob
 * @param {string} query - Natural-language query about the image
 * @returns {Promise<Object>}
 */
export async function analyzeImage(image, query) {
  if (!image) throw new Error("No image provided for analysis.");
  if (!query?.trim()) throw new Error("Query is required.");

  const formData = new FormData();
  formData.append("image", image);
  formData.append("query", query.trim());

  const response = await fetch(`${API_BASE}/api/sr/analyze`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || data.detail || `Analysis failed: HTTP ${response.status}`
    );
  }

  return data;
}

/**
 * Convert a relative backend path to an absolute URL using API_BASE.
 * Returns null for null/undefined inputs (e.g., when baseline is off).
 *
 * @param {string|null} path
 * @returns {string|null}
 */
export function resolveUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}
