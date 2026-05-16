"""
Testy integracyjne endpointów wydatków i rozliczeń (expenses.py).
Sprawdzają m.in. wykluczanie użytkowników z RSVP=declined.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.participant import Participant, ParticipantRole, RsvpStatus
from app.models.expense import Expense, ExpenseSplit


def _add_expense(client, headers, event_id, description, amount, split_among):
    return client.post(f"/events/{event_id}/expenses", json={
        "description": description,
        "amount": amount,
        "currency": "PLN",
        "split_among": split_among,
    }, headers=headers)


class TestAddExpense:
    def test_add_expense_success(self, client: TestClient, auth_headers, test_event, test_user):
        resp = _add_expense(
            client, auth_headers, str(test_event.id),
            "Pizza", 60.0, [str(test_user.id)]
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["description"] == "Pizza"
        assert data["amount"] == 60.0
        assert data["currency"] == "PLN"
        assert data["paid_by"]["id"] == str(test_user.id)

    def test_add_expense_no_access(self, client: TestClient, second_auth_headers, test_event, second_user):
        """Użytkownik niezaproszony do eventu nie może dodać wydatku."""
        resp = _add_expense(
            client, second_auth_headers, str(test_event.id),
            "Coś", 10.0, [str(second_user.id)]
        )
        assert resp.status_code == 403

    def test_add_expense_invalid_amount(self, client: TestClient, auth_headers, test_event, test_user):
        resp = _add_expense(
            client, auth_headers, str(test_event.id),
            "Zero", 0.0, [str(test_user.id)]
        )
        assert resp.status_code == 422


class TestListExpenses:
    def test_list_expenses(self, client: TestClient, auth_headers, test_event, test_user):
        _add_expense(client, auth_headers, str(test_event.id), "Bilet", 50.0, [str(test_user.id)])
        _add_expense(client, auth_headers, str(test_event.id), "Jedzenie", 80.0, [str(test_user.id)])

        resp = client.get(f"/events/{test_event.id}/expenses", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_declined_user_excluded_from_split(
        self, client: TestClient, db: Session, auth_headers, test_event, test_user, second_user
    ):
        """
        Wydatek dodany gdy second_user jest pending → split na 2 osoby.
        Po odrzuceniu przez second_user → split_among w odpowiedzi nie zawiera second_user.
        """
        # Zaproś second_user
        client.post(f"/events/{test_event.id}/invite", json={"email": second_user.email}, headers=auth_headers)

        # Dodaj wydatek split na obu
        _add_expense(
            client, auth_headers, str(test_event.id),
            "Coś drogiego", 100.0, [str(test_user.id), str(second_user.id)]
        )

        # Zmień RSVP second_user na DECLINED bezpośrednio w DB
        from sqlmodel import select
        participant = db.exec(
            select(Participant).where(
                Participant.event_id == test_event.id,
                Participant.user_id == second_user.id,
            )
        ).first()
        participant.rsvp = RsvpStatus.DECLINED
        db.add(participant)
        db.commit()

        resp = client.get(f"/events/{test_event.id}/expenses", headers=auth_headers)
        assert resp.status_code == 200
        expense = resp.json()[0]
        # split_among nie powinien zawierać wykluczonego użytkownika
        assert str(second_user.id) not in expense["split_among"]


class TestGetBalances:
    def test_no_expenses_returns_empty(self, client: TestClient, auth_headers, test_event):
        resp = client.get(f"/events/{test_event.id}/expenses/balances", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_balanced_returns_empty(self, client: TestClient, db: Session, auth_headers, test_event, test_user, second_user):
        """Oboje zapłacili po równo → brak długów."""
        # Zaproś i zaakceptuj second_user
        client.post(f"/events/{test_event.id}/invite", json={"email": second_user.email}, headers=auth_headers)
        from sqlmodel import select as _sel
        participant = db.exec(
            _sel(Participant).where(
                Participant.event_id == test_event.id,
                Participant.user_id == second_user.id,
            )
        ).first()
        participant.rsvp = RsvpStatus.ACCEPTED
        db.commit()

        # Test_user zapłacił 100, split na obu
        _add_expense(client, auth_headers, str(test_event.id), "A", 100.0,
                     [str(test_user.id), str(second_user.id)])
        # Second_user zapłacił 100, split na obu
        from app.core.security import create_access_token
        second_headers = {"Authorization": f"Bearer {create_access_token(str(second_user.id))}"}
        _add_expense(client, second_headers, str(test_event.id), "B", 100.0,
                     [str(test_user.id), str(second_user.id)])

        resp = client.get(f"/events/{test_event.id}/expenses/balances", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_balances_exclude_declined(
        self, client: TestClient, db: Session, auth_headers, test_event, test_user, second_user
    ):
        """
        Wydatek 90 zł split na A+B+C. C odrzuca RSVP.
        Balans powinien być liczony tylko dla A+B (po 45 zł).
        """
        from app.core.security import create_access_token
        # Utwórz trzeciego użytkownika
        from app.models.user import User
        from app.core.security import get_password_hash
        third = User(email="trzeci@example.com", full_name="Trzeci", hashed_password=get_password_hash("x"))
        db.add(third)
        db.commit()
        db.refresh(third)

        # Zaproś second_user i third
        client.post(f"/events/{test_event.id}/invite", json={"email": second_user.email}, headers=auth_headers)
        client.post(f"/events/{test_event.id}/invite", json={"email": third.email}, headers=auth_headers)

        # Zaakceptuj second_user
        from sqlmodel import select as _select
        p2 = db.exec(_select(Participant).where(Participant.event_id == test_event.id, Participant.user_id == second_user.id)).first()
        p2.rsvp = RsvpStatus.ACCEPTED
        # Odrzuć third
        p3 = db.exec(_select(Participant).where(Participant.event_id == test_event.id, Participant.user_id == third.id)).first()
        p3.rsvp = RsvpStatus.DECLINED
        db.commit()

        # Dodaj wydatek na wszystkich trzech
        _add_expense(client, auth_headers, str(test_event.id), "Wspólne", 90.0,
                     [str(test_user.id), str(second_user.id), str(third.id)])

        resp = client.get(f"/events/{test_event.id}/expenses/balances", headers=auth_headers)
        assert resp.status_code == 200
        balances = resp.json()
        # Przy wyeliminowaniu third, split 90 zł na A+B → B winien A 45 zł
        assert len(balances) == 1
        assert abs(balances[0]["amount"] - 45.0) < 0.01
