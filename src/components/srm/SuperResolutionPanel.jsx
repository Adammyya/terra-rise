/**
 * TerraRise — Main Super-Resolution Workstation Panel
 *
 * Uses srStore (Zustand) for all state management.
 * API calls are made through srApi.js — not inline here.
 *
 * Processing stages shown to user:
 *   IDLE → PREPROCESSING → LOADING_MODEL → RUNNING → BUILDING → READY
 *                                                            ↓ (on failure)
 *                                                          ERROR
 */
import React from "react";
import useSRStore, { SR_STATUS, SR_STATUS_LABEL } from "../../store/srStore";
import ModelSelector from "./ModelSelector";
import SRComparisonViewer from "./SRComparisonViewer";
import QualityMetrics from "./QualityMetrics";
import UncertaintyPanel from "./UncertaintyPanel";
import SpectralConsistency from "./SpectralConsistency";
import MetadataPanel from "./MetadataPanel";
import BaselineComparison from "./BaselineComparison";
import { downloadSRReport } from "../../services/reports/srReportService";

// ── Stage indicator ───────────────────────────────────────────────────────────
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
    <div className="flex items-center gap-1 justify-center mt-4">
      {STAGES.map((stage, i) => {
        const done = current > i;
        const active = current === i;
        return (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  done
                    ? "bg-cyan-400"
                    : active
                    ? "bg-cyan-400 animate-pulse ring-2 ring-cyan-400/30"
                    : "bg-[#3a3a3e]"
                }`}
              />
              <span
                className={`text-[9px] uppercase tracking-widest font-mono ${
                  active ? "text-cyan-400" : done ? "text-[#8a8a8e]" : "text-[#3a3a3e]"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`h-px w-6 mb-3 transition-all duration-500 ${
                  done ? "bg-cyan-400/50" : "bg-[#2a2a2e]"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="w-full border border-pink-500/30 bg-pink-500/10 rounded-lg p-4 flex gap-3 items-start">
      <span className="text-pink-400 text-lg mt-0.5">⚠</span>
      <div className="flex-1">
        <p className="text-xs font-mono text-pink-300 font-semibold uppercase tracking-widest mb-1">
          SR Error
        </p>
        <p className="text-xs text-pink-200/80 leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-pink-400/60 hover:text-pink-400 text-sm font-mono ml-2"
      >
        ✕
      </button>
    </div>
  );
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ label, subLabel, file, accept, onChange, large = false }) {
  return (
    <div
      className={`border-2 border-dashed ${
        large ? "border-[#2a2a2e] p-6" : "border-[#1e1e20] p-4"
      } hover:border-[#5a5a5e] rounded-md text-center transition-colors relative cursor-pointer group bg-[#111112]`}
    >
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {file ? (
        <span className="text-xs text-cyan-400/80 font-mono">{file.name}</span>
      ) : (
        <>
          <span className="text-xs text-[#8a8a8e] group-hover:text-[#eaeaea] transition-colors block">
            {label}
          </span>
          {subLabel && (
            <span className="text-[10px] text-[#5a5a5e] block mt-0.5">{subLabel}</span>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const SuperResolutionPanel = () => {
  const {
    inputFile,
    inputSrc,
    referenceFile,
    scale,
    showBaseline,
    status,
    statusLabel,
    error,
    outputUrl,
    bicubicUrl,
    result,
    validation,
    uncertainty,
    spectralValidation,
    limitations,
    inputMeta,
    outputMeta,
    processingTime,
    setInputFile,
    setReferenceFile,
    setScale,
    setShowBaseline,
    clearError,
    runSuperResolution,
  } = useSRStore();

  const isProcessing = [
    SR_STATUS.PREPROCESSING,
    SR_STATUS.LOADING_MODEL,
    SR_STATUS.RUNNING,
    SR_STATUS.BUILDING,
  ].includes(status);

  const isReady = status === SR_STATUS.READY;
  const isError = status === SR_STATUS.ERROR;

  return (
    <div className="max-w-7xl mx-auto w-full p-4 lg:p-8 font-sans">
      {/* ── Header ── */}
      <header className="mb-8 border-b border-[#2a2a2e] pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-[#eaeaea] tracking-tight">
            Terra<span className="font-semibold text-cyan-400">Rise</span>
          </h1>
          <p className="text-sm text-[#8a8a8e] uppercase tracking-widest mt-1">
            Deep Learning Super-Resolution Mapping
          </p>
        </div>
        <div className="text-xs text-[#5a5a5e] font-mono border border-[#2a2a2e] px-3 py-1 rounded bg-[#141416]">
          SIH26142 Edition
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Sidebar ── */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Input panel */}
          <div className="flex flex-col gap-4 bg-[#0b0b0c] p-4 border border-[#2a2a2e] rounded-lg">
            <h3 className="text-xs text-[#8a8a8e] uppercase tracking-widest font-semibold">
              Input Observation
            </h3>

            <UploadZone
              label="Upload Medium-Res Imagery"
              subLabel="JPEG · PNG · TIFF"
              file={inputFile}
              accept="image/jpeg,image/png,image/tiff,image/tif,.tif,.tiff"
              onChange={(e) => setInputFile(e.target.files[0] || null)}
              large
            />

            <UploadZone
              label="+ Optional High-Res Reference"
              subLabel="For PSNR / SSIM / RMSE validation"
              file={referenceFile}
              accept="image/jpeg,image/png,image/tiff,image/tif,.tif,.tiff"
              onChange={(e) => setReferenceFile(e.target.files[0] || null)}
            />
          </div>

          {/* Model + run */}
          <ModelSelector
            scale={scale}
            setScale={setScale}
            showBaseline={showBaseline}
            setShowBaseline={setShowBaseline}
            onRun={runSuperResolution}
            loading={isProcessing}
            hasImage={!!inputFile}
          />

          {/* Quality & uncertainty (only after result) */}
          {isReady && (
            <div className="flex flex-col gap-6 mt-2">
              <QualityMetrics validation={validation} />
              <UncertaintyPanel uncertainty={uncertainty} />
            </div>
          )}
        </div>

        {/* ── Main Workspace ── */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          {/* Error state */}
          {isError && (
            <ErrorBanner message={error} onDismiss={clearError} />
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="w-full h-[560px] border border-[#2a2a2e] rounded-lg bg-[#0b0b0c] flex items-center justify-center flex-col gap-4">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-cyan-400 font-mono uppercase tracking-widest">
                {statusLabel}
              </span>
              <ProcessingStages status={status} />
              <p className="text-[10px] text-[#5a5a5e] max-w-xs text-center leading-relaxed mt-2">
                FSRCNN inference runs on CPU. A 512×512 input at 2× typically completes in 3–15 seconds.
              </p>
            </div>
          )}

          {/* Ready state */}
          {isReady && outputUrl && (
            <div className="flex flex-col gap-6">
              {/* Comparison viewer */}
              <SRComparisonViewer originalSrc={inputSrc} enhancedSrc={outputUrl} />

              {/* Metadata + Spectral */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetadataPanel
                  input={inputMeta}
                  output={outputMeta}
                  model={result?.model}
                  processingTime={processingTime}
                  scale={scale}
                />
                <SpectralConsistency spectralValidation={spectralValidation} />
              </div>

              {/* Baseline comparison (only when requested and available) */}
              {showBaseline && bicubicUrl && (
                <BaselineComparison bicubicUrl={bicubicUrl} enhancedUrl={outputUrl} />
              )}

              {/* Scientific notice + download */}
              <div className="border border-[#2a2a2e] rounded-lg bg-[#0b0b0c] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                <div className="flex-1">
                  <p className="text-[10px] text-amber-400/70 uppercase tracking-widest font-mono mb-1">
                    Scientific Notice
                  </p>
                  <p className="text-[11px] text-[#8a8a8e] leading-relaxed max-w-xl">
                    {limitations[0]}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={outputUrl}
                    download="terrarise_enhanced.png"
                    className="px-4 py-2 bg-[#1a1a1c] hover:bg-[#2a2a2e] border border-[#3a3a3e] rounded text-xs text-[#eaeaea] uppercase tracking-widest font-semibold transition-colors whitespace-nowrap"
                  >
                    ↓ Export PNG
                  </a>
                  <button
                    onClick={() => downloadSRReport({ result, inputFilename: inputFile?.name, scale })}
                    className="px-4 py-2 bg-[#1a1a1c] hover:bg-[#2a2a2e] border border-[#3a3a3e] rounded text-xs text-[#eaeaea] uppercase tracking-widest font-semibold transition-colors whitespace-nowrap"
                  >
                    ↓ Report
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Idle state */}
          {!isProcessing && !isReady && !isError && (
            <div className="w-full h-[560px] border border-[#2a2a2e] rounded-lg bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1c] to-[#0b0b0c] flex items-center justify-center">
              <div className="text-center flex flex-col gap-2 items-center opacity-50">
                <div className="w-16 h-16 border border-[#2a2a2e] rounded flex items-center justify-center mb-2">
                  <span className="text-[#5a5a5e] text-2xl">🌍</span>
                </div>
                <span className="text-sm text-[#8a8a8e] uppercase tracking-widest">
                  Workspace Idle
                </span>
                <span className="text-[10px] text-[#5a5a5e] max-w-xs leading-relaxed">
                  Upload medium-resolution imagery, select 2× or 4×, then run
                  FSRCNN super-resolution reconstruction.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperResolutionPanel;
