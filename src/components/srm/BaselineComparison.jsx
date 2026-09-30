import React from "react";

const BaselineComparison = ({ bicubicUrl, enhancedUrl }) => {
  if (!bicubicUrl || !enhancedUrl) return null;

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#0b0b0c] border border-[#2a2a2e] rounded-xl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-[#8a8a8e] uppercase tracking-widest">
          Algorithm Comparison
        </h3>
        <span className="text-[10px] font-mono text-[#5a5a5e] border border-[#2a2a2e] px-2 py-0.5 rounded bg-[#111112]">
          FSRCNN vs. Bicubic
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-[#5a5a5e] uppercase tracking-widest">
            Bicubic Baseline
          </span>
          <div className="aspect-square bg-[#111112] rounded-lg overflow-hidden border border-[#1a1a1c] flex items-center justify-center">
            <img
              src={bicubicUrl}
              alt="Bicubic upsampling baseline"
              className="w-full h-full object-contain"
            />
          </div>
          <a
            href={bicubicUrl}
            download="terrarise_bicubic.png"
            className="text-center text-[10px] font-mono text-[#5a5a5e] hover:text-[#eaeaea] uppercase tracking-widest transition-colors py-1"
          >
            Download Bicubic ↓
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
            FSRCNN Super-Resolved
          </span>
          <div className="aspect-square bg-[#111112] rounded-lg overflow-hidden border border-cyan-400/20 flex items-center justify-center">
            <img
              src={enhancedUrl}
              alt="FSRCNN super-resolved output"
              className="w-full h-full object-contain"
            />
          </div>
          <a
            href={enhancedUrl}
            download="terrarise_enhanced.png"
            className="text-center text-[10px] font-mono text-cyan-400/60 hover:text-cyan-400 uppercase tracking-widest transition-colors py-1"
          >
            Download SR ↓
          </a>
        </div>
      </div>

      <p className="text-[10px] text-[#3a3a3e] leading-relaxed border-t border-[#1a1a1c] pt-3">
        Bicubic upsampling is the classical baseline. FSRCNN applies learned convolutional
        priors to reconstruct plausible fine-scale structure. Visual differences indicate
        model-reconstructed detail — not newly observed information.
      </p>
    </div>
  );
};

export default BaselineComparison;
