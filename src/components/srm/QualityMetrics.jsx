import React from "react";

const MetricBox = ({ label, value, unit, available, note }) => (
  <div className="flex flex-col p-3 bg-[#141416] border border-[#2a2a2e] rounded-md gap-1">
    <span className="text-[9px] uppercase tracking-widest text-[#8a8a8e]">{label}</span>
    {available && value !== null && value !== undefined ? (
      <>
        <span className="text-lg font-mono font-semibold text-[#eaeaea]">
          {typeof value === "number" ? value.toFixed(3) : value}
        </span>
        {unit && <span className="text-[9px] text-[#5a5a5e] font-mono">{unit}</span>}
      </>
    ) : (
      <span className="text-xs font-mono text-[#3a3a3e]">
        {note || "Unavailable"}
      </span>
    )}
  </div>
);

const QualityMetrics = ({ validation }) => {
  const isAvailable = validation?.reference_available;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs text-[#8a8a8e] uppercase tracking-widest font-semibold">
          Quality Assessment
        </h3>
        {!isAvailable && (
          <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-400/70 rounded border border-amber-500/20 uppercase font-mono">
            Ref Required
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricBox
          label="PSNR"
          value={validation?.psnr}
          unit="dB"
          available={isAvailable}
          note="Reference Required"
        />
        <MetricBox
          label="SSIM"
          value={validation?.ssim}
          unit="0–1"
          available={isAvailable}
          note="Reference Required"
        />
        <MetricBox
          label="RMSE"
          value={validation?.rmse}
          unit="px"
          available={isAvailable}
          note="Reference Required"
        />
      </div>

      <p className="text-[10px] text-[#5a5a5e] leading-relaxed p-2 bg-[#111112] rounded border border-[#1a1a1c]">
        {isAvailable
          ? "Metrics computed against provided high-resolution reference image."
          : "Upload a high-resolution reference image to compute PSNR, SSIM, and RMSE."}
      </p>
    </div>
  );
};

export default QualityMetrics;
