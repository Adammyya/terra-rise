const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runMockAnalysis({
  query,
  analysis,
  onEvent,
}) {
  onEvent({
    type: "task_detected",
    task: analysis.task,
  });

  await delay(700);

  onEvent({
    type: "input_validated",
    valid: true,
  });

  await delay(700);

  onEvent({
    type: "workflow_selected",
    workflow: analysis.task,
  });

  await delay(700);

  onEvent({
    type: "agent_started",
    agent: "SatQuery Analysis Agent",
  });

  await delay(900);

  onEvent({
    type: "processing",
    progress: 50,
  });

  await delay(900);

  onEvent({
    type: "processing",
    progress: 100,
  });

  await delay(500);

  onEvent({
    type: "agent_completed",
    agent: "SatQuery Analysis Agent",
  });

  await delay(600);

  onEvent({
    type: "evidence_ready",
    evidence: analysis.evidence,
  });

  await delay(600);

  onEvent({
    type: "result",
    result: {
      task: analysis.task,
      answer: analysis.answer,
      confidence: analysis.confidence,
      execution: analysis.execution,
    },
  });

  await delay(400);

  onEvent({
    type: "complete",
  });
}