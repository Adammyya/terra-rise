import React, { useState, useRef } from 'react';

const SRComparisonViewer = ({ originalSrc, enhancedSrc }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const percent = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(percent);
  };

  return (
    <div 
      className="relative w-full h-[600px] bg-[#1a1a1c] overflow-hidden rounded-lg border border-[#2a2a2e] cursor-crosshair"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={(e) => handleMouseMove(e.touches[0])}
    >
      {/* Enhanced Image (Background) */}
      <div 
        className="absolute inset-0 bg-no-repeat bg-center bg-contain"
        style={{ backgroundImage: `url(${enhancedSrc})` }}
      />
      
      {/* Original Image (Foreground, clipped) */}
      <div 
        className="absolute inset-0 bg-no-repeat bg-center bg-contain"
        style={{ 
          backgroundImage: `url(${originalSrc})`,
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` 
        }}
      />
      
      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-cyan-400 bg-[#0b0b0c]/80 flex items-center justify-center backdrop-blur-sm">
          <div className="flex gap-1">
            <div className="w-0.5 h-3 bg-cyan-400/60 rounded-full" />
            <div className="w-0.5 h-3 bg-cyan-400/60 rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 backdrop-blur text-xs font-mono text-silver/80 rounded border border-white/10 uppercase tracking-widest">
        Original Observation
      </div>
      <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 backdrop-blur text-xs font-mono text-cyan-400/80 rounded border border-cyan-400/20 uppercase tracking-widest">
        Super-Resolved
      </div>
    </div>
  );
};

export default SRComparisonViewer;
