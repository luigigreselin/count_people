from __future__ import annotations

from count_people.object_detection_api.main import app
from fastapi.testclient import TestClient


client = TestClient(app)


def test_get():
    response = client.get('/')
    assert response.status_code == 200
    print('HERE', response)
    assert 'text/html' in response.headers['Content-Type']
    # Check for content in the response
    assert '<p>Drag & Drop your files here</p>' in response.text
    # assert "minimum_user_response_time" in response.text
