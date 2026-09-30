/**
 * TerraRise — Main Super-Resolution Workstation Panel
 *
 * Fully responsive layout:
 *   Mobile (< 640px):   single column, stacked sections
 *   Tablet (640–1023px): sidebar + main, narrower
 *   Desktop (1024px+):  3-col sidebar + wide main workspace
 *
 * Processing stages:
 *   IDLE → PREPROCESSING → LOADING_MODEL → RUNNING → BUILDING → READY
 *   Any stage → ERROR on failure
 */
import React, { useRef, useCallback } from "react";
import useSRStore, { SR_STATUS, SR_STATUS_LABEL } from "../../store/srStore";
import ModelSelector from "./ModelSelector";
import SRComparisonViewer from "./SRComparisonViewer";
import QualityMetrics from "./QualityMetrics";
import UncertaintyPanel from "./UncertaintyPanel";
import SpectralConsistency from "./SpectralConsistency";
import MetadataPanel from "./MetadataPanel";
import BaselineComparison from "./BaselineComparison";
import { downloadSRReport } from "../../services/reports/srReportService";

// ── Stage indicator ─────────────────────────────────────────────────────────
const STAGES = [
  { key: SR_STATUS.PREPROCESSING, label: "Preprocess" },
  { key: SR_STATUS.LOADING_MODEL, label: "Load Model" },
  { key: SR_STATUS.RUNNING,       label: "Reconstruct" },
  { key: SR_STATUS.BUILDING,      label: "Build Result" },
  { key: SR_STATUS.READY,         label: "Ready" },
];

const stageIndex = (status) => STAGES.findIndex((s) => s.key === status);

