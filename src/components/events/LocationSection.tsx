'use client'

import { MapPin } from 'lucide-react'
import type { Event } from '@/types'

export function LocationSection({ event }: { event: Event }) {
  const hasCoords =
    typeof event.location_lat === 'number' &&
    typeof event.location_lng === 'number'

  const embedSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${event.location_lng! - 0.008},${event.location_lat! - 0.005},${event.location_lng! + 0.008},${event.location_lat! + 0.005}&layer=mapnik&marker=${event.location_lat},${event.location_lng}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`

  const mapsUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${event.location_lat}&mlon=${event.location_lng}#map=15/${event.location_lat}/${event.location_lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`

  return (
    <section className="card overflow-hidden">
      <iframe
        src={embedSrc}
        className="w-full h-44 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Mapa: ${event.location}`}
      />

      <div className="p-5">
        <h3 className="text-sm font-medium text-ink-muted mb-2 flex items-center gap-1.5">
          <MapPin size={14} />
          Miejsce
        </h3>
        <p className="text-ink font-medium mb-3">{event.location}</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline w-full text-sm flex items-center justify-center gap-1.5"
        >
          Otwórz w mapach
        </a>
      </div>
    </section>
  )
}
