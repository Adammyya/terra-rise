export function downloadAnalysisReport({
  query,
  task,
  workflow,
  result,
  confidence,
  uncertainty,
  evidence,
}) {
  const confidencePercentage =
    confidence !== null && confidence !== undefined
      ? `${Math.round(confidence * 100)}%`
      : "Not available";

  const taskLabel = task
    ? task.replaceAll("_", " ").toUpperCase()
    : "ANALYSIS";

  const workflowLabel =
    workflow || result?.execution?.workflow || "Remote Sensing Analysis";

  const model = result?.execution?.model || "SatQuery Engine";

  const evidenceDescription =
    evidence?.description || "Visual and spectral feature extraction.";

  const spatialStatus = evidence?.spatial_evidence_available
    ? "Direct visual coordinates identified."
    : "Spatial bounding unavailable (holistic visual/spectral inspection).";

  const requirementNote = evidence?.requirements_status
    ? `\nOBSERVATIONAL CONTEXT / PREREQUISITES\n${evidence.requirements_status}\n`
    : "";

  const report = `
============================================================
SATQUERY AI — REMOTE-SENSING INTELLIGENCE REPORT
============================================================
Generated: ${new Date().toISOString()}
Workstation Engine: ${model}

------------------------------------------------------------
QUERY INTENT
------------------------------------------------------------
${query || "Not available"}

------------------------------------------------------------
ANALYTICAL TASK & WORKFLOW
------------------------------------------------------------
Task: ${taskLabel}
Workflow: ${workflowLabel}

------------------------------------------------------------
PRIMARY ANSWER / INTELLIGENCE
------------------------------------------------------------
${result?.answer || "No answer available."}

------------------------------------------------------------
CONFIDENCE & UNCERTAINTY ASSESSMENT
------------------------------------------------------------
Calibrated Confidence: ${confidencePercentage}
Uncertainty / Constraints: ${uncertainty || "Subject to spatial resolution and single-frame constraints."}
${requirementNote}
------------------------------------------------------------
SUPPORTING EVIDENCE
------------------------------------------------------------
Evidence Type: ${evidence?.type || "VISUAL"}
Description: ${evidenceDescription}
Spatial Grounding: ${spatialStatus}

============================================================
SatQuery AI · Truthful Remote-Sensing Intelligence Pipeline
============================================================
`;

  const blob = new Blob([report.trim()], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `satquery-report-${Date.now()}.txt`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}