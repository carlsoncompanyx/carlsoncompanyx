import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from workflow import build_workflow, validate_workflow_values


class WorkflowParameterizationTests(unittest.TestCase):
    def test_only_deliberate_inputs_change(self):
        request = {"prompt": "a dog on a beach", "duration": 8, "width": 704, "height": 1280, "fps": 24, "seed": 99}
        workflow = build_workflow(**request, generate_audio=True)
        validate_workflow_values(workflow, request)
        self.assertEqual(workflow["1"]["inputs"]["unet_name"], "ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors")
        self.assertEqual(workflow["4"]["inputs"]["clip_name"], "gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors")
        self.assertEqual(workflow["2"]["inputs"]["vae_name"], "ltx-2.5-video-vae-bf16.safetensors")
        self.assertEqual(workflow["3"]["inputs"]["vae_name"], "ltx-2.5-audio-vae-bf16.safetensors")
        self.assertEqual(workflow["12"]["inputs"]["audio"], ["11", 0])
        self.assertFalse(any("prompt_enhance" in json.dumps(node) for node in workflow.values()))

    def test_audio_can_be_omitted_from_mux(self):
        workflow = build_workflow(prompt="x", duration=2, width=704, height=1280, fps=24, seed=1, generate_audio=False)
        self.assertNotIn("audio", workflow["12"]["inputs"])


if __name__ == "__main__":
    unittest.main()

