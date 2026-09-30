import json
import os

def load_profiles():
    profile_path = os.path.join(os.path.dirname(__file__), 'profiles.json')
    if os.path.exists(profile_path):
        with open(profile_path, 'r') as f:
            return json.load(f)
    return {}

def evaluate_results(manifest_path: str, actual_results_path: str = None):
    """
    Consumes a structured JSON manifest of benchmark examples and computes basic metrics.
    Manifest format expected:
    [
      {
         "task": "satellite_vqa",
         "query": "Is there a flood?",
         "expected_answer_keywords": ["flood", "water"],
         "reference_result": { "answer": "...", "confidence": 0.85, "evidence": {...} }
      }
    ]
    """
    if not os.path.exists(manifest_path):
        print("Manifest not found.")
        return

    with open(manifest_path, 'r') as f:
        manifest_data = json.load(f)

    actual_results_data = []
    use_synthetic = True

    if actual_results_path and os.path.exists(actual_results_path):
        with open(actual_results_path, 'r') as f:
            actual_results_data = json.load(f)
        use_synthetic = False
        print(f"Evaluating ACTUAL model results from {actual_results_path}")
    else:
        print("No actual results supplied. Running in SYNTHETIC FIXTURE mode using 'reference_result'.")
        print("NOTE: This manifest contains hardcoded reference data for demonstration purposes, NOT real model benchmark performance.")

    metrics = {
        "total": len(manifest_data),
        "success": 0,
        "failed": 0,
        "average_confidence": 0.0,
        "evidence_available_count": 0,
        "task_breakdown": {}
    }
    
    total_conf = 0.0
    conf_count = 0

    for i, item in enumerate(manifest_data):
        task = item.get("task", "unknown_task")
        if task not in metrics["task_breakdown"]:
            metrics["task_breakdown"][task] = {"total": 0, "success": 0}
        metrics["task_breakdown"][task]["total"] += 1

        if use_synthetic:
            result = item.get("reference_result", {})
        else:
            result = actual_results_data[i] if i < len(actual_results_data) else {}

        ans = result.get("answer", "").lower()
        
        # Exact/Semantic match
        keywords = item.get("expected_answer_keywords", [])
        if any(k.lower() in ans for k in keywords):
            metrics["success"] += 1
            metrics["task_breakdown"][task]["success"] += 1
        else:
            metrics["failed"] += 1
            
        conf = result.get("confidence")
        if conf is not None:
            total_conf += float(conf)
            conf_count += 1
            
        evidence = result.get("evidence", {})
        if evidence.get("spatial_evidence_available") or evidence.get("visual_difference_available") or evidence.get("type"):
            metrics["evidence_available_count"] += 1

    if conf_count > 0:
        metrics["average_confidence"] = total_conf / conf_count
        
    print("\n=== SATQUERY AI Evaluation Report ===")
    print(json.dumps(metrics, indent=2))
    print("\n[DISCLAIMER] Keyword matching is a basic demonstration metric, not a scientific semantic evaluation or model accuracy measurement.")
    print("True model fine-tuning requires offline domain adaptation on domain-specific datasets.")
    return metrics

if __name__ == "__main__":
    manifest = os.path.join(os.path.dirname(__file__), "dataset_manifest.json")
    evaluate_results(manifest)
