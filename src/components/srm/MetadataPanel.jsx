import React from "react";

const Row = ({ label, value, highlight }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-[#111112] last:border-0">
    <span className="text-xs text-[#5a5a5e] flex-shrink-0">{label}</span>
    <span className={`text-xs font-mono text-right break-all ${highlight ? "text-cyan-400 font-semibold" : "text-[#eaeaea]"}`}>
      {value ?? <span className="text-[#3a3a3e]">—</span>}
    </span>
  </div>
);

const MetadataPanel = ({ input, output, model, processingTime, scale }) => {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 bg-[#0b0b0c] border border-[#2a2a2e] rounded-xl">
      <h3 className="text-xs font-semibold text-[#8a8a8e] uppercase tracking-widest">
        Execution Metadata
      </h3>

      <div>
        <p className="text-[10px] text-[#3a3a3e] uppercase tracking-widest font-semibold mb-2">Input</p>
        <Row label="Dimensions" value={input ? `${input.width} × ${input.height} px` : null} />
        <Row label="Format" value={input?.format?.toUpperCase()} />
        <Row label="Bands" value={input?.bands ?? 3} />
        <Row label="Pixel Count" value={input?.pixel_count ? input.pixel_count.toLocaleString() : null} />
      </div>

      <div>
        <p className="text-[10px] text-[#3a3a3e] uppercase tracking-widest font-semibold mb-2">Output</p>
        <Row label="Grid" value={output ? `${output.width} × ${output.height} px` : null} highlight />
        <Row label="Scale" value={scale ? `${scale}× reconstruction` : null} highlight />
        <Row label="Format" value="PNG" />
        <Row label="Pixel Count" value={output?.pixel_count ? output.pixel_count.toLocaleString() : null} />
      </div>

      <div>
        <p className="text-[10px] text-[#3a3a3e] uppercase tracking-widest font-semibold mb-2">Model</p>
        <Row label="Algorithm" value={model ?? "FSRCNN"} />
        <Row label="Device" value="CPU (OpenCV DNN)" />
        <Row label="Processing Time" value={processingTime != null ? `${Number(processingTime).toFixed(2)}s` : null} />
      </div>
    </div>
  );
};

export default MetadataPanel;
