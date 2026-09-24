import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import type { GeoPoint } from '../domain/stores'
import type { SavedPlace } from '../domain/types'
import { reverseAddress } from '../state/geo'

/** Plan IGN tiles (Géoplateforme): open, no key. Darkened in CSS to fit the "Soir" theme. */
const TILES =
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png'
const FRANCE: GeoPoint = { lat: 46.6, lon: 2.4 }

/** Pin drawn in CSS (no icon library): see .map-pin in styles.css. */
const pin = L.divIcon({ className: '', html: '<span class="map-pin"></span>', iconSize: [28, 36], iconAnchor: [14, 34] })

/**
 * Map to place your address: tap the map or drag the pin, then confirm.
 * Loaded on demand (Leaflet is only downloaded when the map opens).
 */
export default function AddressMap({ start, onPick }: { start: GeoPoint | null; onPick: (p: SavedPlace) => void }) {
  const el = useRef<HTMLDivElement>(null)
  const [point, setPoint] = useState<GeoPoint | null>(start)
  const [label, setLabel] = useState<string | null>(null)
  const [looking, setLooking] = useState(false)

  useEffect(() => {
    if (!el.current) return
    const center = start ?? FRANCE
    // No wheel zoom: scrolling the profile over the map must scroll the page (zoom with + / − or a pinch).
    const map = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView([center.lat, center.lon], start ? 16 : 5)
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>')
    L.tileLayer(TILES, { maxZoom: 19, attribution: '© <a href="https://geoservices.ign.fr/" target="_blank" rel="noreferrer">IGN</a> – Plan IGN' }).addTo(map)
    const marker = L.marker([center.lat, center.lon], { icon: pin, draggable: true, keyboard: false, opacity: start ? 1 : 0 }).addTo(map)
    let asked = 0
    const place = (p: GeoPoint) => {
      marker.setLatLng([p.lat, p.lon]).setOpacity(1)
      setPoint(p)
      setLabel(null)
      setLooking(true)
      const n = ++asked
      void reverseAddress(p).then((l) => {
        if (n !== asked) return
        setLabel(l)
        setLooking(false)
      })
    }
    map.on('click', (e: L.LeafletMouseEvent) => place({ lat: e.latlng.lat, lon: e.latlng.lng }))
    marker.on('dragend', () => {
      const ll = marker.getLatLng()
      place({ lat: ll.lat, lon: ll.lng })
    })
    if (start) place(start)
    // The container gets its final size after the first layout (and after Leaflet's CSS loads):
    // measure again and reset the view on the pin, until you move the map yourself.
    let touched = false
    map.on('dragstart zoomstart', () => {
      if (ready) touched = true
    })
    let ready = false
    const fit = () => {
      map.invalidateSize({ pan: false })
      if (!touched) map.setView(marker.getLatLng(), map.getZoom(), { animate: false, reset: true } as L.ZoomPanOptions)
      ready = true
    }
    const frame = requestAnimationFrame(fit)
    const resize = new ResizeObserver(fit)
    resize.observe(el.current)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      map.remove()
    }
    // The map is created once; `start` only sets its first view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div ref={el} className="map" role="application" aria-label="Carte : touche l'endroit de ton adresse" style={{ height: 240 }} />
      <span className="muted" style={{ font: '13px/1.45 var(--font)' }} role="status">
        {!point ? 'Touche la carte à l’endroit de ton adresse, ou fais glisser le repère.' : looking ? 'On cherche l’adresse de ce point…' : (label ?? 'Point choisi sur la carte')}
      </span>
      {point && (
        <button type="button" className="btn-ink" disabled={looking} onClick={() => onPick({ ...point, label: label ?? 'Point choisi sur la carte' })}>
          Choisir cet endroit
        </button>
      )}
    </div>
  )
}
