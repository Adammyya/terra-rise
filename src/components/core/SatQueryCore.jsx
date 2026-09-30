import useAnalysisStore from "../../store/analysisStore";

const statusMessages = {
  idle: {
    label: "SATQUERY CORE",
    message: "Awaiting query",
  },

  input_ready: {
    label: "INPUT READY",
    message: "Query ready for analysis",
  },

  understanding: {
    label: "UNDERSTANDING",
    message: "Analyzing intent and task type",
  },

  validating: {
    label: "VALIDATING",
    message: "Validating sensor modality and resolution",
  },

  routing: {
    label: "ROUTING",
    message: "Selecting analytical workflow",
  },

  analyzing: {
    label: "ANALYZING",
    message: "Executing remote-sensing model",
  },

  evidence: {
    label: "EVIDENCE",
    message: "Compiling diagnostic evidence",
  },

  complete: {
    label: "ANALYSIS COMPLETE",
    message: "Intelligence compiled",
  },

  error: {
    label: "ANALYSIS INTERRUPTED",
    message: "Analysis failed — try again",
  },
};

function SatQueryCore() {
  const status = useAnalysisStore((state) => state.status);

  const currentStatus = statusMessages[status] ?? statusMessages.idle;
  const isError = status === "error";
  const isComplete = status === "complete";
  const isAnalyzing = [
    "understanding",
    "validating",
    "routing",
    "analyzing",
    "evidence",
  ].includes(status);

  // If complete, keep core minimal or subtle so imagery and results remain visual stars
  return (
    <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center select-none">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border bg-black/40 backdrop-blur-md transition-all duration-700 ${
          isError
            ? "border-red-400/40 shadow-[0_0_50px_rgba(248,113,113,0.15)]"
            : isComplete
              ? "border-emerald-400/30 opacity-40 shadow-[0_0_40px_rgba(52,211,153,0.1)]"
              : isAnalyzing
                ? "border-amber-400/50 shadow-[0_0_60px_rgba(251,191,36,0.15)] animate-pulse"
                : "border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.02)]"
        }`}
      >
        <div
          className={`h-8 w-8 rounded-full border transition-all duration-700 ${
            isError
              ? "border-red-300/40 bg-red-950/40"
              : isComplete
                ? "border-emerald-300/30 bg-emerald-950/20"
                : isAnalyzing
                  ? "border-amber-300/50 bg-amber-950/30"
                  : "border-white/20 bg-white/[0.04]"
          }`}
        />
      </div>

      <p
        className={`mt-4 text-[8.5px] font-mono tracking-[0.35em] transition-colors duration-500 ${
          isError
            ? "text-red-300/70"
            : isComplete
              ? "text-emerald-300/60"
              : isAnalyzing
                ? "text-amber-200/80"
                : "text-white/30"
        }`}
      >
        {currentStatus.label}
      </p>

      <p
        className={`mt-1.5 text-[10.5px] transition-colors duration-500 ${
          isError
            ? "text-red-200/60"
            : isComplete
              ? "text-white/30"
              : isAnalyzing
                ? "text-white/60"
                : "text-white/35"
        }`}
      >
        {currentStatus.message}
      </p>
    </div>
  );
}

export default SatQueryCore;