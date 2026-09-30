import React from "react";

const SpectralConsistency = ({ spectralValidation }) => {
  const status = spectralValidation?.status || "UNAVAILABLE";
  const available = status === "AVAILABLE";

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#0b0b0c] border border-[#2a2a2e] rounded-xl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-[#8a8a8e] uppercase tracking-widest">
          Spectral Consistency
        </h3>
        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
          available
            ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/30"
            : "bg-[#1a1a1c] text-[#5a5a5e] border-[#2a2a2e]"
        }`}>
          {status}
        </span>
      </div>

      <p className="text-xs text-[#5a5a5e] leading-relaxed">
        {spectralValidation?.message ||
          "Reference-based spectral validation requires multispectral imagery beyond the current RGB pipeline."}
      </p>

      {!available && (
        <div className="rounded-lg bg-[#111112] border border-[#1a1a1c] p-3">
          <p className="text-[10px] text-[#3a3a3e] leading-relaxed">
            The pipeline processes RGB imagery only. Multi-band channels (NIR, SWIR, etc.)
            are not available in this configuration. Spectral consistency metrics cannot
            be computed without matching multispectral reference data.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpectralConsistency;
