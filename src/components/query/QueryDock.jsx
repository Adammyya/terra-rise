import { useState } from "react";
import useAnalysisStore from "../../store/analysisStore";
import useImageryStore from "../../store/imageryStore";
import { analyzeQuery } from "../../services/api/queryApi";

const suggestedQueries = [
  {
    label: "DESCRIBE SCENE",
    query: "Describe this optical satellite observation in detail.",
    requirementNote: "Analyzes spectral reflectance and spatial land features.",
  },
  {
    label: "DETECT CHANGE",
    query: "What surface features or changes are visible in this scene?",
    requirementNote: "Temporal change detection requires two observations. Analyzing single baseline observation.",
  },
  {
    label: "LOCATE REGION",
    query: "Where are the primary built-up and infrastructure regions?",
    requirementNote: "Spatial feature grounding based on visible surface boundaries.",
  },
  {
    label: "OPTICAL + SAR",
    query: "Compare optical features with expected SAR radar reflectance characteristics.",
    requirementNote: "Full multimodal requires optical + SAR observations. Analyzing optical modality.",
  },
];

const processingStates = [
  "understanding",
  "validating",
  "routing",
  "analyzing",
  "evidence",
];

function QueryDock() {
  const [input, setInput] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  const status = useAnalysisStore((state) => state.status);

  const setQuery = useAnalysisStore((state) => state.setQuery);
  const setStatus = useAnalysisStore((state) => state.setStatus);
  const setTask = useAnalysisStore((state) => state.setTask);
  const setWorkflow = useAnalysisStore((state) => state.setWorkflow);
  const setResult = useAnalysisStore((state) => state.setResult);
  const setConfidence = useAnalysisStore((state) => state.setConfidence);
  const setUncertainty = useAnalysisStore((state) => state.setUncertainty);
  const setEvidence = useAnalysisStore((state) => state.setEvidence);
  const setExecutionTrace = useAnalysisStore(
    (state) => state.setExecutionTrace
  );
  const setOverlays = useImageryStore((state) => state.setOverlays);
  const image = useImageryStore((state) => state.image);
  const temporalImage = useImageryStore((state) => state.temporalImage);
  const sarImage = useImageryStore((state) => state.sarImage);

  const addTraceEvent = useAnalysisStore(
    (state) => state.addTraceEvent
  );
  const addHistoryEntry = useAnalysisStore(
    (state) => state.addHistoryEntry
  );
  const clearExecutionTrace = useAnalysisStore(
    (state) => state.clearExecutionTrace
  );

  const isProcessing = processingStates.includes(status);
  const canAnalyze = input.trim().length > 0;

  const isTemporalQuery =
    /change|temporal|compare|comparison|difference|before|after|between/i.test(
      input
    );
  const isMultimodalQuery = /sar|radar|multimodal|fusion/i.test(input);

  const handleAnalyze = async () => {
    const query = input.trim();

    if (!query || !canAnalyze || isProcessing) {
      return;
    }

    if (!image?.assetUrl) {
      setStatus("error");
      addTraceEvent({
        type: "error",
        label: "NO IMAGERY",
        detail: "No satellite imagery loaded in workspace",
      });
      return;
    }

    setQuery(query);
    setOverlays([]);
    clearExecutionTrace();
    setStatus("understanding");

    addTraceEvent({
      type: "processing",
      label: "INPUT RECEIVED",
      detail: `Query ingested: "${query.slice(0, 50)}${query.length > 50 ? "..." : ""}"`,
    });

    try {
      setStatus("validating");
      addTraceEvent({
        type: "processing",
        label: "IMAGE VALIDATED",
        detail: `Format: ${image.filename?.split(".").pop()?.toUpperCase() || "IMAGE"} | Modality: ${image.modality?.toUpperCase() || "OPTICAL"}`,
      });

      setStatus("routing");
      addTraceEvent({
        type: "processing",
        label: "QUERY INTERPRETED",
        detail: "Determining remote-sensing task parameters and routing pipeline",
      });

      setStatus("analyzing");
      addTraceEvent({
        type: "processing",
        label: "MODEL ANALYSIS",
        detail: "Executing analytical inference on remote-sensing data",
      });

      const secondImage = isMultimodalQuery ? sarImage : (isTemporalQuery ? temporalImage : null);

      const analysis = await analyzeQuery(
        query,
        image,
        secondImage
      );

      setStatus("evidence");
      addTraceEvent({
        type: "processing",
        label: "EVIDENCE GENERATED",
        detail: `Diagnostic evidence compiled (${analysis.evidence?.type || "VISUAL"})`,
      });

      // Update full execution trace from backend if returned
      if (analysis.trace_events && analysis.trace_events.length > 0) {
        setExecutionTrace(analysis.trace_events);
      } else {
        addTraceEvent({
          type: "success",
          label: "RESULT READY",
          detail: "Truthful remote-sensing intelligence compiled",
        });
      }

      setTask(analysis.task);
      setWorkflow(analysis.workflow || analysis.task);
      setConfidence(analysis.confidence);
      setUncertainty(analysis.uncertainty);
      setEvidence(analysis.evidence);
      setResult(analysis);

      // Add to history with actual data
      addHistoryEntry({
        query,
        task: analysis.task,
        workflow: analysis.workflow || analysis.task,
        answer: analysis.answer,
        confidence: analysis.confidence,
        uncertainty: analysis.uncertainty,
        evidence: analysis.evidence,
      });

      setStatus("complete");
    } catch (error) {
      console.error("Analysis failed:", error);

      let errorLabel = "ANALYSIS FAILED";
      let errorDetail = error.message || "Backend analysis interrupted";
      const errLower = errorDetail.toLowerCase();

      if (
        errLower.includes("quota") ||
        errLower.includes("capacity") ||
        errLower.includes("429") ||
        errLower.includes("503") ||
        errLower.includes("unavailable") ||
        errLower.includes("exhausted")
      ) {
        errorLabel = "AI ANALYSIS TEMPORARILY UNAVAILABLE";
        errorDetail = "Gemini model capacity or quota is temporarily unavailable. Your query and imagery are valid. Please try again shortly.";
      } else if (
        errLower.includes("model not found") ||
        errLower.includes("invalid model") ||
        errLower.includes("api key") ||
        errLower.includes("configuration")
      ) {
        errorLabel = "MODEL CONFIGURATION ERROR";
      } else if (
        errLower.includes("failed to fetch") ||
        errLower.includes("network") ||
        errLower.includes("unreachable") ||
        errLower.includes("backend request failed: 502")
      ) {
        errorLabel = "BACKEND CONNECTION ERROR";
        if (errLower.includes("failed to fetch")) {
          errorDetail = "Unable to reach the analysis backend. Please check your network connection.";
        }
      }

      addTraceEvent({
        type: "error",
        label: errorLabel,
        detail: errorDetail,
      });

      setStatus("error");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAnalyze();
    }
  };

  const getButtonLabel = () => {
    if (status === "understanding") {
      return "UNDERSTANDING...";
    }
    if (status === "validating") {
      return "VALIDATING...";
    }
    if (status === "routing") {
      return "ROUTING...";
    }
    if (status === "analyzing") {
      return "ANALYZING...";
    }
    if (status === "evidence") {
      return "EVIDENCE...";
    }
    return "ANALYZE";
  };

  return (
    <div className="border-t border-white/10 bg-[#0b0b0c] p-2">
      <div className="mx-auto max-w-5xl">
        <div className="mb-1 flex items-center justify-between px-1">
          <p className="text-[8px] tracking-[0.3em] text-white/30">
            NATURAL-LANGUAGE QUERY DOCK
          </p>

          <p className="text-[8px] tracking-[0.15em] text-white/20">
            {input.length}/300
          </p>
        </div>

        <div
          className={`rounded-xl border bg-white/[0.03] px-3 py-2 transition-colors ${
            isProcessing
              ? "border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.06)]"
              : "border-white/10 focus-within:border-white/20"
          }`}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => {
                if (event.target.value.length <= 300) {
                  const value = event.target.value;
                  setInput(value);
                  setQuery(value);
                  setActiveSuggestion(null);
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              rows={1}
              placeholder="Ask a scientific remote-sensing query about this imagery..."
              className="max-h-16 min-h-6 flex-1 resize-none bg-transparent py-0.5 text-xs leading-5 text-white outline-none placeholder:text-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze || isProcessing}
              className="shrink-0 rounded-lg bg-amber-400 px-4 py-1.5 text-[10px] font-medium text-black transition-all hover:bg-amber-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {getButtonLabel()}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
            <span className="text-[8px] tracking-[0.15em] text-white/25 mr-1">
              SUGGESTED CAPABILITIES:
            </span>
            {suggestedQueries.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setInput(suggestion.query);
                  setQuery(suggestion.query);
                  setActiveSuggestion(suggestion);
                }}
                className={`rounded-lg border px-3 py-1.5 text-[9px] tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                  activeSuggestion?.label === suggestion.label
                    ? "border-cyan-400/40 bg-cyan-400/[0.08] text-cyan-200"
                    : "border-white/8 bg-white/[0.02] text-white/40 hover:border-white/15 hover:bg-white/[0.04] hover:text-white/70"
                }`}
              >
                {suggestion.label}
              </button>
            ))}
          </div>

          {activeSuggestion?.requirementNote && (
            <div className="mt-2.5 rounded-lg border border-cyan-300/10 bg-cyan-950/20 px-3 py-1.5 text-[8.5px] leading-relaxed text-cyan-200/60">
              <span className="font-semibold tracking-[0.1em] text-cyan-300/80 mr-1.5">
                OBSERVATIONAL CONTEXT:
              </span>
              {activeSuggestion.requirementNote}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[9px] text-white/20">
            Press Enter to analyze · Shift + Enter for a new line
          </p>

          {status === "complete" && (
            <p className="text-[9px] tracking-[0.15em] text-emerald-400/70">
              ANALYSIS COMPLETE · RESULTS COMPILED
            </p>
          )}

          {status === "error" && (
            <p className="text-[9px] tracking-[0.15em] text-red-400/70">
              ANALYSIS INTERRUPTED · CHECK TRACE
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueryDock;