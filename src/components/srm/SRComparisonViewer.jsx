import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * SRComparisonViewer — Touch + mouse drag comparison slider
 * Responsive: adapts height for mobile/tablet/desktop
 */
const SRComparisonViewer = ({ originalSrc, enhancedSrc }) => {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  const getPercent = useCallback((clientX) => {
    if (!containerRef.current) return 50;
    const { left, width } = containerRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - left) / width) * 100));
  }, []);

  const onMouseDown = (e) => { e.preventDefault(); setDragging(true); };
  const onTouchStart = (e) => { setDragging(true); };

  const onMouseMove = useCallback((e) => {
    if (dragging) setPos(getPercent(e.clientX));
  }, [dragging, getPercent]);

  const onTouchMove = useCallback((e) => {
    if (dragging) { e.preventDefault(); setPos(getPercent(e.touches[0].clientX)); }
  }, [dragging, getPercent]);

  const stopDrag = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [onMouseMove, onTouchMove, stopDrag]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-[#8a8a8e] uppercase tracking-widest">
          Before / After Comparison
        </h3>
        <div className="flex gap-3">
          <a
            href={originalSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-[#5a5a5e] hover:text-[#eaeaea] uppercase tracking-widest transition-colors"
            aria-label="Open original image in new tab"
          >
            Original ↗
          </a>
          <a
            href={enhancedSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-cyan-400/60 hover:text-cyan-400 uppercase tracking-widest transition-colors"
            aria-label="Open super-resolved image in new tab"
          >
            SR Output ↗
          </a>
        </div>
      </div>

      {/* Slider container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-[#2a2a2e] bg-[#111112] select-none"
        style={{
          height: 'clamp(220px, 40vw, 540px)',
          cursor: dragging ? 'col-resize' : 'crosshair',
        }}
        aria-label="Image comparison slider"
        role="region"
      >
        {/* SR image — right / background */}
        <div
          className="absolute inset-0 bg-center bg-contain bg-no-repeat"
          style={{ backgroundImage: `url(${enhancedSrc})` }}
        />

        {/* Original — left, clipped */}
        <div
          className="absolute inset-0 bg-center bg-contain bg-no-repeat"
          style={{
            backgroundImage: `url(${originalSrc})`,
            clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`,
          }}
        />

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute inset-0 w-px bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.5)] mx-auto" />
        </div>

        {/* Drag handle */}
        <button
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          aria-label="Drag to compare original and super-resolved images"
          className="absolute top-1/2 z-30 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-cyan-400 bg-[#0b0b0c]/90 backdrop-blur-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-1 focus:ring-offset-black touch-none"
          style={{ left: `${pos}%` }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 3L2 8l3 5M11 3l3 5-3 5" stroke="rgb(34,211,238)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Labels */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/70 rounded border border-white/10 uppercase tracking-widest pointer-events-none z-10">
          Original
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-[10px] font-mono text-cyan-400/90 rounded border border-cyan-400/20 uppercase tracking-widest pointer-events-none z-10">
          TerraRise SR
        </div>

        {/* Hint overlay */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/40 backdrop-blur-sm text-[9px] font-mono text-white/30 rounded uppercase tracking-widest pointer-events-none z-10 whitespace-nowrap">
          Drag divider to compare
        </div>
      </div>
    </div>
  );
};

export default SRComparisonViewer;
