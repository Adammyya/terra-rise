import React from "react";

const LEVEL_STYLES = {
  LOW:      { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  MODERATE: { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-400",   dot: "bg-amber-400"   },
  HIGH:     { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-400",     dot: "bg-red-400"     },
};

const UncertaintyPanel = ({ uncertainty }) => {
  if (!uncertainty) return null;
  const level = (uncertainty.level || "MODERATE").toUpperCase();
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.MODERATE;

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#0b0b0c] border border-[#2a2a2e] rounded-xl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-[#8a8a8e] uppercase tracking-widest">
          Uncertainty Estimate
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold font-mono uppercase tracking-wider ${style.bg} ${style.border} ${style.text}`}>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
          {level}
        </div>
      </div>

      {uncertainty.mean_difference != null && (
        <div className="flex items-center justify-between py-2.5 border-b border-[#1a1a1c]">
          <span className="text-xs text-[#5a5a5e] uppercase tracking-wider">SR vs. Bicubic Diff</span>
          <span className="text-sm font-mono text-[#eaeaea] font-semibold">
            {Number(uncertainty.mean_difference).toFixed(2)}
          </span>
        </div>
      )}

      {uncertainty.description && (
        <p className="text-xs text-[#8a8a8e] leading-relaxed">{uncertainty.description}</p>
      )}

      <p className="text-[10px] text-[#3a3a3e] leading-relaxed italic border-t border-[#1a1a1c] pt-3">
        Heuristic measure only — not a calibrated probabilistic confidence interval.
      </p>
    </div>
  );
};

export default UncertaintyPanel;
