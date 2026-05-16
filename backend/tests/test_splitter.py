"""
Testy jednostkowe algorytmu minimalizacji przepływu gotówki (services/splitter.py).
Testy bez bazy danych — sprawdzają tylko logikę obliczeniową.
"""
from uuid import UUID, uuid4
from unittest.mock import MagicMock
import pytest

from app.services.splitter import calculate_balances, EPSILON


def _make_expense(paid_by_id: UUID, amount: float, split_ids: list[UUID]) -> MagicMock:
    """Helper: tworzy mock obiektu Expense z wymaganymi polami."""
    expense = MagicMock()
    expense.paid_by_id = paid_by_id
    expense.amount = amount
    expense.splits = [MagicMock(user_id=uid) for uid in split_ids]
    return expense


class TestCalculateBalances:
    def test_empty_list(self):
        assert calculate_balances([]) == []

    def test_single_expense_two_people(self):
        """Jeden wydatek: A zapłacił 100 zł, dzielone A+B → B winien A 50 zł."""
        a, b = uuid4(), uuid4()
        exp = _make_expense(paid_by_id=a, amount=100.0, split_ids=[a, b])
        result = calculate_balances([exp])
        assert len(result) == 1
        assert result[0]["from_user_id"] == b
        assert result[0]["to_user_id"] == a
        assert abs(result[0]["amount"] - 50.0) < EPSILON

    def test_equal_payments_zero_balance(self):
        """Oboje zapłacili po równo → brak rozliczeń."""
        a, b = uuid4(), uuid4()
        exp_a = _make_expense(paid_by_id=a, amount=100.0, split_ids=[a, b])
        exp_b = _make_expense(paid_by_id=b, amount=100.0, split_ids=[a, b])
        result = calculate_balances([exp_a, exp_b])
        assert result == []

    def test_three_people_one_payer(self):
        """A zapłacił 90 zł za A+B+C → B winien A 30 zł, C winien A 30 zł."""
        a, b, c = uuid4(), uuid4(), uuid4()
        exp = _make_expense(paid_by_id=a, amount=90.0, split_ids=[a, b, c])
        result = calculate_balances([exp])
        assert len(result) == 2
        froms = {r["from_user_id"] for r in result}
        assert froms == {b, c}
        for r in result:
            assert r["to_user_id"] == a
            assert abs(r["amount"] - 30.0) < EPSILON

    def test_excluded_users_not_counted(self):
        """Osoba wykluczona (RSVP=odrzucone) nie wchodzi w podział."""
        a, b, excluded = uuid4(), uuid4(), uuid4()
        # Wydatek na A+B+excluded, ale excluded wykluczone
        exp = _make_expense(paid_by_id=a, amount=90.0, split_ids=[a, b, excluded])
        result = calculate_balances([exp], excluded_user_ids={excluded})
        # Podział tylko na A i B → B winien A 45 zł
        assert len(result) == 1
        assert result[0]["from_user_id"] == b
        assert result[0]["to_user_id"] == a
        assert abs(result[0]["amount"] - 45.0) < EPSILON

    def test_all_excluded_skips_expense(self):
        """Wszystkie osoby w splicie wykluczone → wydatek ignorowany."""
        a = uuid4()
        exp = _make_expense(paid_by_id=a, amount=100.0, split_ids=[a])
        result = calculate_balances([exp], excluded_user_ids={a})
        assert result == []

    def test_minimum_transactions(self):
        """
        A zapłacił 60, B zapłacił 30, C zapłacił 0 — każdy powinien zapłacić 30.
        Optymalnie: C przelewa 30 do A (jedna transakcja zamiast dwóch).
        """
        a, b, c = uuid4(), uuid4(), uuid4()
        exp_a = _make_expense(paid_by_id=a, amount=60.0, split_ids=[a, b, c])
        exp_b = _make_expense(paid_by_id=b, amount=30.0, split_ids=[a, b, c])
        result = calculate_balances([exp_a, exp_b])
        assert len(result) == 1
        assert result[0]["from_user_id"] == c
        assert result[0]["to_user_id"] == a
        assert abs(result[0]["amount"] - 30.0) < EPSILON

    def test_rounding_precision(self):
        """Podział 10 zł na 3 osoby nie powoduje dryfu floatów."""
        a, b, c = uuid4(), uuid4(), uuid4()
        exp = _make_expense(paid_by_id=a, amount=10.0, split_ids=[a, b, c])
        result = calculate_balances([exp])
        total_settled = sum(r["amount"] for r in result)
        expected = 10.0 * 2 / 3
        assert abs(total_settled - expected) < 0.05
