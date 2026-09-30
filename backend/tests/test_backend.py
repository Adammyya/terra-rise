import unittest
import io
from PIL import Image
from orchestrator.router import plan_workflow
from services.gemini_service import preprocess_image
from agents.temporal_agent import calculate_visual_difference

class TestSatQueryBackend(unittest.TestCase):
    
    # 1. Routing & Planning Tests
    def test_vqa_routing(self):
        plan = plan_workflow("What is in this image?")
        self.assertIn("vqa", plan["requested_intents"])
        self.assertIn("vqa_agent", plan["selected_agents"])

    def test_temporal_routing(self):
        plan = plan_workflow("Has the forest changed since T1?", has_t2=True)
        self.assertIn("temporal_comparison", plan["requested_intents"])
        self.assertIn("temporal_change_agent", plan["selected_agents"])
        self.assertNotIn("T2 imagery", plan["missing_requirements"])

    def test_temporal_missing_t2(self):
        plan = plan_workflow("What changed?", has_t2=False)
        self.assertIn("T2 imagery", plan["missing_requirements"])

    def test_sar_routing(self):
        plan = plan_workflow("Use SAR data to analyze this", has_sar=True)
        self.assertIn("optical_sar_fusion", plan["requested_intents"])
        self.assertIn("optical_sar_agent", plan["selected_agents"])

    def test_sar_missing(self):
        plan = plan_workflow("Check SAR", has_sar=False)
        self.assertIn("SAR imagery", plan["missing_requirements"])

    def test_composite_planning(self):
        plan = plan_workflow("Where are the changes in the SAR image?", has_t2=True, has_sar=True)
        self.assertIn("temporal_comparison", plan["requested_intents"])
        self.assertIn("optical_sar_fusion", plan["requested_intents"])
        self.assertIn("spatial_grounding", plan["requested_intents"])
        self.assertTrue(len(plan["selected_agents"]) >= 3)

    # 2. TIFF & Preprocessing Tests
    def test_tiff_preprocessing_standard(self):
        img = Image.new("RGB", (10, 10), color="blue")
        b = io.BytesIO()
        img.save(b, "TIFF")
        b_val = b.getvalue()
        
        proc_b, mime, meta, geo_meta = preprocess_image(b_val, "image/tiff")
        self.assertEqual(mime, "image/jpeg")
        self.assertIn("standard TIFF", meta)
        self.assertFalse(geo_meta["is_geotiff"])

    def test_geotiff_metadata_extraction(self):
        img = Image.new("RGB", (10, 10), color="green")
        b2 = io.BytesIO()
        img.save(b2, "TIFF")
        proc_b2, mime2, meta2, geo_meta2 = preprocess_image(b2.getvalue(), "image/tiff")
        self.assertEqual(geo_meta2["width"], 10)
        self.assertEqual(geo_meta2["height"], 10)

    # 3. Temporal Difference Calculation Tests
    def test_temporal_difference_calculation(self):
        img1 = Image.new("RGB", (100, 100), color="black")
        img2 = Image.new("RGB", (100, 100), color="white")
        b1, b2 = io.BytesIO(), io.BytesIO()
        img1.save(b1, "JPEG")
        img2.save(b2, "JPEG")
        
        diff_data = calculate_visual_difference(b1.getvalue(), b2.getvalue())
        self.assertTrue(diff_data["visual_difference_available"])
        self.assertGreater(diff_data["difference_ratio"], 0.9)
        self.assertTrue(len(diff_data["approximate_changed_regions"]) > 0)
        
    def test_temporal_no_difference(self):
        img1 = Image.new("RGB", (100, 100), color="black")
        b1 = io.BytesIO()
        img1.save(b1, "JPEG")
        
        diff_data = calculate_visual_difference(b1.getvalue(), b1.getvalue())
        self.assertTrue(diff_data["visual_difference_available"])
        self.assertEqual(diff_data["difference_ratio"], 0.0)

    # 4. Grounding Region Validation Tests
    def test_valid_grounding_regions(self):
        from agents.grounding_agent import run_grounding
        # mocked Gemini response via direct check is hard without mocking, 
        # but we know the validator works on values.
        # We will mock call_gemini to return a dummy response.
        import agents.grounding_agent
        original_call = agents.grounding_agent.call_gemini
        
        def mock_call(*args, **kwargs):
            return {
                "answer": "Here",
                "confidence": 0.9,
                "evidence": {
                    "regions": [
                        {"x": 0.5, "y": 0.5, "width": 0.1, "height": 0.1}, # valid
                        {"x": 1.5, "y": 0.5, "width": 0.1, "height": 0.1}, # invalid x
                        {"x": 0.5, "y": 0.5, "width": -0.1, "height": 0.1} # invalid w
                    ]
                }
            }
        
        agents.grounding_agent.call_gemini = mock_call
        res = agents.grounding_agent.run_grounding("Where?", b"", "image/jpeg", "test.jpg")
        
        # Restore
        agents.grounding_agent.call_gemini = original_call
        
        regions = res["evidence"]["regions"]
        self.assertEqual(len(regions), 1)
        self.assertEqual(regions[0]["x"], 0.5)

if __name__ == "__main__":
    unittest.main()
