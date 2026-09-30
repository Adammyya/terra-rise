/**
 * TerraRise — SR Report Service
 *
 * Generates downloadable scientific reports for SR sessions.
 * Reports must be factually honest — no fabricated metrics, no false claims.
 */

/**
 * Generate and download a plain-text scientific SR report.
 *
 * @param {Object} params
 * @param {Object} params.result         - Full SR result from backend
 * @param {string} params.inputFilename  - Original input file name
 * @param {number} params.scale          - Reconstruction scale (2 or 4)
 */
export function downloadSRReport({ result, inputFilename, scale }) {
  if (!result) return;

  const now = new Date().toISOString();

  const fmt = (v) => (v !== null && v !== undefined ? String(v) : "Unavailable");
  const fmtNum = (v, decimals = 4) =>
    v !== null && v !== undefined ? Number(v).toFixed(decimals) : "Unavailable";

  const { input, output, validation, uncertainty, spectral_validation, limitations, processing_time, model } = result;

  const metricsSection = validation?.reference_available
    ? `PSNR:                  ${fmtNum(validation.psnr, 2)} dB
SSIM:                  ${fmtNum(validation.ssim, 6)}
RMSE:                  ${fmtNum(validation.rmse, 4)} pixels`
    : `PSNR:                  Unavailable — no reference image provided
SSIM:                  Unavailable — no reference image provided
RMSE:                  Unavailable — no reference image provided`;

  const report = `
============================================================
TERRARISE — SUPER-RESOLUTION SCIENTIFIC REPORT
SIH Problem 26142: Deep Learning Based SRM from Medium Resolution Imagery
============================================================
Generated:             ${now}

------------------------------------------------------------
INPUT
------------------------------------------------------------
File:                  ${fmt(inputFilename)}
Dimensions:            ${fmt(input?.width)} × ${fmt(input?.height)} pixels
Bands:                 ${fmt(input?.bands)} (RGB representation)
Format:                ${fmt(input?.format)}
Pixel Count:           ${input?.pixel_count?.toLocaleString() ?? "Unavailable"}

------------------------------------------------------------
MODEL & CONFIGURATION
------------------------------------------------------------
Model:                 ${fmt(model)} (Fast Super-Resolution Convolutional Neural Network)
Device:                CPU (OpenCV DNN Super Resolution)
Scale:                 ${fmt(scale)}× reconstruction

IMPORTANT: FSRCNN is pre-trained on general-domain RGB imagery and has not
been fine-tuned on satellite-specific data. Outputs are model-reconstructed
representations and should not be interpreted as newly observed ground truth.

------------------------------------------------------------
OUTPUT
------------------------------------------------------------
Dimensions:            ${fmt(output?.width)} × ${fmt(output?.height)} pixels
Format:                PNG (RGB)
Pixel Count:           ${output?.pixel_count?.toLocaleString() ?? "Unavailable"}
Processing Time:       ${fmtNum(processing_time, 2)} seconds

Note: The output represents a ${fmt(scale)}× super-resolved reconstruction on a
finer output pixel grid. It does NOT represent newly captured high-resolution
satellite imagery.

------------------------------------------------------------
QUALITY METRICS
------------------------------------------------------------
${metricsSection}

Metrics Note: PSNR and SSIM are only meaningful when compared against a
trusted high-resolution reference acquired by a higher-resolution sensor.
Values are computed purely between the SR output and the reference;
they do not certify real-world spatial accuracy.

------------------------------------------------------------
SPECTRAL CONSISTENCY
------------------------------------------------------------
Status:                ${fmt(spectral_validation?.status)}
Note:                  ${fmt(spectral_validation?.message)}

------------------------------------------------------------
UNCERTAINTY ESTIMATION
------------------------------------------------------------
Level:                 ${fmt(uncertainty?.level)}
Mean Pixel Diff:       ${fmtNum(uncertainty?.mean_difference, 2)} (SR vs. bicubic baseline)
Description:           ${fmt(uncertainty?.description)}

Uncertainty Note: ${fmt(uncertainty?.note)}

------------------------------------------------------------
SCIENTIFIC LIMITATIONS
------------------------------------------------------------
${(limitations ?? []).map((l, i) => `${i + 1}. ${l}`).join("\n")}

${limitations?.length === 0 ? "None recorded." : ""}

------------------------------------------------------------
DISCLAIMER
------------------------------------------------------------
TerraRise generates deep-learning super-resolved reconstructions on a finer
output pixel grid from medium-resolution input observations. Generated
fine-scale detail is model-reconstructed and should not be interpreted as
newly observed ground-truth information.

Physical spatial resolution of the output is constrained by the input sensor.
A ${fmt(scale)}× reconstruction does not convert a 10 m resolution observation
into a true ${scale === 4 ? "2.5" : "5"} m resolution observation.

============================================================
TerraRise · Deep Learning Super-Resolution Mapping
SIH26142 Edition
============================================================
`.trim();

  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `terrarise-sr-report-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
