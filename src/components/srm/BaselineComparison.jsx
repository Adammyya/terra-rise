import React from 'react';

const BaselineComparison = ({ bicubicUrl, enhancedUrl }) => {
  if (!bicubicUrl || !enhancedUrl) return null;

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex justify-between items-end border-b border-[#2a2a2e] pb-2">
        <h3 className="text-sm font-semibold tracking-wide text-[#eaeaea] uppercase">Algorithm Baseline Comparison</h3>
        <span className="text-[10px] text-[#8a8a8e] uppercase tracking-widest">Bicubic vs Deep Learning SR</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="relative aspect-square bg-[#0b0b0c] border border-[#2a2a2e] rounded overflow-hidden">
            <div 
              className="absolute inset-0 bg-no-repeat bg-center bg-cover hover:scale-150 transition-transform duration-500 cursor-zoom-in"
              style={{ backgroundImage: `url(${bicubicUrl})` }}
            />
          </div>
          <div className="text-center">
            <span className="text-[11px] font-mono text-[#8a8a8e] uppercase tracking-wider">Baseline: Bicubic Interpolation</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="relative aspect-square bg-[#0b0b0c] border border-cyan-400/30 rounded overflow-hidden">
            <div 
              className="absolute inset-0 bg-no-repeat bg-center bg-cover hover:scale-150 transition-transform duration-500 cursor-zoom-in"
              style={{ backgroundImage: `url(${enhancedUrl})` }}
            />
          </div>
          <div className="text-center">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">TerraRise: FSRCNN Reconstruction</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaselineComparison;
