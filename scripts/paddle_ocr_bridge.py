import contextlib
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")

from paddleocr import PaddleOCR


def serialize_result(item):
    data = item.res if hasattr(item, "res") else item
    texts = list(data.get("rec_texts", []) or [])
    scores = list(data.get("rec_scores", []) or [])
    boxes_raw = data.get("rec_boxes")
    boxes = list(boxes_raw) if boxes_raw is not None else []

    lines = []
    for index, text in enumerate(texts):
        box = (
            boxes[index].tolist()
            if index < len(boxes) and hasattr(boxes[index], "tolist")
            else boxes[index]
            if index < len(boxes)
            else None
        )
        score = scores[index] if index < len(scores) else None
        if score is not None and hasattr(score, "item"):
            score = float(score.item())

        lines.append(
            {
                "text": text,
                "confidence": float(score) if score is not None else 0.0,
                "box": box,
            }
        )

    return {
        "input_path": data.get("input_path"),
        "lines": lines,
    }


def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Expected a single image path argument."}))
        sys.exit(1)

    image_path = Path(sys.argv[1]).resolve()

    if not image_path.exists():
        print(json.dumps({"error": f"Image path does not exist: {image_path}"}))
        sys.exit(1)

    with contextlib.redirect_stdout(sys.stderr):
        ocr = PaddleOCR(
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            engine="paddle",
        )
        result = ocr.predict(str(image_path))

    payload = [serialize_result(item) for item in result]
    print(json.dumps({"pages": payload}))


if __name__ == "__main__":
    main()
