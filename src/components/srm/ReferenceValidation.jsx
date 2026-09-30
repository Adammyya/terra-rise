import React from "react";

/**
 * ReferenceValidation — Shows PSNR / SSIM / RMSE when a reference image is available.
 * Displays "Reference Required" when not available.
 * NEVER fabricates metrics.
 */
const MetricBox = ({ label, value, unit, available, good }) => (
  <div className="flex flex-col p-3 bg-[#141416] border border-[#2a2a2e] rounded-md gap-1">
    <span className="text-[9px] uppercase tracking-widest text-[#8a8a8e]">{label}</span>
    {available && value !== null ? (
      <>
        <span className={`text-lg font-mono font-semibold ${good ? "text-cyan-400" : "text-[#eaeaea]"}`}>
          {typeof value === "number" ? value.toFixed(3) : value}
        </span>
        {unit && <span className="text-[9px] text-[#5a5a5e] font-mono">{unit}</span>}
      </>
    ) : (
      <span className="text-xs font-mono text-[#3a3a3e]">
        {available ? "—" : "No Reference"}
      </span>
    )}
  </div>
);

const ReferenceValidation = ({ validation }) => {
  const isAvailable = validation?.reference_available;

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#0b0b0c] border border-[#2a2a2e] rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-xs text-[#8a8a8e] uppercase tracking-widest font-semibold">
          Reference Validation
        </h3>
        <span
          className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono tracking-wider ${
            isAvailable
              ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/30"
              : "bg-[#2a2a2e] text-[#5a5a5e] border-[#2a2a2e]"
          }`}
        >
          {isAvailable ? "Reference Available" : "No Reference"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricBox
          label="PSNR"
          value={validation?.psnr}
          unit="dB"
          available={isAvailable}
          good={validation?.psnr > 30}
        />
        <MetricBox
          label="SSIM"
          value={validation?.ssim}
          unit="0–1"
          available={isAvailable}
          good={validation?.ssim > 0.8}
        />
        <MetricBox
          label="RMSE"
          value={validation?.rmse}
          unit="px"
          available={isAvailable}
          good={validation?.rmse < 10}
        />
      </div>

      <p className="text-[10px] text-[#5a5a5e] leading-relaxed">
        {isAvailable
          ? "Metrics calculated against provided high-resolution reference image. PSNR > 30 dB and SSIM > 0.8 indicate good reconstruction fidelity."
          : "Provide a trusted high-resolution reference image to compute PSNR, SSIM, and RMSE between the SR output and a ground-truth observation."}
      </p>

      {validation?.error && (
        <p className="text-[10px] text-amber-400/70 font-mono">
          Validation error: {validation.error}
        </p>
      )}
    </div>
  );
};

export default ReferenceValidation;
