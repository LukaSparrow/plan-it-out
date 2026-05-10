'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// SVG pin icon — avoids Leaflet's broken default icon in webpack builds
const pinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
    </filter>
    <path filter="url(#s)" d="M16 0C9.373 0 4 5.373 4 12c0 10.5 12 32 12 32S28 22.5 28 12C28 5.373 22.627 0 16 0z" fill="#f97316"/>
    <circle cx="16" cy="12" r="5" fill="white"/>
  </svg>`,
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -44],
})

interface ClickHandlerProps {
  onPick: (lat: number, lng: number) => void
}

function ClickHandler({ onPick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface FlyToProps {
  lat: number
  lng: number
}

function FlyTo({ lat, lng }: FlyToProps) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 0.8 })
  }, [lat, lng, map])
  return null
}

export interface PickedLocation {
  lat: number
  lng: number
}

interface LocationPickerMapProps {
  picked: PickedLocation | null
  flyTo: PickedLocation | null
  onPick: (lat: number, lng: number) => void
}

export function LocationPickerMap({ picked, flyTo, onPick }: LocationPickerMapProps) {
  // Poland center as default view
  const DEFAULT_CENTER: [number, number] = [52.069, 19.48]
  const DEFAULT_ZOOM = 6

  return (
    <MapContainer
      center={picked ? [picked.lat, picked.lng] : DEFAULT_CENTER}
      zoom={picked ? 14 : DEFAULT_ZOOM}
      className="h-full w-full"
      style={{ cursor: 'crosshair' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      {flyTo && <FlyTo lat={flyTo.lat} lng={flyTo.lng} />}
      {picked && <Marker position={[picked.lat, picked.lng]} icon={pinIcon} />}
    </MapContainer>
  )
}
