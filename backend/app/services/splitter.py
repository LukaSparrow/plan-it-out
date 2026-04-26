"""
Silnik Splittera - liczy minimalną liczbę transakcji potrzebnych do wyzerowania
bilansów grupowych wydatków.

Problem klasyczny: "Minimum Cash Flow". Mając listę wydatków (kto zapłacił,
ile, między ilu osób dzielone), zwróć listę przelewów X -> Y, której łączna
długość jest jak najmniejsza.

Algorytm zachłanny (greedy):
  1. Dla każdej osoby policz net balance: sum(zapłacone) - sum(udział w wydatkach).
     Plus = dostaje, minus = winien.
  2. W pętli: największy dłużnik płaci największemu wierzycielowi tyle, ile
     mniejsza z dwóch wartości bezwzględnych. Jedna z osób trafia w 0 i wypada.
  3. Powtarzaj aż wszystkie sumy = 0.

Algorytm nie daje gwarantowanego optimum (problem jest NP-trudny w ogólności),
ale dla praktycznych wielkości grup (do ~20 osób) wynik jest zwykle minimalny
lub bliski optymalnego, a koszt to O(n log n).
"""
from typing import List, Dict
from uuid import UUID
from collections import defaultdict
from app.models.expense import Expense


# Tolerancja błędu zaokrągleń float - poniżej 1 grosza = traktuj jako 0
EPSILON = 0.01


def calculate_balances(expenses: List[Expense]) -> List[dict]:
    """
    Zwraca listę "kto komu ile winien" jako listę słowników:
    [{"from_user_id": UUID, "to_user_id": UUID, "amount": float}, ...]

    Endpoint owija to potem w schemat Balance, dociągając pełne obiekty UserPublic.
    """
    if not expenses:
        return []

    # Krok 1: net balance per user_id
    net: Dict[UUID, float] = defaultdict(float)

    for exp in expenses:
        if not exp.splits:
            # Wydatek bez splitów - traktujemy jakby tylko płacący był obciążony
            # (czyli efektywnie 0, sam sobie zapłacił). Pomijamy.
            continue

        share = exp.amount / len(exp.splits)
        net[exp.paid_by_id] += exp.amount   # Dostaje całość
        for split in exp.splits:
            net[split.user_id] -= share     # Każdy "split-er" oddaje swój udział

    # Krok 2: greedy matching - zaokrąglamy do 2 miejsc, żeby uniknąć dryfu floatów
    creditors = []  # (user_id, amount > 0)
    debtors = []    # (user_id, amount < 0)
    for uid, balance in net.items():
        balance = round(balance, 2)
        if balance > EPSILON:
            creditors.append([uid, balance])
        elif balance < -EPSILON:
            debtors.append([uid, balance])

    # Sortujemy malejąco po wartości bezwzględnej, żeby zawsze brać największych
    creditors.sort(key=lambda x: -x[1])
    debtors.sort(key=lambda x: x[1])

    transactions: List[dict] = []

    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debtor_id, debt = debtors[i]      # debt < 0
        creditor_id, credit = creditors[j]  # credit > 0

        # Ile faktycznie się przelewa - mniejsza z dwóch wartości bezwzględnych
        amount = min(-debt, credit)
        amount = round(amount, 2)

        if amount > EPSILON:
            transactions.append({
                "from_user_id": debtor_id,
                "to_user_id": creditor_id,
                "amount": amount,
            })

        debtors[i][1] += amount    # debt rośnie do 0
        creditors[j][1] -= amount  # credit maleje do 0

        # Ten, kto trafił w 0, wypada
        if abs(debtors[i][1]) < EPSILON:
            i += 1
        if abs(creditors[j][1]) < EPSILON:
            j += 1

    return transactions