function ProcessingStages({ status }) {
  const current = stageIndex(status);
  return (
    <div className="flex items-center gap-1 justify-center flex-wrap mt-4">
      {STAGES.map((stage, i) => {
        const done   = current > i;
        const active = current === i;
        return (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                done   ? "bg-cyan-400" :
                active ? "bg-cyan-400 animate-pulse ring-2 ring-cyan-400/30" :
                         "bg-[#3a3a3e]"
              }`} />
              <span className={`text-[9px] uppercase tracking-widest font-mono whitespace-nowrap ${
                active ? "text-cyan-400" : done ? "text-[#8a8a8e]" : "text-[#3a3a3e]"
              }`}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-px w-5 mb-4 transition-all duration-500 ${
                done ? "bg-cyan-400/50" : "bg-[#2a2a2e]"
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Error banner ────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="w-full border border-red-500/30 bg-red-500/10 rounded-xl p-4 flex gap-3 items-start"
    >
      <span className="text-red-400 text-lg mt-0.5 flex-shrink-0" aria-hidden="true">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-red-300 font-semibold uppercase tracking-widest mb-1">
          Processing Failed
        </p>
        <p className="text-sm text-red-200/80 leading-relaxed break-words">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="text-red-400/60 hover:text-red-400 text-lg font-mono ml-2 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        ✕
      </button>
    </div>
  );
}

// ── Upload zone with drag-and-drop ─────────────────────────────────────────
function UploadZone({ label, subLabel, file, accept, onChange, onClear, large = false, preview = null }) {
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange({ target: { files: [dropped] } });
  }, [onChange]);

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative rounded-xl border-2 border-dashed transition-colors group cursor-pointer ${
        file
          ? "border-cyan-400/30 bg-cyan-400/5"
          : large
          ? "border-[#2a2a2e] bg-[#111112] hover:border-[#5a5a5e] hover:bg-[#141416]"
          : "border-[#1e1e20] bg-[#111112] hover:border-[#3a3a3e]"
      }`}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="sr-only"
        tabIndex={-1}
      />

      {file ? (
        <div className={`${large ? "p-4" : "p-3"} flex flex-col gap-2`}>
          {/* Preview */}
          {preview && large && (
            <div className="w-full aspect-video bg-[#0b0b0c] rounded-lg overflow-hidden border border-[#2a2a2e] mb-1">
              <img
                src={preview}
                alt="Input observation preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-cyan-400/90 font-mono truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-[10px] text-[#5a5a5e] mt-0.5">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            {onClear && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                aria-label="Remove file"
                className="text-[#5a5a5e] hover:text-red-400 text-sm px-2 py-1 rounded transition-colors flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-red-400"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`${large ? "p-6" : "p-4"} text-center`}>
          {large && (
            <div className="w-10 h-10 rounded-full border border-[#3a3a3e] flex items-center justify-center mx-auto mb-3 group-hover:border-[#5a5a5e] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#5a5a5e]" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <p className="text-sm text-[#8a8a8e] group-hover:text-[#eaeaea] transition-colors">
            {label}
          </p>
          {subLabel && (
            <p className="text-[10px] text-[#5a5a5e] mt-1">{subLabel}</p>
          )}
          {large && (
            <p className="text-[10px] text-[#3a3a3e] mt-3">Drag & drop or click to browse</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section card wrapper ────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-[#0b0b0c] border border-[#2a2a2e] rounded-xl ${className}`}>
      {children}
    </div>
  );
}

// ── Sample image loader ─────────────────────────────────────────────────────
const SAMPLE_URL = "/imagery/earthdata.jpeg";

async function loadSampleImage(setInputFile) {
  try {
    const res = await fetch(SAMPLE_URL);
    if (!res.ok) throw new Error("Sample not found");
    const blob = await res.blob();
    const file = new File([blob], "sample_sentinel.jpg", { type: blob.type || "image/jpeg" });
    setInputFile(file);
  } catch {
    alert("Sample image not available. Please upload your own.");
  }
}

// ── Main component ──────────────────────────────────────────────────────────
const SuperResolutionPanel = () => {
  const {
    inputFile, inputSrc, referenceFile, scale, showBaseline,
    status, statusLabel, error, outputUrl, bicubicUrl,
    result, validation, uncertainty, spectralValidation,
    limitations, inputMeta, outputMeta, processingTime,
    setInputFile, setReferenceFile, setScale, setShowBaseline,
    clearError, runSuperResolution, reset,
  } = useSRStore();

  const isProcessing = [
    SR_STATUS.PREPROCESSING, SR_STATUS.LOADING_MODEL,
    SR_STATUS.RUNNING, SR_STATUS.BUILDING,
  ].includes(status);

  const isReady = status === SR_STATUS.READY;
  const isError = status === SR_STATUS.ERROR;
  const isIdle  = !isProcessing && !isReady && !isError;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#eaeaea]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-[#1a1a1c] bg-[#0b0b0c]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(34,211,238)" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 2C8 6 8 18 12 22M12 2c4 4 4 16 0 20M2 12h20" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-light text-[#eaeaea] tracking-tight leading-none">
                Terra<span className="font-semibold text-cyan-400">Rise</span>
              </h1>
              <p className="text-[10px] text-[#5a5a5e] uppercase tracking-widest mt-0.5 hidden sm:block">
                Deep Learning Super-Resolution Mapping
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {isReady && (
              <button
                onClick={reset}
                className="text-xs text-[#8a8a8e] hover:text-[#eaeaea] border border-[#2a2a2e] hover:border-[#4a4a4e] px-3 py-1.5 rounded-lg transition-colors font-mono uppercase tracking-widest"
                aria-label="Reset analysis and start over"
              >
                Reset
              </button>
            )}
            <span className="text-[10px] text-[#3a3a3e] font-mono border border-[#1a1a1c] px-2.5 py-1 rounded-lg bg-[#111112]">
              SIH 26142
            </span>
          </div>
        </div>
      </header>

      {/* ── Scientific disclaimer banner ──────────────────────────────── */}
      <div className="bg-amber-500/5 border-b border-amber-500/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <p className="text-[10px] text-amber-400/60 leading-relaxed text-center sm:text-left">
            <span className="font-semibold uppercase tracking-wider mr-1">Scientific Notice:</span>
            Super-resolution reconstructs plausible fine-scale detail from the input — it does not create newly observed ground-truth information.
          </p>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-6 lg:gap-8 items-start">

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-[85px]">

            {/* Section A — Input Observation */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-[#8a8a8e] uppercase tracking-widest">
                  A — Input Observation
                </h2>
                <span className="text-[9px] text-[#3a3a3e] font-mono border border-[#1a1a1c] px-2 py-0.5 rounded">
                  Required
                </span>
              </div>

              <UploadZone
                label="Upload Medium-Resolution Imagery"
                subLabel="JPEG · PNG · TIFF · GeoTIFF"
                file={inputFile}
                accept="image/jpeg,image/png,image/tiff,image/tif,.tif,.tiff"
                onChange={(e) => setInputFile(e.target.files[0] || null)}
                onClear={() => setInputFile(null)}
                large
                preview={inputSrc}
              />

              {/* Sample image button */}
              {!inputFile && (
                <button
                  onClick={() => loadSampleImage(setInputFile)}
                  className="mt-3 w-full py-2 text-xs text-[#5a5a5e] hover:text-cyan-400 border border-[#1e1e20] hover:border-cyan-400/30 rounded-lg transition-colors font-mono uppercase tracking-widest"
                >
                  Try Sample Image
                </button>
              )}

              {/* Reference (optional) */}
              <div className="mt-4 pt-4 border-t border-[#1a1a1c]">
                <p className="text-[10px] text-[#5a5a5e] uppercase tracking-widest mb-2 font-semibold">
                  Optional — High-Res Reference
                </p>
                <UploadZone
                  label="Upload Reference for PSNR / SSIM"
                  subLabel="For quantitative validation only"
                  file={referenceFile}
                  accept="image/jpeg,image/png,image/tiff,image/tif,.tif,.tiff"
                  onChange={(e) => setReferenceFile(e.target.files[0] || null)}
                  onClear={() => setReferenceFile(null)}
                />
              </div>
            </Card>

            {/* Section B — Model Configuration */}
            <ModelSelector
              scale={scale}
              setScale={setScale}
              showBaseline={showBaseline}
              setShowBaseline={setShowBaseline}
              onRun={runSuperResolution}
              loading={isProcessing}
              hasImage={!!inputFile}
            />

            {/* Quality & Uncertainty — after result */}
            {isReady && (
              <>
                <QualityMetrics validation={validation} />
                <UncertaintyPanel uncertainty={uncertainty} />
              </>
            )}
          </aside>

          {/* ── MAIN WORKSPACE ────────────────────────────────────────── */}
          <section className="flex flex-col gap-6 min-w-0">

            {/* Error */}
            {isError && (
              <ErrorBanner message={error} onDismiss={clearError} />
            )}

            {/* Processing state */}
            {isProcessing && (
              <Card className="flex items-center justify-center flex-col gap-5 py-16 sm:py-24">
                <div
                  className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"
                  aria-label="Processing"
                  role="status"
                />
                <div className="text-center">
                  <p className="text-sm text-cyan-400 font-mono uppercase tracking-widest font-semibold">
                    {statusLabel}
                  </p>
                  <ProcessingStages status={status} />
                  <p className="text-xs text-[#5a5a5e] max-w-xs mx-auto leading-relaxed mt-4">
                    FSRCNN inference on CPU. A 512×512 input at 2× completes in 2–15 seconds.
                  </p>
                </div>
              </Card>
            )}

            {/* Idle state */}
            {isIdle && !isError && (
              <Card className="flex items-center justify-center flex-col gap-4 py-16 sm:py-24">
                <div className="w-16 h-16 rounded-2xl border border-[#2a2a2e] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#3a3a3e]" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2C8 6 8 18 12 22M12 2c4 4 4 16 0 20M2 12h20" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-base text-[#5a5a5e] font-light">Workspace Ready</p>
                  <p className="text-xs text-[#3a3a3e] mt-2 max-w-xs leading-relaxed">
                    Upload medium-resolution imagery, select 2× or 4×, then run FSRCNN super-resolution reconstruction.
                  </p>
                </div>
                <div className="flex items-center gap-6 mt-2 opacity-40">
                  {["Import", "Configure", "Reconstruct", "Export"].map((step, i) => (
                    <React.Fragment key={step}>
                      <span className="text-[10px] font-mono text-[#5a5a5e] uppercase tracking-widest">{step}</span>
                      {i < 3 && <span className="text-[#2a2a2e] text-xs">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </Card>
            )}

            {/* Ready state — results */}
            {isReady && outputUrl && (
              <div className="flex flex-col gap-6">

                {/* Comparison viewer */}
                <Card className="p-4 sm:p-5">
                  <SRComparisonViewer originalSrc={inputSrc} enhancedSrc={outputUrl} />
                </Card>

                {/* Processing summary strip */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 bg-[#0b0b0c] border border-[#1a1a1c] rounded-xl text-[10px] font-mono text-[#5a5a5e] uppercase tracking-widest">
                  <span>Model: <span className="text-[#eaeaea]">FSRCNN</span></span>
                  <span>Scale: <span className="text-cyan-400">{scale}×</span></span>
                  {inputMeta && <span>Input: <span className="text-[#eaeaea]">{inputMeta.width}×{inputMeta.height}</span></span>}
                  {outputMeta && <span>Output: <span className="text-cyan-400">{outputMeta.width}×{outputMeta.height}</span></span>}
                  {processingTime != null && <span>Time: <span className="text-emerald-400">{Number(processingTime).toFixed(2)}s</span></span>}
                </div>

                {/* Metadata + Spectral */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MetadataPanel
                    input={inputMeta}
                    output={outputMeta}
                    model={result?.model}
                    processingTime={processingTime}
                    scale={scale}
                  />
                  <SpectralConsistency spectralValidation={spectralValidation} />
                </div>

                {/* Baseline comparison */}
                {showBaseline && bicubicUrl && (
                  <BaselineComparison bicubicUrl={bicubicUrl} enhancedUrl={outputUrl} />
                )}

                {/* Export panel */}
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] text-amber-400/70 uppercase tracking-widest font-mono mb-1 font-semibold">
                        Scientific Notice
                      </p>
                      <p className="text-xs text-[#5a5a5e] leading-relaxed max-w-2xl">
                        {limitations[0] || "The generated fine-scale detail is model-reconstructed and should not be interpreted as newly observed ground-truth information."}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#1a1a1c]">
                      <a
                        href={outputUrl}
                        download="terrarise_enhanced.png"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#eaeaea] text-[#0b0b0c] text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-colors"
                        aria-label="Download super-resolved image as PNG"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Download SR Image
                      </a>

                      <button
                        onClick={() => downloadSRReport({ result, inputFilename: inputFile?.name, scale })}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#1a1a1c] hover:bg-[#2a2a2e] border border-[#3a3a3e] text-xs text-[#eaeaea] font-semibold uppercase tracking-widest rounded-xl transition-colors"
                        aria-label="Download scientific report as text file"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Download Report
                      </button>

                      {bicubicUrl && (
                        <a
                          href={bicubicUrl}
                          download="terrarise_bicubic.png"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#1a1a1c] hover:bg-[#2a2a2e] border border-[#3a3a3e] text-xs text-[#8a8a8e] font-semibold uppercase tracking-widest rounded-xl transition-colors"
                          aria-label="Download bicubic baseline image"
                        >
                          Download Bicubic
                        </a>
                      )}
                    </div>
                  </div>
                </Card>

              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1a1a1c] mt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-[#3a3a3e] font-mono uppercase tracking-widest">
            TerraRise · SIH 26142 · FSRCNN on CPU · No fabricated metrics
          </p>
          <p className="text-[10px] text-[#2a2a2e] font-mono">
            Deep Learning Super-Resolution Mapping for Medium-Resolution Satellite Imagery
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SuperResolutionPanel;
