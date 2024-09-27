from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from count_people.object_detection_api.main import app


client = TestClient(app)


def test_get():
    response = client.get("/")
    assert response.status_code == 200
    print("HERE" ,response)
    assert "text/html" in response.headers["Content-Type"]
    assert "<p>Drag & Drop your files here</p>" in response.text  # Check for content in the response
    # assert "minimum_user_response_time" in response.text  