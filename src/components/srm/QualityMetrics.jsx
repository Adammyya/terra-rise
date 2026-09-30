import React from 'react';

const QualityMetrics = ({ validation, metadata }) => {
  const isAvailable = validation?.reference_available;

  const MetricBox = ({ label, value, available }) => (
    <div className="flex flex-col p-4 bg-[#141416] border border-[#2a2a2e] rounded-md">
      <span className="text-[10px] uppercase tracking-widest text-[#8a8a8e] mb-1">{label}</span>
      {available ? (
        <span className="text-xl font-mono text-[#eaeaea]">{value !== null ? value.toFixed(3) : '---'}</span>
      ) : (
        <span className="text-xs font-mono text-[#5a5a5e]">Reference Required</span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-[#eaeaea] uppercase">Quality Assessment</h3>
        {!isAvailable && (
          <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400/80 rounded border border-amber-500/20 uppercase">
            No Ref Image
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <MetricBox label="PSNR (dB)" value={validation?.psnr} available={isAvailable} />
        <MetricBox label="SSIM" value={validation?.ssim} available={isAvailable} />
        <MetricBox label="RMSE" value={validation?.rmse} available={isAvailable} />
      </div>

      <div className="text-[11px] text-[#8a8a8e] leading-relaxed p-3 bg-[#111112] rounded border border-[#1a1a1c]">
        {isAvailable 
          ? "Metrics calculated against provided high-resolution reference." 
          : "Quantitative validation unavailable. Please provide a high-resolution reference image to compute PSNR, SSIM, and RMSE."}
      </div>
    </div>
  );
};

export default QualityMetrics;
