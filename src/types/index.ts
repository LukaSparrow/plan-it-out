// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirm: string
}

// ─── Events ──────────────────────────────────────────────────────────────────
export type EventStatus = 'upcoming' | 'ongoing' | 'past' | 'cancelled'
export type EventCategory = 'trip' | 'party' | 'meetup' | 'work' | 'sport' | 'other'

export interface Event {
  id: string
  title: string
  description?: string
  date: string          // ISO string
  end_date?: string
  location: string
  location_lat?: number
  location_lng?: number
  category: EventCategory
  status: EventStatus
  organizer_id: string
  organizer: User
  participants: Participant[]
  checklist_items: ChecklistItem[]
  expenses: Expense[]
  cover_color?: string   // tailwind color class used as fallback cover
  created_at: string
}

export interface Participant {
  id: string
  user: User
  role: 'organizer' | 'member'
  rsvp: 'accepted' | 'declined' | 'pending'
  joined_at: string
}

// ─── Checklist ────────────────────────────────────────────────────────────────
export interface ChecklistItem {
  id: string
  event_id: string
  label: string
  assigned_to?: User
  is_done: boolean
  created_by: User
  created_at: string
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export interface Expense {
  id: string
  event_id: string
  description: string
  amount: number
  currency: string
  paid_by: User
  split_among: User[]
  created_at: string
}

export interface Balance {
  from: User
  to: User
  amount: number
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface ApiError {
  detail: string
  status_code?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}
