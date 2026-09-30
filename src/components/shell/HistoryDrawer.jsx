import { useEffect, useState } from "react";
import useAnalysisStore from "../../store/analysisStore";
import { useAuthStore } from "../../store/authStore";
import { fetchUserHistory } from "../../services/api/authApi";

function HistoryDrawer({ onClose }) {
  const localHistory = useAnalysisStore((state) => state.history);
  const { user, token } = useAuthStore();
  const [remoteHistory, setRemoteHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && token) {
      setLoading(true);
      fetchUserHistory(token)
        .then(data => {
          // data has {id, query, task, workflow, answer, confidence, created_at}
          const formatted = data.map(item => ({
            id: item.id,
            query: item.query,
            task: item.task,
            workflow: item.workflow,
            answer: item.answer,
            confidence: item.confidence,
            timestamp: new Date(item.created_at).getTime(),
          }));
          setRemoteHistory(formatted);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, token]);

  const history = user ? remoteHistory : localHistory;

  const setQuery = useAnalysisStore((state) => state.setQuery);
  const setTask = useAnalysisStore((state) => state.setTask);
  const setWorkflow = useAnalysisStore((state) => state.setWorkflow);
  const setResult = useAnalysisStore((state) => state.setResult);
  const setConfidence = useAnalysisStore((state) => state.setConfidence);
  const setUncertainty = useAnalysisStore((state) => state.setUncertainty);
  const setEvidence = useAnalysisStore((state) => state.setEvidence);
  const setStatus = useAnalysisStore((state) => state.setStatus);

  const handleRestore = (entry) => {
    setQuery(entry.query);
    setTask(entry.task);
    setWorkflow(entry.workflow || entry.task);
    setConfidence(entry.confidence);
    setUncertainty(entry.uncertainty);
    setEvidence(entry.evidence);

    setResult({
      task: entry.task,
      workflow: entry.workflow || entry.task,
      answer: entry.answer,
      confidence: entry.confidence,
      uncertainty: entry.uncertainty,
      evidence: entry.evidence,
      execution: {
        model: "SatQuery AI Intelligence Engine",
        workflow: entry.workflow || entry.task,
      },
    });

    setStatus("complete");
    onClose();
  };

  const formatTask = (task) => {
    if (!task) {
      return "ANALYSIS";
    }
    return task.replaceAll("_", " ").toUpperCase();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    try {
      return new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(timestamp));
    } catch {
      return "";
    }
  };

  return (
    <div className="absolute inset-0 z-40">
      <button
        type="button"
        aria-label="Close history"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      <aside className="absolute right-0 top-0 flex h-full w-[360px] max-w-[90vw] flex-col border-l border-white/10 bg-[#0b0b0c]/98 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white/30 font-mono">
              SATQUERY WORKSPACE
            </p>

            <h2 className="mt-1 text-sm font-semibold text-white">
              Analysis History
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/40 transition-colors hover:border-white/20 hover:text-white"
            aria-label="Close history"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
             <div className="flex h-full items-center justify-center text-xs text-white/50">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-white/20 text-lg">
                  ◇
                </div>

                <p className="mt-4 text-[9px] tracking-[0.25em] text-white/30 font-mono">
                  NO ANALYSIS HISTORY
                </p>

                <p className="mt-2 max-w-[220px] text-xs leading-5 text-white/30">
                  Completed remote-sensing analyses will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => handleRestore(entry)}
                  className="w-full rounded-xl border border-white/8 bg-white/[0.02] p-4 text-left transition-all hover:border-amber-400/30 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-xs font-medium leading-5 text-white/80">
                      {entry.query}
                    </p>

                    <span className="shrink-0 text-[8px] font-mono text-white/30">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
                    <span className="text-[8px] font-mono tracking-[0.15em] text-white/40">
                      {formatTask(entry.task)}
                    </span>

                    {entry.confidence !== null && entry.confidence !== undefined && (
                      <span className="text-[9px] font-medium text-amber-300/80 font-mono">
                        {Math.round(entry.confidence * 100)}% CONF
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-3 bg-white/[0.01]">
          <p className="text-[8px] leading-4 tracking-[0.1em] text-white/25 font-mono">
            {user ? "ACCOUNT HISTORY" : "SESSION HISTORY"} · {history.length} SAVED ANALYSES
          </p>
        </div>
      </aside>
    </div>
  );
}

export default HistoryDrawer;