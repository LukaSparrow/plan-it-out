# 🗺️ Plan It Out – Event Co-pilot

> Inteligentny planner wydarzeń i spotkań dla Ciebie i Twoich znajomych.

## Stack technologiczny

| Warstwa    | Technologia                            |
| ---------- | -------------------------------------- |
| Framework  | Next.js 14 (App Router)                |
| Stylowanie | Tailwind CSS                           |
| Ikony      | Lucide React                           |
| Formularze | React Hook Form + Zod                  |
| State      | Zustand (auth) + TanStack Query (dane) |
| Wykresy    | Recharts                               |
| HTTP       | Axios                                  |
| Animacje   | Framer Motion                          |
| Daty       | date-fns (locale: pl)                  |

## Szybki start

```bash
# 1. Zainstaluj zależności
npm install

# 2. Skopiuj i skonfiguruj zmienne środowiskowe
cp .env.example .env.local

# 3. Uruchom serwer deweloperski
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

**Demo login:** `jan@example.com` / `password`

## Zmienne środowiskowe

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000   # URL backendu FastAPI
NEXT_PUBLIC_GOOGLE_MAPS_KEY=               # Klucz Google Maps (opcjonalny)
```

## Struktura projektu

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx        # Ekran logowania
│   │   └── register/page.tsx     # Ekran rejestracji
│   ├── dashboard/
│   │   ├── layout.tsx            # Sidebar + nawigacja
│   │   ├── page.tsx              # Główny dashboard
│   │   ├── events/page.tsx       # Lista wydarzeń
│   │   ├── friends/page.tsx      # Znajomi (WIP)
│   │   ├── expenses/page.tsx     # Rozliczenia globalne (WIP)
│   │   └── settings/page.tsx     # Ustawienia (WIP)
│   ├── globals.css               # Design tokens + Tailwind
│   └── layout.tsx                # Root layout
├── components/
│   ├── dashboard/
│   │   ├── DashboardStats.tsx    # Karty ze statystykami
│   │   ├── UpcomingEvents.tsx    # Nadchodzące wydarzenia
│   │   ├── ActivityFeed.tsx      # Feed aktywności
│   │   └── MyTasks.tsx           # Moje zadania z checklisty
│   ├── events/
│   │   └── EventCard.tsx         # Karta wydarzenia
│   └── ui/
│       ├── ThemeProvider.tsx     # Dark/light mode
│       └── QueryProvider.tsx     # TanStack Query
├── lib/
│   ├── api.ts                    # Axios client + endpointy
│   ├── mock-data.ts              # Dane testowe (dev)
│   ├── store.ts                  # Zustand auth store
│   └── utils.ts                  # cn(), formatDate(), etc.
└── types/
    └── index.ts                  # TypeScript interfaces
```

## API Contract (dla Osoby A – Backend)

Główne endpointy których oczekuje frontend:

```
POST   /auth/register          { name, email, password }
POST   /auth/login             { email, password } → { access_token }
GET    /auth/me                → User

GET    /events                 → Event[]
POST   /events                 → Event
GET    /events/:id             → Event
PUT    /events/:id             → Event
DELETE /events/:id

POST   /events/:id/invite      { email }

GET    /events/:id/checklist   → ChecklistItem[]
POST   /events/:id/checklist   { label, assigned_to? }
PATCH  /events/:id/checklist/:itemId/toggle

GET    /events/:id/expenses    → Expense[]
POST   /events/:id/expenses    { description, amount, currency, split_among[] }
GET    /events/:id/expenses/balances → Balance[]
```

Wszystkie chronione endpointy wymagają headera: `Authorization: Bearer <token>`

## Co dalej (roadmap)

- [ ] Widok szczegółu wydarzenia (`/dashboard/events/[id]`)
- [ ] Formularz tworzenia wydarzenia
- [ ] Panel finansowy z wykresami (Recharts)
- [ ] Integracja z Leaflet/Google Maps
- [ ] WebSocket (real-time checklist)
- [ ] Strona profilu i ustawień
- [ ] Integracja z prawdziwym backendem FastAPI
- [ ] OAuth Google
- [ ] PWA + tryb offline

## Podział pracy

### Osoba A: Backend & Data Architect (FastAPI + DB)

Fundamenty i Auth:
Konfiguracja FastAPI i połączenie z bazą PostgreSQL.

Implementacja systemu rejestracji i logowania (JWT).

Modelowanie Bazy Danych:
Stworzenie schematów dla: Użytkowników, Wydarzeń, Listy Zadań (Checklist) i Wydatków.

Logika Wydarzeń:
Endpointy CRUD dla wydarzeń (tworzenie, edycja, usuwanie, zapraszanie znajomych).

Silnik Rozliczeń (The "Splitter"):
Implementacja algorytmu w Pythonie, który na podstawie wpisanych kosztów wylicza najmniejszą liczbę transakcji między uczestnikami, aby wyzerować balanse.

Websockety / Powiadomienia:
Umożliwienie przesyłania powiadomień o zmianach w liście zadań w czasie rzeczywistym.

### Osoba B: Frontend & UX Engineer (Next.js + Tailwind)

System Design & Auth UI:
Konfiguracja Next.js z Tailwind CSS.

Stworzenie stron logowania i rejestracji z walidacją formularzy (np. React Hook Form).

Dashboard i Nawigacja:
Widok główny z listą nadchodzących wydarzeń (karty z datą, miejscem i statusem).

Interaktywny Planner (Event View):
Stworzenie dynamicznej listy "Checklist" (dodawanie/odhaczanie zadań bez przeładowania strony).

Integracja z Mapami (np. Google Maps lub Leaflet) do wizualizacji miejsca spotkania.

Panel Finansowy (Expenses UI):
Formularz dodawania wydatku i czytelny widok "Kto komu ile winien" z wykresami (np. Recharts).

RWD i Detale:
Dopracowanie wersji mobilnej (kluczowe dla planera w terenie) oraz obsługa trybu Dark/Light Mode.

### Punkty wspólne (Synchronizacja)

API Contract: formaty JSON dla kluczowych obiektów (Wydarzenie, Użytkownik), żeby Frontend wiedział, czego się spodziewać po Backendzie.

Deployment: Wspólna konfiguracja Dockera lub platformy typu Vercel (frontend) + Render/Railway (backend).

Pro-tip: Do komunikacji między frontendem a backendem podczas developmentu warto użyć narzędzia Swagger UI, które FastAPI generuje automatycznie pod adresem /docs dla Osoby B.
