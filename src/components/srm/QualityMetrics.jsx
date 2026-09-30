import React from "react";

const MetricBox = ({ label, value, unit, note }) => {
  const hasValue = value !== null && value !== undefined;
  return (
    <div className="flex flex-col p-3 bg-[#111112] border border-[#1a1a1c] rounded-lg gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-[#5a5a5e] font-semibold">{label}</span>
      {hasValue ? (
        <>
          <span className="text-xl font-mono font-bold text-[#eaeaea] leading-none">
            {typeof value === "number" ? value.toFixed(3) : value}
          </span>
          {unit && <span className="text-[10px] text-[#3a3a3e] font-mono">{unit}</span>}
        </>
      ) : (
        <span className="text-xs text-[#3a3a3e] leading-relaxed">{note || "No reference"}</span>
      )}
    </div>
  );
};

const QualityMetrics = ({ validation }) => {
  const isAvailable = validation?.reference_available;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 bg-[#0b0b0c] border border-[#2a2a2e] rounded-xl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-[#8a8a8e] uppercase tracking-widest">
          Quality Assessment
        </h3>
        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
          isAvailable
            ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/30"
            : "bg-amber-500/10 text-amber-400/70 border-amber-500/20"
        }`}>
          {isAvailable ? "Reference-Based" : "No Reference"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricBox
          label="PSNR"
          value={isAvailable ? validation?.psnr : null}
          unit="dB — higher is better"
          note="Upload reference"
        />
        <MetricBox
          label="SSIM"
          value={isAvailable ? validation?.ssim : null}
          unit="0–1 scale"
          note="Upload reference"
        />
        <MetricBox
          label="RMSE"
          value={isAvailable ? validation?.rmse : null}
          unit="pixel error"
          note="Upload reference"
        />
      </div>

      <p className="text-[10px] text-[#3a3a3e] leading-relaxed bg-[#111112] rounded-lg p-2.5">
        {isAvailable
          ? "Metrics computed against the provided high-resolution reference. PSNR > 30 dB and SSIM > 0.8 indicate good reconstruction fidelity relative to the reference."
          : "Upload a trusted high-resolution reference image to compute PSNR, SSIM, and RMSE between the SR output and a ground-truth observation."}
      </p>
    </div>
  );
};

export default QualityMetrics;
