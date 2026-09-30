import useAnalysisStore from "../../store/analysisStore";
import { downloadAnalysisReport } from "../../services/reports/reportService";

function ReportButton() {
  const query = useAnalysisStore((state) => state.query);
  const task = useAnalysisStore((state) => state.task);
  const workflow = useAnalysisStore((state) => state.workflow);
  const result = useAnalysisStore((state) => state.result);
  const confidence = useAnalysisStore((state) => state.confidence);
  const uncertainty = useAnalysisStore((state) => state.uncertainty);
  const evidence = useAnalysisStore((state) => state.evidence);

  const handleDownload = () => {
    downloadAnalysisReport({
      query,
      task,
      workflow,
      result,
      confidence,
      uncertainty,
      evidence,
    });
  };

  if (!result) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-[9px] tracking-[0.18em] font-mono text-white/50 transition-colors hover:border-amber-400/30 hover:bg-white/[0.04] hover:text-white"
    >
      DOWNLOAD INTELLIGENCE REPORT
    </button>
  );
}

export default ReportButton;