from __future__ import annotations

import unittest

from workflow import build_workflow, validate_workflow_values


def template() -> dict:
    return {
        "5508": {"inputs": {"value": ""}, "class_type": "PrimitiveStringMultiline"},
        "5512": {"inputs": {"value": 5.0}, "class_type": "PrimitiveFloat"},
        "5511": {"inputs": {"value": 24.0}, "class_type": "PrimitiveFloat"},
        "5514:3059": {
            "inputs": {"width": 480, "height": 272},
            "class_type": "EmptyLTXVLatentVideo",
        },
        "5014:4988": {"inputs": {"value": 193}, "class_type": "PrimitiveInt"},
        "5014:5506": {"inputs": {"value": False}, "class_type": "PrimitiveBoolean"},
        "2004": {"inputs": {"image": ""}, "class_type": "LoadImage"},
        "4852": {"inputs": {"filename_prefix": "ComfyUI"}, "class_type": "SaveVideo"},
    }


class WorkflowParameterizationTests(unittest.TestCase):
    def test_t2v_changes_only_public_inputs(self) -> None:
        w = build_workflow(
            action="text_to_video",
            prompt="a test",
            duration=8,
            width=704,
            height=1280,
            fps=24,
            seed=12345,
            generate_audio=True,
            template=template(),
        )
        validate_workflow_values(
            w,
            action="text_to_video",
            prompt="a test",
            duration=8,
            width=704,
            height=1280,
            fps=24,
            seed=12345,
            generate_audio=True,
        )
        self.assertEqual(w["5014:5506"]["inputs"]["value"], False)

    def test_i2v_uses_same_graph_and_enables_image(self) -> None:
        w = build_workflow(
            action="image_to_video",
            prompt="a test",
            duration=8,
            width=704,
            height=1280,
            fps=24,
            seed=12345,
            generate_audio=True,
            image_filename="input.png",
            template=template(),
        )
        validate_workflow_values(
            w,
            action="image_to_video",
            prompt="a test",
            duration=8,
            width=704,
            height=1280,
            fps=24,
            seed=12345,
            generate_audio=True,
            image_filename="input.png",
        )
        self.assertTrue(w["5014:5506"]["inputs"]["value"])
        self.assertEqual(w["2004"]["inputs"]["image"], "input.png")


if __name__ == "__main__":
    unittest.main()
