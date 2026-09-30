import { useState } from "react";
import useAnalysisStore from "../../store/analysisStore";

function AnalysisTrace() {
  const [expanded, setExpanded] = useState(false);

  const executionTrace = useAnalysisStore(
    (state) => state.executionTrace
  );
  const showTrace = useAnalysisStore((state) => state.showTrace);
  const status = useAnalysisStore((state) => state.status);

  if (!showTrace || !executionTrace.length) {
    return null;
  }

  const visibleEvents = expanded
    ? executionTrace
    : executionTrace.slice(-3);

  return (
    <div className="absolute bottom-4 left-4 z-20 w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0c]/92 shadow-2xl backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between border-b border-white/10 px-3 py-2 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div>
          <p className="text-[8px] tracking-[0.3em] text-white/30">
            EXECUTION PIPELINE
          </p>

          <p className="mt-0.5 text-[10px] font-medium text-white/75">
            ANALYSIS TRACE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[8px] tracking-[0.1em] text-white/30">
            {executionTrace.length} STEPS
          </span>
          <span className="text-[10px] text-white/40">
            {expanded ? "−" : "+"}
          </span>
        </div>
      </button>

      <div className="max-h-64 overflow-y-auto px-3 py-2">
        <div className="space-y-2">
          {visibleEvents.map((event, index) => {
            const isProcessing = event.type === "processing";
            const isError = event.type === "error";

            return (
              <div
                key={`${event.label || event.stage}-${index}`}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                      isError
                        ? "border-red-400/60 bg-red-950/30"
                        : isProcessing
                          ? "border-amber-400/60 bg-amber-950/30"
                          : "border-cyan-400/40 bg-cyan-950/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isError
                          ? "bg-red-400"
                          : isProcessing
                            ? "bg-amber-400"
                            : "bg-cyan-300"
                      }`}
                    />
                  </div>

                  {index < visibleEvents.length - 1 && (
                    <div className="mt-1 h-full min-h-4 w-px bg-white/10" />
                  )}
                </div>

                <div className="min-w-0 pb-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`text-[9px] tracking-[0.15em] font-medium ${
                        isError
                          ? "text-red-300"
                          : isProcessing
                            ? "text-amber-300/80"
                            : "text-cyan-200/70"
                      }`}
                    >
                      {event.label || event.stage}
                    </p>
                  </div>

                  <p className="mt-0.5 text-[10px] leading-4 text-white/45 break-words">
                    {event.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {!expanded && executionTrace.length > 4 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 text-[9px] tracking-[0.15em] text-cyan-300/60 transition-colors hover:text-cyan-200"
          >
            SHOW ALL {executionTrace.length} STAGES →
          </button>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 bg-white/[0.01]">
        <p className="text-[8px] tracking-[0.2em] text-white/20">
          STATUS: {status.replaceAll("_", " ").toUpperCase()}
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
      </div>
    </div>
  );
}

export default AnalysisTrace;