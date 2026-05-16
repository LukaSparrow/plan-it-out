"""
Testy integracyjne endpointów wydarzeń (events.py).
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone, timedelta


FUTURE_DATE = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()


class TestCreateEvent:
    def test_create_success(self, client: TestClient, auth_headers):
        resp = client.post("/events/", json={
            "title": "Nowe wydarzenie",
            "date": FUTURE_DATE,
            "location": "Kraków",
            "category": "meetup",
        }, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Nowe wydarzenie"
        assert data["location"] == "Kraków"
        assert "id" in data

    def test_create_requires_auth(self, client: TestClient):
        resp = client.post("/events/", json={
            "title": "Event",
            "date": FUTURE_DATE,
            "location": "Gdzieś",
        })
        assert resp.status_code == 401


class TestListEvents:
    def test_list_own_events(self, client: TestClient, auth_headers, test_event):
        resp = client.get("/events/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert any(e["id"] == str(test_event.id) for e in data)

    def test_list_no_auth(self, client: TestClient):
        resp = client.get("/events/")
        assert resp.status_code == 401

    def test_list_doesnt_show_other_users_events(
        self, client: TestClient, second_auth_headers, test_event
    ):
        """Użytkownik B nie widzi wydarzeń użytkownika A, do których nie jest zaproszony."""
        resp = client.get("/events/", headers=second_auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert not any(e["id"] == str(test_event.id) for e in data)


class TestGetEvent:
    def test_get_own_event(self, client: TestClient, auth_headers, test_event):
        resp = client.get(f"/events/{test_event.id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(test_event.id)
        assert "participants" in data

    def test_get_event_not_found(self, client: TestClient, auth_headers):
        resp = client.get("/events/00000000-0000-0000-0000-000000000000", headers=auth_headers)
        assert resp.status_code == 404

    def test_get_event_forbidden(self, client: TestClient, second_auth_headers, test_event):
        resp = client.get(f"/events/{test_event.id}", headers=second_auth_headers)
        assert resp.status_code == 403


class TestUpdateEvent:
    def test_update_success(self, client: TestClient, auth_headers, test_event):
        resp = client.put(f"/events/{test_event.id}", json={
            "title": "Zmieniony tytuł",
        }, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Zmieniony tytuł"

    def test_update_forbidden_non_owner(self, client: TestClient, second_auth_headers, test_event):
        resp = client.put(f"/events/{test_event.id}", json={"title": "Hack"}, headers=second_auth_headers)
        assert resp.status_code == 403


class TestDeleteEvent:
    def test_delete_success(self, client: TestClient, auth_headers, test_event):
        resp = client.delete(f"/events/{test_event.id}", headers=auth_headers)
        assert resp.status_code == 204

    def test_delete_forbidden(self, client: TestClient, second_auth_headers, test_event):
        resp = client.delete(f"/events/{test_event.id}", headers=second_auth_headers)
        assert resp.status_code == 403


class TestInvite:
    def test_invite_by_email(self, client: TestClient, auth_headers, test_event, second_user):
        resp = client.post(f"/events/{test_event.id}/invite", json={
            "email": second_user.email
        }, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["rsvp"] == "pending"

    def test_invite_unknown_email(self, client: TestClient, auth_headers, test_event):
        resp = client.post(f"/events/{test_event.id}/invite", json={
            "email": "nieistnieje@example.com"
        }, headers=auth_headers)
        assert resp.status_code == 404

    def test_invite_duplicate(self, client: TestClient, auth_headers, test_event, second_user):
        # Pierwsze zaproszenie
        client.post(f"/events/{test_event.id}/invite", json={"email": second_user.email}, headers=auth_headers)
        # Drugie zaproszenie tej samej osoby
        resp = client.post(f"/events/{test_event.id}/invite", json={"email": second_user.email}, headers=auth_headers)
        assert resp.status_code == 400
