from __future__ import annotations

import base64
from io import BytesIO
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI
from fastapi import File
from fastapi import Request
from fastapi import UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from PIL import Image
from ultralytics import YOLO  # type: ignore
from utils.wb_manager import ConnectionManager

app = FastAPI()
websocket_manager = ConnectionManager()
model = YOLO('yolov8n.pt')
templates = Jinja2Templates(directory='./static')

app.mount('/static', StaticFiles(directory='static'), name='static')


@app.get('/', response_class=HTMLResponse)
async def index(request: Request) -> Any:
    return templates.TemplateResponse(
        'index.html', {'request': request, 'minimum_user_response_time': 20},
    )


@app.post('/upload')
async def upload_image(file: UploadFile = File(...)):
    # Read and process the uploaded image
    image_bytes = await file.read()
    image = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    # Perform object detection
    results = model.predict(image)

    detections = {}
    for result in results:
        detections['detected_objects'] = [
            result.names[int(object_cls)] for object_cls in result.boxes.cls
        ]

    # Draw detections on the image
    img_with_detections = results[0].plot()

    # Convert the resulting image to RGB (for proper color display)
    img_rgb = cv2.cvtColor(img_with_detections, cv2.COLOR_BGR2RGB)

    # Convert the image to a PIL image and then to a base64-encoded string
    pil_img = Image.fromarray(img_rgb)
    buffered = BytesIO()
    pil_img.save(buffered, format='JPEG')
    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

    return {'detections': detections, 'image': img_base64}
