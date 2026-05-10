'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Search, MapPin, X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PickedLocation } from './LocationPickerMap'

// Load the Leaflet map only on the client — Leaflet requires window
const LocationPickerMap = dynamic(
  () => import('./LocationPickerMap').then((m) => m.LocationPickerMap),
  { ssr: false, loading: () => <MapPlaceholder /> },
)

function MapPlaceholder() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-surface-2">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  )
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export interface ConfirmedLocation {
  text: string
  lat: number
  lng: number
}

interface LocationPickerModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (loc: ConfirmedLocation) => void
  initial?: ConfirmedLocation
}

export function LocationPickerModal({
  open,
  onClose,
  onConfirm,
  initial,
}: LocationPickerModalProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState<PickedLocation | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null,
  )
  const [flyTo, setFlyTo] = useState<PickedLocation | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null,
  )
  const [addressText, setAddressText] = useState(initial?.text ?? '')
  const [reversing, setReversing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when modal opens with a new initial value
  useEffect(() => {
    if (open) {
      setPicked(initial ? { lat: initial.lat, lng: initial.lng } : null)
      setFlyTo(initial ? { lat: initial.lat, lng: initial.lng } : null)
      setAddressText(initial?.text ?? '')
      setQuery('')
      setSuggestions([])
    }
  }, [open, initial])

  const searchNominatim = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    setSearching(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`
      const res = await fetch(url, { headers: { 'Accept-Language': 'pl' } })
      const data: NominatimResult[] = await res.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchNominatim(value), 400)
  }

  const handleSuggestionPick = (result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setPicked({ lat, lng })
    setFlyTo({ lat, lng })
    setAddressText(result.display_name)
    setQuery(result.display_name)
    setSuggestions([])
  }

  const handleMapClick = async (lat: number, lng: number) => {
    setPicked({ lat, lng })
    setFlyTo(null) // don't re-fly, user just clicked on the map
    setReversing(true)
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      const res = await fetch(url, { headers: { 'Accept-Language': 'pl' } })
      const data = await res.json()
      const text = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setAddressText(text)
      setQuery(text)
    } catch {
      setAddressText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setReversing(false)
    }
    setSuggestions([])
  }

  const handleConfirm = () => {
    if (!picked) return
    onConfirm({ text: addressText, lat: picked.lat, lng: picked.lng })
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl h-[580px] bg-surface-1 border border-surface-2 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2 flex-shrink-0">
          <h3 className="font-display text-lg text-ink flex items-center gap-2">
            <MapPin size={18} className="text-brand-500" />
            Wybierz lokalizację
          </h3>
          <button
            onClick={onClose}
            className="text-ink-subtle hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="relative px-4 py-3 border-b border-surface-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-surface-0 border border-surface-2 rounded-xl px-3 py-2 focus-within:border-brand-400 transition-colors">
            {searching ? (
              <Loader2 size={15} className="text-ink-subtle animate-spin flex-shrink-0" />
            ) : (
              <Search size={15} className="text-ink-subtle flex-shrink-0" />
            )}
            <input
              type="text"
              placeholder="Wyszukaj adres lub miejsce…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-subtle outline-none"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSuggestions([]) }}
                className="text-ink-subtle hover:text-ink flex-shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul className="absolute left-4 right-4 top-full mt-1 bg-surface-1 border border-surface-2 rounded-xl shadow-lg z-10 overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.place_id}>
                  <button
                    onClick={() => handleSuggestionPick(s)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors text-sm"
                  >
                    <MapPin size={13} className="text-brand-500 flex-shrink-0 mt-0.5" />
                    <span className="text-ink line-clamp-2">{s.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-0">
          <LocationPickerMap
            picked={picked}
            flyTo={flyTo}
            onPick={handleMapClick}
          />
          {!picked && (
            <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
              <div className="bg-surface-1/90 backdrop-blur-sm border border-surface-2 rounded-xl px-4 py-2 text-sm text-ink-muted">
                Kliknij na mapę lub wyszukaj adres powyżej
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-surface-2 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {reversing ? (
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 size={13} className="animate-spin" />
                Pobieranie adresu…
              </div>
            ) : picked ? (
              <>
                <p className="text-sm text-ink truncate">{addressText}</p>
                <p className="text-xs text-ink-subtle">
                  {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-subtle">Nie wybrano lokalizacji</p>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost text-sm flex-shrink-0">
            Anuluj
          </button>
          <button
            onClick={handleConfirm}
            disabled={!picked || reversing}
            className="btn-primary text-sm flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={15} />
            Potwierdź
          </button>
        </div>
      </div>
    </div>
  )
}
