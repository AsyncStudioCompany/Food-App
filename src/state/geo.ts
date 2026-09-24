import type { GeoPoint } from '../domain/stores'
import type { SavedPlace } from '../domain/types'
import { setState } from './store'

/**
 * French address search (the "API Adresse" of the Base Adresse Nationale), called from the device: open, no key.
 * api-adresse.data.gouv.fr moved to the IGN Géoplateforme, which serves the same API and format.
 */
const ADDRESS_API = 'https://data.geopf.fr/geocodage'

type Feature = { geometry: { coordinates: [number, number] }; properties: { label: string; context?: string } }

export interface AddressSuggestion extends SavedPlace {
  context: string
}

const toSuggestion = (f: Feature): AddressSuggestion => ({
  label: f.properties.label,
  context: f.properties.context ?? '',
  lon: f.geometry.coordinates[0],
  lat: f.geometry.coordinates[1],
})

/** Addresses matching what the user types (autocomplete). */
export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const params = new URLSearchParams({ q, autocomplete: '1', limit: '5', index: 'address' })
  const res = await fetch(`${ADDRESS_API}/search?${params}`, { signal })
  if (!res.ok) throw new Error('address search failed')
  const json = (await res.json()) as { features?: Feature[] }
  return (json.features ?? []).map(toSuggestion)
}

/** Nearest address of a position, for a readable label. */
export async function reverseAddress(p: GeoPoint): Promise<string | null> {
  try {
    const res = await fetch(`${ADDRESS_API}/reverse?${new URLSearchParams({ lat: String(p.lat), lon: String(p.lon), limit: '1', index: 'address' })}`)
    const json = (await res.json()) as { features?: Feature[] }
    return json.features?.[0]?.properties.label ?? null
  } catch {
    return null
  }
}

export class PositionError extends Error {}

/** The device position ("Utiliser ma position"). Browsers only give it on HTTPS (or localhost). */
export function currentPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext || !('geolocation' in navigator)) {
      reject(new PositionError("Ton navigateur ne donne ta position que sur une connexion sécurisée (https). Saisis plutôt ton adresse."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) =>
        reject(
          new PositionError(
            err.code === err.PERMISSION_DENIED
              ? "Tu n'as pas autorisé l'accès à ta position. Saisis plutôt ton adresse."
              : "Impossible de trouver ta position. Réessaie ou saisis ton adresse.",
          ),
        ),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 5 * 60_000 },
    )
  })
}

/** "Ma position": the device position with its nearest address as label. */
export async function placeFromDevice(): Promise<SavedPlace> {
  const p = await currentPosition()
  return { ...p, label: (await reverseAddress(p)) ?? 'Ma position' }
}

/** Saves (or forgets) the user's place in the prefs, encrypted and synced with the rest. */
export const savePlace = (p: SavedPlace | null) =>
  setState((s) => ({ prefs: { ...s.prefs, location: p && { lat: p.lat, lon: p.lon, label: p.label } } }))
