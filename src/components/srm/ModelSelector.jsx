import React from "react";

const ModelSelector = ({
  scale,
  setScale,
  showBaseline,
  setShowBaseline,
  onRun,
  loading,
  hasImage,
}) => {
  return (
    <div className="flex flex-col gap-4 bg-[#0b0b0c] p-4 sm:p-5 border border-[#2a2a2e] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-[#8a8a8e] uppercase tracking-widest">
          B — Model Configuration
        </h2>
        <span className="text-[10px] bg-[#111112] px-2 py-0.5 rounded border border-[#2a2a2e] font-mono text-[#5a5a5e]">
          FSRCNN · CPU
        </span>
      </div>

      {/* Scale selector */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-[#5a5a5e] uppercase tracking-wider font-semibold">
          Reconstruction Scale
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              disabled={loading}
              aria-pressed={scale === s}
              aria-label={`Set reconstruction scale to ${s}x`}
              className={`py-3 rounded-xl text-sm font-mono font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                scale === s
                  ? "bg-cyan-400/10 border-cyan-400/50 text-cyan-400"
                  : "bg-[#111112] border-[#2a2a2e] text-[#8a8a8e] hover:border-[#5a5a5e] hover:text-[#eaeaea]"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
        {scale === 4 && (
          <p className="text-[10px] text-amber-400/70 leading-relaxed bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 mt-1">
            4× produces a {`2048×2048`} output from a 512×512 input. Significantly slower on CPU — use 2× for initial testing.
          </p>
        )}
      </div>

      {/* Baseline toggle */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="min-w-0">
          <p className="text-xs text-[#8a8a8e]">Bicubic Baseline</p>
          <p className="text-[10px] text-[#3a3a3e] mt-0.5">Compare vs. classical upsampling</p>
        </div>
        <button
          onClick={() => setShowBaseline(!showBaseline)}
          disabled={loading}
          aria-pressed={showBaseline}
          aria-label={showBaseline ? "Disable bicubic baseline" : "Enable bicubic baseline"}
          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 ${
            showBaseline ? "bg-cyan-400/30" : "bg-[#2a2a2e]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 shadow-sm ${
              showBaseline ? "bg-cyan-400 translate-x-5" : "bg-[#6a6a6e] translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* CTA button */}
      <button
        onClick={onRun}
        disabled={loading || !hasImage}
        aria-label="Run FSRCNN super-resolution"
        className="w-full py-3.5 bg-[#eaeaea] text-[#0b0b0c] text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-white active:bg-[#d0d0d0] disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0b0b0c]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#0b0b0c] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            Reconstructing…
          </span>
        ) : (
          "Run Super-Resolution"
        )}
      </button>

      {!hasImage && !loading && (
        <p className="text-[10px] text-[#3a3a3e] text-center">
          Upload an image to begin
        </p>
      )}
    </div>
  );
};

export default ModelSelector;
