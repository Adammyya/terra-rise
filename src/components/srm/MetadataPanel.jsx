import React from "react";

const Row = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center py-1 border-b border-[#1a1a1c] last:border-0">
    <span className="text-[10px] text-[#5a5a5e] uppercase tracking-widest">{label}</span>
    <span className={`text-xs font-mono ${highlight ? "text-cyan-400" : "text-[#eaeaea]"}`}>
      {value ?? "—"}
    </span>
  </div>
);

const MetadataPanel = ({ input, output, model, processingTime, scale }) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-[#0b0b0c] border border-[#2a2a2e] rounded-lg">
      <h3 className="text-xs text-[#8a8a8e] uppercase tracking-widest font-semibold">
        Execution Metadata
      </h3>

      <div className="flex flex-col gap-0">
        <p className="text-[10px] text-[#5a5a5e] uppercase tracking-widest mb-2">Input</p>
        <Row label="Dimensions" value={input ? `${input.width} × ${input.height} px` : null} />
        <Row label="Format" value={input?.format?.toUpperCase()} />
        <Row label="Bands" value={input?.bands ?? 3} />
        <Row label="Pixels" value={input?.pixel_count ? input.pixel_count.toLocaleString() : null} />
      </div>

      <div className="flex flex-col gap-0">
        <p className="text-[10px] text-[#5a5a5e] uppercase tracking-widest mb-2">Output</p>
        <Row label="Grid" value={output ? `${output.width} × ${output.height} px` : null} highlight />
        <Row label="Scale" value={scale ? `${scale}× reconstruction` : null} highlight />
        <Row label="Format" value="PNG" />
        <Row label="Pixels" value={output?.pixel_count ? output.pixel_count.toLocaleString() : null} />
      </div>

      <div className="flex flex-col gap-0">
        <p className="text-[10px] text-[#5a5a5e] uppercase tracking-widest mb-2">Model</p>
        <Row label="Algorithm" value={model ?? "FSRCNN"} />
        <Row label="Device" value="CPU (OpenCV DNN)" />
        <Row label="Processing Time" value={processingTime != null ? `${processingTime.toFixed(2)}s` : null} />
      </div>
    </div>
  );
};

export default MetadataPanel;
