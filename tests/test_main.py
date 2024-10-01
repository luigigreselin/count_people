from __future__ import annotations

from io import BytesIO

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from object_detection_api.main import app

client = TestClient(app)


@pytest.fixture(scope='session')
def video() -> BytesIO:
    height, width, channels = 100, 100, 3
    fps = 30
    num_frames = 30

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video = cv2.VideoWriter('temp_video.mp4', fourcc, fps, (width, height))
    for _ in range(num_frames):
        frame = np.random.randint(
            0, 256, (height, width, channels), dtype=np.uint8,
        )
        video.write(frame)

    video.release()
    with open('temp_video.mp4', 'rb') as f:
        video_bytes = BytesIO(f.read())

    return video_bytes


@pytest.fixture(scope='session')
def image() -> BytesIO:
    array = np.zeros((100, 100, 3), dtype=np.uint8)
    img = Image.fromarray(array)
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    return img_bytes


def test_get():
    response = client.get('/')
    assert response.status_code == 200
    assert 'text/html' in response.headers['Content-Type']
    # Check for content in the response
    assert '<p>Drag & Drop your files here</p>' in response.text


def test_upload_image(image: BytesIO):
    files = {'file': ('test_image.jpg', image, 'image/jpeg')}
    response = client.post('/image', files=files)

    assert response.status_code == 200
    output = response.json()
    assert 'detections' in output.keys()
    assert 'image' in output.keys()


def test_upload_video(video: BytesIO):
    files = {'file': ('test_video.mp4', video, 'video/mp4')}
    range_header = {'range': 'bytes=0-1023'}

    response = client.post('/video', headers=range_header, files=files)

    assert response.status_code == 206
