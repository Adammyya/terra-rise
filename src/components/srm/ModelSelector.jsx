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
    <div className="flex flex-col gap-4 bg-[#0b0b0c] p-4 border border-[#2a2a2e] rounded-lg">
      {/* Model label */}
      <div className="flex justify-between items-center">
        <h3 className="text-xs text-[#8a8a8e] uppercase tracking-widest font-semibold">
          Model Configuration
        </h3>
        <span className="text-[10px] bg-[#1a1a1c] px-2 py-0.5 rounded border border-[#2a2a2e] font-mono text-[#eaeaea]">
          FSRCNN · CPU
        </span>
      </div>

      {/* Scale selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[#5a5a5e] uppercase tracking-wider">
          Reconstruction Scale
        </label>
        <div className="flex gap-2">
          {[2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              disabled={loading}
              className={`flex-1 py-2 rounded text-sm font-mono border transition-colors disabled:opacity-50 ${
                scale === s
                  ? "bg-cyan-400/10 border-cyan-400/50 text-cyan-400"
                  : "bg-[#141416] border-[#2a2a2e] text-[#8a8a8e] hover:border-[#5a5a5e]"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
        {scale === 4 && (
          <p className="text-[10px] text-amber-400/70 leading-relaxed">
            ⚠ 4× reconstruction is significantly slower on CPU. Use 2× for
            initial testing.
          </p>
        )}
      </div>

      {/* Baseline toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs text-[#5a5a5e] uppercase tracking-wider block">
            Bicubic Baseline
          </label>
          <span className="text-[10px] text-[#3a3a3e]">
            Compare vs. simple upsampling
          </span>
        </div>
        <button
          onClick={() => setShowBaseline(!showBaseline)}
          disabled={loading}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            showBaseline ? "bg-cyan-400/30" : "bg-[#2a2a2e]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${
              showBaseline
                ? "bg-cyan-400 translate-x-5"
                : "bg-[#5a5a5e] translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Run button */}
      <button
        onClick={onRun}
        disabled={loading || !hasImage}
        className="mt-2 w-full py-3 bg-[#eaeaea] text-[#0b0b0c] text-xs uppercase tracking-widest font-bold rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Reconstructing…" : "Run Super-Resolution"}
      </button>

      {!hasImage && (
        <p className="text-[10px] text-[#5a5a5e] text-center">
          Upload an image to proceed
        </p>
      )}
    </div>
  );
};

export default ModelSelector;
