import React from 'react';

const UncertaintyPanel = ({ uncertainty }) => {
  if (!uncertainty) return null;

  const getLevelColor = (level) => {
    switch(level) {
      case 'LOW': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30';
      case 'MODERATE': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'HIGH': return 'text-pink-400 bg-pink-400/10 border-pink-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getLevelBar = (level) => {
    let w = '33%';
    if(level === 'MODERATE') w = '66%';
    if(level === 'HIGH') w = '100%';
    
    return (
      <div className="h-1 w-full bg-[#2a2a2e] rounded overflow-hidden mt-3">
        <div className={`h-full ${getLevelColor(level).split(' ')[0].replace('text-', 'bg-')}`} style={{ width: w }} />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#141416] border border-[#2a2a2e] rounded-md">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-semibold tracking-wide text-[#eaeaea] uppercase">Uncertainty Estimation</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono tracking-wider ${getLevelColor(uncertainty.level)}`}>
          {uncertainty.level}
        </span>
      </div>
      
      <p className="text-xs text-[#8a8a8e] leading-relaxed mt-1">
        {uncertainty.description}
      </p>

      {getLevelBar(uncertainty.level)}
      
      <div className="text-[10px] text-[#5a5a5e] uppercase tracking-widest mt-1 text-right">
        Mean pixel diff: {uncertainty.mean_difference?.toFixed(2)}
      </div>
    </div>
  );
};

export default UncertaintyPanel;
