import React from 'react';

const SpectralConsistency = ({ spectralValidation }) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-[#141416] border border-[#2a2a2e] rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold tracking-wide text-[#eaeaea] uppercase">Spectral Consistency</h3>
        <span className="text-[10px] px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded border border-gray-500/20 uppercase font-mono">
          {spectralValidation?.status || "UNAVAILABLE"}
        </span>
      </div>
      
      <p className="text-xs text-[#8a8a8e] leading-relaxed">
        {spectralValidation?.message || "Visual SR currently operates on an RGB representation. Spectral validation requires full multispectral input."}
      </p>
    </div>
  );
};

export default SpectralConsistency;
