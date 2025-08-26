import pytest
from httpx import AsyncClient
from api.main import app
from fastapi.testclient import TestClient

def test_get_test_endpoint():
    client = TestClient(app)
    response = client.get("/test")
    assert response.status_code == 200