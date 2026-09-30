from datetime import datetime, timezone

from orchestrator.router import plan_workflow
from agents.vqa_agent import run_vqa
from services.gemini_service import GEMINI_MODEL


class WorkflowContext:
    def __init__(self, query: str, image_filename: str):
        self.query = query
        self.image_filename = image_filename
        self.trace_events = []

    def log_event(self, stage: str, detail: str):
        self.trace_events.append({
            "stage": stage,
            "label": stage,
            "detail": detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "success",
        })


def execute_workflow(
    query: str,
    image_bytes: bytes,
    mime_type: str,
    image_filename: str,
    image2_bytes: bytes = None,
    mime_type2: str = None,
    image2_filename: str = None,
) -> dict:
    ctx = WorkflowContext(query, image_filename)

    ctx.log_event(
        "INPUT RECEIVED",
        f"Query ingested: '{query.strip()[:60]}...'",
    )
    ctx.log_event(
        "IMAGE VALIDATED",
        f"Validated format ({mime_type.split('/')[-1].upper()})",
    )

    if image2_bytes:
        ctx.log_event(
            "SECOND IMAGE VALIDATED",
            f"Observation T2 validated ({(mime_type2 or 'image/jpeg').split('/')[-1].upper()})",
        )


    ctx.log_event(
        "QUERY INTERPRETED",
        "Determining remote-sensing task parameters",
    )

    plan = plan_workflow(query, has_t2=bool(image2_bytes))

    ctx.log_event(
        "PLANNER",
        f"Intents: {', '.join(plan['requested_intents'])}"
    )
    ctx.log_event(
        "INPUT REQUIREMENTS",
        f"Missing: {', '.join(plan['missing_requirements']) if plan['missing_requirements'] else 'None'}"
    )

    results = []
    executed_agents = []

    for agent_target in plan["selected_agents"]:
        ctx.log_event(
            "AGENT EXECUTION",
            f"Executing {agent_target.replace('_', ' ').title()}",
        )

        if agent_target == "grounding_agent":
            from agents.grounding_agent import run_grounding
            result = run_grounding(query, image_bytes, mime_type, image_filename)
            task_name = "spatial_grounding"
            workflow_name = "Spatial Feature Grounding"

        elif agent_target == "temporal_change_agent":
            if not image2_bytes:
                ctx.log_event("OBSERVATION T2", "Second temporal observation is required")
            from agents.temporal_agent import run_temporal
            result = run_temporal(query, image_bytes, mime_type, image_filename, image2_bytes, mime_type2, image2_filename)
            task_name = "temporal_change_detection"
            workflow_name = "Temporal Difference Analysis"

        elif agent_target == "optical_sar_agent":
            from agents.optical_sar_agent import run_optical_sar
            result = run_optical_sar(query, image_bytes, mime_type, image_filename, image2_bytes, mime_type2, image2_filename)
            task_name = "multimodal_analysis"
            workflow_name = "Optical-SAR Fusion"

        else:
            result = run_vqa(query, image_bytes, mime_type, image_filename)
            task_name = "satellite_vqa" if agent_target == "vqa_agent" else "scene_description"
            workflow_name = "Single Image VQA"

        results.append((agent_target, task_name, workflow_name, result))
        executed_agents.append(agent_target)

    ctx.log_event(
        "EVIDENCE FUSION",
        f"Synthesizing findings from {len(results)} module(s)",
    )

    if not results:
        results.append(("vqa_agent", "satellite_vqa", "Single Image VQA", run_vqa(query, image_bytes, mime_type, image_filename)))
        executed_agents.append("vqa_agent")

    # Deterministic fusion
    if len(results) == 1:
        agent_target, final_task, final_workflow, final_result = results[0]
        final_answer = final_result["answer"]
        final_confidence = final_result["confidence"]
        final_uncertainty = final_result["uncertainty"]
        final_evidence = final_result["evidence"]
    else:
        final_task = "composite_analysis"
        final_workflow = "Multi-Agent Composite Workflow"

        answers = []
        uncertainties = []
        confidences = []
        merged_evidence = {
            "type": "COMPOSITE",
            "description": "Merged evidence from multiple agents.",
            "spatial_evidence_available": False,
            "regions": [],
            "geospatial_metadata": None,
            "visual_difference_available": False,
            "approximate_changed_regions": [],
            "requirements_status": "Composite execution complete."
        }

        for ag, tname, wname, res in results:
            answers.append(res["answer"])
            uncertainties.append(res["uncertainty"])
            if res.get("confidence") is not None:
                confidences.append(res["confidence"])

            ev = res.get("evidence", {})
            if ev.get("spatial_evidence_available"):
                merged_evidence["spatial_evidence_available"] = True
            if ev.get("regions"):
                merged_evidence["regions"].extend(ev["regions"])
            if ev.get("geospatial_metadata"):
                merged_evidence["geospatial_metadata"] = ev["geospatial_metadata"]
            if ev.get("visual_difference_available"):
                merged_evidence["visual_difference_available"] = True
            if ev.get("approximate_changed_regions"):
                merged_evidence["approximate_changed_regions"].extend(ev["approximate_changed_regions"])
            if ev.get("difference_ratio") is not None:
                merged_evidence["difference_ratio"] = ev["difference_ratio"]
            if ev.get("comparison_limitations"):
                merged_evidence["comparison_limitations"] = ev["comparison_limitations"]

        final_answer = "\n\n".join(answers)
        final_uncertainty = " | ".join(uncertainties)
        final_confidence = sum(confidences) / len(confidences) if confidences else None
        final_evidence = merged_evidence

    ctx.log_event(
        "RESULT READY",
        f"Composite formulation complete. Confidence: {int(final_confidence * 100) if final_confidence is not None else 'N/A'}%",
    )

    return {
        "task": final_task,
        "workflow": final_workflow,
        "answer": final_answer,
        "confidence": final_confidence,
        "uncertainty": final_uncertainty,
        "evidence": final_evidence,
        "trace_events": ctx.trace_events,
        "execution": {
            "model": GEMINI_MODEL,
            "workflow": final_workflow,
            "agents": executed_agents,
        },
    }
