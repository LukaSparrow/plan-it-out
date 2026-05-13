# 🗺️ Plan It Out – Event Co-pilot

> Inteligentny planner wydarzeń i spotkań dla Ciebie i Twoich znajomych.

## Stack technologiczny

| Warstwa       | Technologia                              |
| ------------- | ---------------------------------------- |
| Framework     | Next.js 15 (App Router)                  |
| Stylowanie    | Tailwind CSS (custom design tokens)      |
| Ikony         | Lucide React                             |
| Formularze    | React Hook Form + Zod                    |
| State         | Zustand (auth, notifications, search) + TanStack Query (dane) |
| HTTP          | Axios (z interceptorem JWT)              |
| Toasty        | Sonner                                   |
| Mapy          | React Leaflet + Nominatim (geocoding)    |
| WebSockets    | Native WebSocket API                     |
| Daty          | date-fns (locale: pl)                    |
| Backend       | FastAPI + SQLModel + PostgreSQL (Neon)   |

## Szybki start

```bash
# Frontend
npm install
cp .env.example .env.local   # uzupełnij NEXT_PUBLIC_API_URL
npm run dev

# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Otwórz [http://localhost:3000](http://localhost:3000).

**Demo login:** `jan@example.com` / `password`

## Zmienne środowiskowe

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_KEY=        # opcjonalny, używany jako fallback dla map
```

### Backend (`.env`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth (opcjonalne — bez tych zmiennych przycisk Google zwraca 501)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

## Struktura projektu

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx            # Logowanie (e-mail + Google OAuth)
│   │   ├── register/page.tsx         # Rejestracja
│   │   └── callback/page.tsx         # Odbiór tokenu po Google OAuth
│   ├── dashboard/
│   │   ├── layout.tsx                # Weryfikacja sesji server-side
│   │   ├── page.tsx                  # Dashboard (statystyki, zaproszenia, zadania)
│   │   ├── events/
│   │   │   ├── page.tsx              # Lista wydarzeń
│   │   │   ├── new/page.tsx          # Formularz nowego wydarzenia + picker mapy
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Szczegół: hero, chat, checklist, wydatki, mapa
│   │   │       └── edit/page.tsx     # Edycja wydarzenia
│   │   ├── friends/page.tsx          # Znajomi + zaproszenia
│   │   ├── expenses/page.tsx         # Globalne rozliczenia
│   │   └── settings/page.tsx         # Ustawienia konta
│   ├── globals.css                   # Design tokens + Tailwind
│   └── layout.tsx                    # Root layout + Toaster
├── components/
│   ├── auth/
│   │   ├── AuthHero.tsx              # Lewa kolumna ekranów auth
│   │   └── AuthSocialSection.tsx     # Przycisk "Kontynuuj z Google"
│   ├── dashboard/
│   │   ├── DashboardShell.tsx        # Layout + WebSocket connect/disconnect
│   │   ├── DashboardStats.tsx        # Karty ze statystykami
│   │   ├── UpcomingEvents.tsx        # Nadchodzące wydarzenia (sidebar)
│   │   ├── ActivityFeed.tsx          # Feed aktywności
│   │   ├── MyTasks.tsx               # Zadania z checklisty przypisane do mnie
│   │   ├── NotificationPanel.tsx     # Szuflada powiadomień (prawy panel)
│   │   ├── SideBar.tsx               # Nawigacja boczna
│   │   └── SearchModal.tsx           # Wyszukiwarka Ctrl+K
│   ├── events/
│   │   ├── EventCard.tsx             # Karta na liście wydarzeń
│   │   ├── EventHero.tsx             # Baner na stronie szczegółu
│   │   ├── EventChat.tsx             # Czat real-time (WebSocket)
│   │   ├── ChecklistSection.tsx      # Lista zadań z toggle
│   │   ├── ExpensesSection.tsx       # Wydatki + salda
│   │   ├── ParticipantsSection.tsx   # Uczestnicy + zapraszanie
│   │   └── LocationSection.tsx       # Mapa OSM / Google Maps embed
│   ├── modals/
│   │   ├── InviteModal.tsx           # Zaproszenie po e-mailu
│   │   ├── AddExpenseModal.tsx       # Dodawanie wydatku z podziałem
│   │   └── AddTaskModal.tsx          # Dodawanie zadania z przypisaniem
│   └── ui/
│       ├── ModalShell.tsx            # Wrapper modali (portal)
│       ├── ClickableToast.tsx        # Toast z nawigacją po kliknięciu
│       ├── LocationPickerModal.tsx   # Modal wyboru lokalizacji
│       ├── LocationPickerMap.tsx     # Leaflet map picker (dynamic import)
│       ├── ThemeProvider.tsx         # Dark/light mode
│       └── QueryProvider.tsx         # TanStack Query
├── lib/
│   ├── api.ts                        # Axios client + wszystkie endpointy
│   ├── store.ts                      # Zustand: auth (persisted)
│   ├── chatStore.tsx                 # Zustand: WebSocket + obsługa wiadomości
│   ├── notificationStore.ts          # Zustand: powiadomienia (persisted localStorage)
│   ├── searchStore.ts                # Zustand: stan modala wyszukiwarki
│   ├── dal.ts                        # Server-side session verify (Next.js)
│   └── utils.ts                      # cn(), formatDate(), CATEGORY_*, getEventStatus()
└── types/
    └── index.ts                      # TypeScript interfaces (Event, User, Participant…)
