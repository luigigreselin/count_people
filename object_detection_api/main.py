from __future__ import annotations

import base64
import os
from collections import Counter
from io import BytesIO
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI
from fastapi import File
from fastapi import Header
from fastapi import Request
from fastapi import Response
from fastapi import UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from PIL import Image
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
CHUNK_SIZE = 1024*1024
app = FastAPI()
model = YOLO('yolov8n.pt')

templates = Jinja2Templates(directory=str(Path(BASE_DIR, 'static')))


app.mount(
    '/static', StaticFiles(directory=str(Path(BASE_DIR, 'static/'))),
    name='static',
)


@app.get('/', response_class=HTMLResponse)
async def index(request: Request) -> Any:
    return templates.TemplateResponse(
        'index.html', {'request': request, 'minimum_user_response_time': 20},
    )


@app.post('/image')
async def upload_image(file: UploadFile = File(...)) -> dict[str, Any]:
    # Read and process the uploaded image
    image_bytes = await file.read()
    image = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    # Perform object detection
    results = model.predict(image)

    detections = {}
    for result in results:
        detections['detected_objects'] = Counter([
            result.names[int(object_cls)] for object_cls in result.boxes.cls
        ])

    img_with_detections = results[0].plot()

    img_rgb = cv2.cvtColor(img_with_detections, cv2.COLOR_BGR2RGB)

    # Convert the image to a PIL image and then to a base64-encoded string
    pil_img = Image.fromarray(img_rgb)
    buffered = BytesIO()
    pil_img.save(buffered, format='JPEG')
    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

    return {'detections': detections, 'image': img_base64}


# @app.post('/video')
# async def video_endpoint(
#     file: UploadFile = File(...),
#     range: str = Header(None),
# ): 
#     print("RANGE IS", range)
#     start_str, end_str = range.replace('bytes=', '').split('-')
#     start = int(start_str)
#     end = int(end_str) if end_str else start + CHUNK_SIZE
#     print('START IS', start, "END IS", end)
#     # end = end if end else start + CHUNK_SIZE
#     file.file.seek(0, os.SEEK_END)
#     filesize = file.file.tell()
#     print('FILESIZE', filesize)
#     # end = min(end, filesize)
#     print(f"NEW END IS {end}")
#     file.file.seek(start)

#     # if end > filesize:
#     #     end = filesize
#     data = file.file.read(end - start)
#     print("LAST", end - start, end, start)

#     headers = {
#         'Content-Range': f'bytes {start}-{end-1}/{filesize}',
#         'Accept-Ranges': 'bytes',
#         'Content-Length': str(end - start),
#     }

#     return Response(
#         data, status_code=206,
#         headers=headers,
#         media_type='video/mp4',
#     )


video_path = Path("./video.mp4")

@app.get("/video")
async def video_endpoint(range: str = Header(None)):
    start, end = range.replace("bytes=", "").split("-")
    print("RAGE", range)
    start = int(start)
    print("OLD END", end)
    end = int(end) if end else start + CHUNK_SIZE
    print("START", start, "END", end)
    with open(video_path, "rb") as video:
        video.seek(start)
        data = video.read(end - start)
        filesize = str(video_path.stat().st_size)
        print("SIZE", filesize)
        headers = {
            'Content-Range': f'bytes {str(start)}-{str(end)}/{filesize}',
            'Accept-Ranges': 'bytes'
        }
        return Response(data, status_code=206, headers=headers, media_type="video/mp4")