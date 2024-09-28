from __future__ import annotations

from io import BytesIO

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from object_detection_api.main import app

client = TestClient(app)


@pytest.fixture(scope='session')
def image() -> BytesIO:
    image = np.zeros((100, 100, 3), dtype=np.uint8)
    _, image_encoded = cv2.imencode('.jpg', image)
    return BytesIO(image_encoded.tobytes())


def test_get():
    response = client.get('/')
    assert response.status_code == 200
    assert 'text/html' in response.headers['Content-Type']
    # Check for content in the response
    assert '<p>Drag & Drop your files here</p>' in response.text


def test_upload_image(image: BytesIO):
    files = {'file': ('test_image.jpg', image, 'image/jpeg')}
    response = client.post('/upload', files=files)

    assert response.status_code == 200
    output = response.json()
    assert 'detections' in output.keys()
    assert 'image' in output.keys()
