"""
Testy integracyjne endpointów autoryzacji (auth.py + google_auth.py).
Korzystają z TestClient FastAPI i SQLite in-memory z conftest.py.
"""
import pytest
from fastapi.testclient import TestClient


class TestRegister:
    def test_register_success(self, client: TestClient):
        resp = client.post("/auth/register", json={
            "email": "new@example.com",
            "full_name": "Nowy Użytkownik",
            "password": "haslo1234",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "new@example.com"
        assert data["full_name"] == "Nowy Użytkownik"
        assert "id" in data
        # Token nigdy nie trafia do odpowiedzi rejestracji
        assert "hashed_password" not in data

    def test_register_duplicate_email(self, client: TestClient, test_user):
        resp = client.post("/auth/register", json={
            "email": test_user.email,
            "full_name": "Ktoś inny",
            "password": "haslo1234",
        })
        assert resp.status_code == 400

    def test_register_missing_fields(self, client: TestClient):
        resp = client.post("/auth/register", json={"email": "x@x.com"})
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client: TestClient, test_user):
        resp = client.post("/auth/login", data={
            "username": test_user.email,
            "password": "password123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client: TestClient, test_user):
        resp = client.post("/auth/login", data={
            "username": test_user.email,
            "password": "zlehaslo",
        })
        assert resp.status_code == 400

    def test_login_unknown_email(self, client: TestClient):
        resp = client.post("/auth/login", data={
            "username": "nieistnieje@example.com",
            "password": "cokolwiek",
        })
        assert resp.status_code == 400


class TestMe:
    def test_me_authenticated(self, client: TestClient, test_user, auth_headers):
        resp = client.get("/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert "google_connected" in data
        assert data["google_connected"] is False

    def test_me_no_token(self, client: TestClient):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_me_invalid_token(self, client: TestClient):
        resp = client.get("/auth/me", headers={"Authorization": "Bearer nieprawdziwy.token.xyz"})
        assert resp.status_code == 401
