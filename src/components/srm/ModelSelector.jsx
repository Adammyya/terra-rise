import React from 'react';

const ModelSelector = ({ scale, setScale, onRun, loading, hasImage }) => {
  return (
    <div className="flex flex-col gap-4 bg-[#0b0b0c] p-4 border border-[#2a2a2e] rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-xs text-[#8a8a8e] uppercase tracking-widest font-semibold">Model Configuration</h3>
        <span className="text-[10px] bg-[#1a1a1c] px-2 py-0.5 rounded border border-[#2a2a2e] font-mono text-[#eaeaea]">FSRCNN (CPU)</span>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[#5a5a5e] uppercase tracking-wider">Output Scale Grid</label>
        <div className="flex gap-2">
          <button 
            onClick={() => setScale(2)}
            className={`flex-1 py-2 rounded text-sm font-mono border transition-colors ${
              scale === 2 
                ? 'bg-cyan-400/10 border-cyan-400/50 text-cyan-400' 
                : 'bg-[#141416] border-[#2a2a2e] text-[#8a8a8e] hover:border-[#5a5a5e]'
            }`}
          >
            2× 
          </button>
          <button 
            onClick={() => setScale(4)}
            className={`flex-1 py-2 rounded text-sm font-mono border transition-colors ${
              scale === 4 
                ? 'bg-cyan-400/10 border-cyan-400/50 text-cyan-400' 
                : 'bg-[#141416] border-[#2a2a2e] text-[#8a8a8e] hover:border-[#5a5a5e]'
            }`}
          >
            4×
          </button>
        </div>
      </div>
      
      <button 
        onClick={onRun}
        disabled={loading || !hasImage}
        className="mt-2 w-full py-3 bg-[#eaeaea] text-[#0b0b0c] text-xs uppercase tracking-widest font-bold rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? 'Reconstructing...' : 'Run Super-Resolution'}
      </button>
    </div>
  );
};

export default ModelSelector;
