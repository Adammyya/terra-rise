from typing import List, Dict, Any

def plan_workflow(query: str, has_t2: bool = False, has_sar: bool = False) -> Dict[str, Any]:
    """
    Produce a deterministic, inspectable analysis plan based on user intent and available data.
    """
    query_lower = query.lower()

    intents = []
    agents = []
    execution_order = []
    missing_requirements = []
    evidence_requirements = []

    if "sar" in query_lower or "radar" in query_lower:
        intents.append("optical_sar_fusion")
        agents.append("optical_sar_agent")
        execution_order.append("optical_sar_agent")
        if not has_sar:
            missing_requirements.append("SAR imagery")
        evidence_requirements.append("multimodal_fusion")

    if "change" in query_lower or "before" in query_lower or "after" in query_lower:
        intents.append("temporal_comparison")
        agents.append("temporal_change_agent")
        execution_order.append("temporal_change_agent")
        if not has_t2:
            missing_requirements.append("T2 imagery")
        evidence_requirements.append("visual_difference")

    if "where" in query_lower or "locate" in query_lower or "find" in query_lower:
        intents.append("spatial_grounding")
        if "grounding_agent" not in agents:
            agents.append("grounding_agent")
            execution_order.append("grounding_agent")
        evidence_requirements.append("approximate_regions")

    if "describe" in query_lower or "scene" in query_lower:
        intents.append("scene_understanding")
        if "scene_agent" not in agents:
            agents.append("scene_agent")
            execution_order.append("scene_agent")

    # Default to VQA if no specific intent is found
    if not intents:
        intents.append("vqa")
        agents.append("vqa_agent")
        execution_order.append("vqa_agent")

    return {
        "requested_intents": intents,
        "required_inputs": ["T1 imagery"] + (["T2 imagery"] if has_t2 else []) + (["SAR imagery"] if has_sar else []),
        "selected_agents": agents,
        "execution_order": execution_order,
        "evidence_requirements": evidence_requirements,
        "missing_requirements": missing_requirements
    }

def route_task(query: str) -> str:
    # Backwards compatibility for old calls, though we will update workflow.py to use planner
    plan = plan_workflow(query)
    return plan["selected_agents"][0] if plan["selected_agents"] else "vqa_agent"
