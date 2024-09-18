from __future__ import annotations

from fastapi import FastAPI
from ultralytics import YOLO  # type: ignore

app = FastAPI()


@app.get('/')
async def root():
    return {'message': 'Hello World'}


model = YOLO('yolov8n.pt')


@app.post('/detect/')
async def detect_objects(detected_class: list[int] = [0]):

    results = model.predict(
        source='0', show=True, classes=detected_class, conf=0.8,
    )  # Display preds. Accepts all YOLO predict arguments

    return {'detections': results}
