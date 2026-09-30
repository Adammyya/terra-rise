import React from 'react';

const MetadataPanel = ({ input, output, model, processingTime }) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold tracking-wide text-[#eaeaea] uppercase">Execution Metadata</h3>
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-[#8a8a8e] uppercase tracking-widest border-b border-[#2a2a2e] pb-1 mb-1">Input</span>
          <div className="flex justify-between"><span className="text-[#5a5a5e]">Dimensions</span> <span className="font-mono text-[#eaeaea]">{input?.width} × {input?.height}</span></div>
          <div className="flex justify-between"><span className="text-[#5a5a5e]">Format</span> <span className="font-mono text-[#eaeaea]">{input?.format?.toUpperCase()}</span></div>
          <div className="flex justify-between"><span className="text-[#5a5a5e]">Bands</span> <span className="font-mono text-[#eaeaea]">{input?.bands || 3}</span></div>
        </div>
        
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-[#8a8a8e] uppercase tracking-widest border-b border-[#2a2a2e] pb-1 mb-1">Output</span>
          <div className="flex justify-between"><span className="text-[#5a5a5e]">Grid</span> <span className="font-mono text-cyan-400">{output?.width} × {output?.height}</span></div>
          <div className="flex justify-between"><span className="text-[#5a5a5e]">Model</span> <span className="font-mono text-[#eaeaea]">{model}</span></div>
          <div className="flex justify-between"><span className="text-[#5a5a5e]">Time</span> <span className="font-mono text-[#eaeaea]">{processingTime?.toFixed(2)}s</span></div>
        </div>
      </div>
    </div>
  );
};

export default MetadataPanel;