```

## API

```
POST   /auth/register                    { full_name, email, password }
POST   /auth/login                       { username: email, password } → { access_token }
GET    /auth/me                          → User
GET    /auth/google                      → redirect do Google OAuth
GET    /auth/google/callback             → redirect do /auth/callback?token=<jwt>

GET    /events                           → Event[]
POST   /events                           → Event
GET    /events/invites                   → EventInvite[]
GET    /events/:id                       → EventReadFull
PUT    /events/:id                       → Event
DELETE /events/:id
POST   /events/:id/invite                { email }
POST   /events/:id/rsvp                  { accept: bool }
DELETE /events/:id/leave

GET    /events/:id/checklist             → ChecklistItem[]
POST   /events/:id/checklist             { label, assigned_to_email? }
PATCH  /events/:id/checklist/:itemId/toggle

GET    /events/:id/expenses              → Expense[]
POST   /events/:id/expenses              { description, amount, split_among_ids[] }
GET    /events/:id/expenses/balances     → Balance[]

GET    /events/:id/chat                  → ChatMessage[]
POST   /events/:id/chat                  { content }

GET    /friends                          → User[]
GET    /friends/requests                 → FriendRequest[]
POST   /friends/request                  { email }
POST   /friends/respond/:id              { accept: bool }
DELETE /friends/:id

WS     /ws/notifications?token=<jwt>     # real-time: czat, zaproszenia, zadania, wydatki
```

Wszystkie chronione endpointy wymagają headera: `Authorization: Bearer <token>`

## WebSocket – typy zdarzeń

| `type`                   | Kiedy                                  |
| ------------------------ | -------------------------------------- |
| `new_chat_message`       | Nowa wiadomość na czacie               |
| `event_invite_received`  | Zaproszenie do wydarzenia              |
| `friend_invite_received` | Zaproszenie do znajomych               |
| `task_assigned`          | Przypisano zadanie                     |
| `expense_added`          | Dodano wydatek z Twoim udziałem        |

## Deployment – checklista

### Zmienne środowiskowe (frontend)

```env
NEXT_PUBLIC_API_URL=https://twoja-domena-backend.com
```

### Zmienne środowiskowe (backend `.env`)

```env
FRONTEND_URL=https://twoja-domena-frontend.com
BACKEND_URL=https://twoja-domena-backend.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Google Cloud Console

W ustawieniach OAuth 2.0 Client ID dodaj produkcyjne adresy:

- **Authorized redirect URIs** → `https://twoja-domena-backend.com/auth/google/callback`
  (localhost możesz zostawić dla dev, Google akceptuje wiele URI jednocześnie)

### CORS (backend `main.py`)

Dodaj produkcyjną domenę frontendu do listy `origins`:

```python
origins = [
    "http://localhost:3000",
    "https://twoja-domena-frontend.com",  # ← zaktualizuj
]
```

### Alembic

Po każdym deploymencie z nowymi migracjami:

```bash
alembic upgrade head
```

## Roadmap

- [x] Widok szczegółu wydarzenia (`/dashboard/events/[id]`)
- [x] Formularz tworzenia i edycji wydarzenia (z pickerem mapy)
- [x] Checklist z przypisywaniem zadań
- [x] Panel finansowy – wydatki, podział, salda (algorytm minimalizacji transakcji)
- [x] Integracja z Leaflet / OSM (picker lokalizacji + embed mapy)
- [x] WebSocket – real-time czat + powiadomienia
- [x] System znajomych (zaproszenia, akceptacja)
- [x] RSVP – akceptowanie/odrzucanie zaproszeń do wydarzeń
- [x] Panel powiadomień z persistencją (localStorage)
- [x] OAuth Google
- [ ] Strona profilu i ustawień
- [ ] PWA + tryb offline
