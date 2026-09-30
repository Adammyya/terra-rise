from pydantic import BaseModel
from typing import List, Optional, Any, Dict

class Evidence(BaseModel):
    type: str
    description: str
    spatial_evidence_available: bool = False
    requirements_status: Optional[str] = None
    overlay: Optional[Any] = None
    regions: Optional[List[Dict[str, Any]]] = None
    geospatial_metadata: Optional[Dict[str, Any]] = None
    visual_difference_available: Optional[bool] = None
    approximate_changed_regions: Optional[List[Dict[str, Any]]] = None
    difference_ratio: Optional[float] = None
    comparison_limitations: Optional[str] = None

class Execution(BaseModel):
    model: str
    workflow: str
    agents: List[str]
    latency_ms: Optional[int] = None

class TraceEvent(BaseModel):
    stage: str
    label: str
    detail: str
    timestamp: str
    type: str = "success"

class AnalysisResponse(BaseModel):
    task: str
    workflow: str
    answer: str
    confidence: Optional[float] = None
    uncertainty: str
    evidence: Evidence
    trace_events: List[TraceEvent]
    execution: Execution
    image: Optional[Dict[str, Any]] = None
    image2: Optional[Dict[str, Any]] = None

class Query(BaseModel):
    query: str
