import { useState } from "react";
import useAnalysisStore from "../../store/analysisStore";
import ReportButton from "./ReportButton";

function ResultPanel() {
  const [showEvidence, setShowEvidence] = useState(false);

  const status = useAnalysisStore((state) => state.status);
  const task = useAnalysisStore((state) => state.task);
  const workflow = useAnalysisStore((state) => state.workflow);
  const result = useAnalysisStore((state) => state.result);
  const confidence = useAnalysisStore((state) => state.confidence);
  const uncertainty = useAnalysisStore((state) => state.uncertainty);
  const evidence = useAnalysisStore((state) => state.evidence);
  const showConfidence = useAnalysisStore((state) => state.showConfidence);

  if (status !== "complete" || !result) {
    return null;
  }

  const isInputRequired = confidence == null;
  const confidenceDisplay = isInputRequired
    ? "N/A"
    : `${Math.round(confidence * 100)}%`;

  const statusLabel = isInputRequired
    ? "INPUT REQUIRED"
    : "ANALYSIS COMPLETE";

  const statusColor = isInputRequired
    ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]"
    : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]";

  const taskLabel = task
    ? task.replaceAll("_", " ").toUpperCase()
    : "ANALYSIS";

  const workflowLabel =
    workflow || result.execution?.workflow || "Remote Sensing Pipeline";

  return (
    <div className="absolute right-4 top-4 bottom-4 z-20 w-[300px] max-h-[calc(100%-2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#0b0b0c]/95 p-4 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />

            <p className="text-[9px] tracking-[0.3em] text-white/40 font-mono uppercase">
              {statusLabel}
            </p>
          </div>

          <h2 className="mt-1.5 break-words text-sm font-semibold capitalize text-white">
            {task?.replaceAll("_", " ") || "Analysis"}
          </h2>
        </div>

        {showConfidence && (
          <div className="shrink-0 rounded-lg border border-amber-400/20 bg-amber-400/[0.04] px-2.5 py-1.5 text-right">
            <p className="text-[8px] tracking-[0.15em] text-white/30">
              CONFIDENCE
            </p>

            <p className="mt-0.5 text-sm font-semibold text-amber-300">
              {confidenceDisplay}
            </p>
          </div>
        )}
      </div>

      {/* Confidence bar */}
      {showConfidence && !isInputRequired && (
        <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-amber-300/80 transition-all duration-700"
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
      )}

      {/* Answer */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="mb-2 text-[9px] tracking-[0.25em] text-white/35 font-mono">
          ANSWER
        </p>

        <p className="text-xs leading-6 text-white/85 whitespace-pre-line break-words">
          {result.answer}
        </p>
      </div>

      {/* Uncertainty & Constraints */}
      {showConfidence && uncertainty && (
        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400/70 text-[10px]">◬</span>

            <p className="text-[8px] tracking-[0.2em] text-white/35 font-mono">
              UNCERTAINTY & CONSTRAINTS
            </p>
          </div>

          <p className="mt-1.5 text-[9.5px] leading-relaxed text-white/50 break-words">
            {uncertainty}
          </p>
        </div>
      )}

      {/* Pipeline Details */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
          <p className="text-[8px] tracking-[0.2em] text-white/30 font-mono">
            TASK
          </p>

          <p className="mt-1 text-[9px] leading-4 text-white/60 font-medium">
            {taskLabel}
          </p>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
          <p className="text-[8px] tracking-[0.2em] text-white/30 font-mono">
            WORKFLOW
          </p>

          <p
            className="mt-1 text-[9px] capitalize leading-4 text-white/60 font-medium truncate"
            title={workflowLabel}
          >
            {workflowLabel}
          </p>
        </div>
      </div>

      {/* Execution Model & Latency */}
      {result.execution && (
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-[8.5px] text-white/40">
          <span>
            MODEL: {result.execution.model || "SatQuery Engine"}
          </span>

          {result.execution.latency_ms && (
            <span>{result.execution.latency_ms}ms</span>
          )}
        </div>
      )}

      {/* Evidence toggle */}
      <button
        type="button"
        onClick={() => setShowEvidence((current) => !current)}
        className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-left transition-all hover:border-amber-400/30 hover:bg-white/[0.04]"
      >
        <span className="text-[9.5px] tracking-[0.15em] text-white/65 font-medium">
          {showEvidence ? "HIDE EVIDENCE" : "WHY THIS ANSWER"}
        </span>

        <span className="text-xs text-white/40">
          {showEvidence ? "−" : "+"}
        </span>
      </button>

      {/* Evidence Breakdown */}
      {showEvidence && evidence && (
        <div className="mt-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[8.5px] tracking-[0.25em] text-white/35 font-mono">
              EVIDENCE
            </p>

            <span className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] px-2 py-0.5 text-[8px] uppercase tracking-[0.15em] text-cyan-200/70">
              {evidence.type || "VISUAL"}
            </span>
          </div>

          <p className="text-[10px] leading-relaxed text-white/60 break-words">
            {evidence.description}
          </p>

          {/* Honest Spatial Grounding Status */}
          <div className="rounded-lg border border-white/5 bg-black/40 p-2.5">
            <p className="text-[7.5px] uppercase tracking-[0.2em] text-white/30 font-mono">
              Spatial Grounding
            </p>

            <p className="mt-1 text-[8.5px] text-white/45">
              {evidence.spatial_evidence_available
                ? "Direct visual coordinates identified."
                : "Spatial bounding unavailable — based on holistic spectral/visual inspection."}
            </p>
          </div>

          {/* Requirements Status for multi-observation requests */}
          {evidence.requirements_status && (
            <div className="rounded-lg border border-cyan-300/10 bg-cyan-950/20 p-2.5 text-[8.5px] leading-relaxed text-cyan-200/70">
              <span className="font-semibold text-cyan-300/80 mr-1">
                Data Requirement:
              </span>

              {evidence.requirements_status}
            </div>
          )}
        </div>
      )}

      {/* Report Button */}
      <div className="mt-3.5">
        <ReportButton />
      </div>
    </div>
  );
}

export default ResultPanel;