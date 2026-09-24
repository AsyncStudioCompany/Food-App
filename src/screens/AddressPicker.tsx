import { useEffect, useState } from 'react'
import type { SavedPlace } from '../domain/types'
import { placeFromDevice, PositionError, savePlace, searchAddresses, type AddressSuggestion } from '../state/geo'

/** Address field with autocomplete, and "Utiliser ma position". Saves the place in the prefs. */
export function AddressPicker({ onPicked }: { onPicked?: () => void }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searching = query.trim().length >= 3
  const shown = searching ? suggestions : []

  useEffect(() => {
    if (!searching) return
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      searchAddresses(query, ctrl.signal)
        .then((s) => {
          setSuggestions(s)
          setError(null)
        })
        .catch(() => !ctrl.signal.aborted && setError("La recherche d'adresse ne répond pas. Vérifie ta connexion."))
    }, 250)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query, searching])

  const pick = (p: SavedPlace) => {
    savePlace(p)
    setQuery('')
    setSuggestions([])
    setError(null)
    onPicked?.()
  }

  const locate = async () => {
    setLocating(true)
    setError(null)
    try {
      pick(await placeFromDevice())
    } catch (e) {
      setError(e instanceof PositionError ? e.message : 'Impossible de trouver ta position.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Numéro, rue, ville…"
        aria-label="Ton adresse"
        autoComplete="street-address"
      />
      {shown.length > 0 && (
        <div role="listbox" aria-label="Adresses proposées" style={{ display: 'flex', flexDirection: 'column' }}>
          {shown.map((s) => (
            <button
              key={`${s.label}|${s.lat}|${s.lon}`}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => pick(s)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, minHeight: 52, padding: '8px 0', borderBottom: '1px solid var(--line)', width: '100%', textAlign: 'left' }}
            >
              <span style={{ font: '600 15px var(--font)' }}>{s.label}</span>
              {s.context && (
                <span className="muted" style={{ font: '12.5px var(--font)' }}>
                  {s.context}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="btn-line" style={{ height: 44, alignSelf: 'flex-start' }} disabled={locating} onClick={() => void locate()}>
        {locating ? 'On te cherche…' : 'Utiliser ma position'}
      </button>
      {error && (
        <div role="status" style={{ font: '600 13px/1.4 var(--font)', color: 'var(--miss)' }}>
          {error}
        </div>
      )}
    </div>
  )
}

/** "Ton adresse", in the profile. */
export function AddressSection({ location }: { location: SavedPlace | null }) {
  const [editing, setEditing] = useState(false)
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="caps" style={{ margin: 0 }}>
        Ton adresse
      </h2>
      {location && !editing ? (
        <div className="panel-row" style={{ padding: '14px 16px', gap: 12, flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: '600 15px var(--font)', overflowWrap: 'anywhere' }}>{location.label}</span>
            <span className="muted" style={{ font: '13px var(--font)' }}>
              Pour trouver les magasins autour de toi. Chiffrée comme le reste.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn-line" style={{ height: 44 }} onClick={() => setEditing(true)}>
              Changer
            </button>
            <button type="button" style={{ height: 44, font: '600 14px var(--font)', color: 'var(--miss)' }} onClick={() => savePlace(null)}>
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="muted" style={{ font: '13px/1.45 var(--font)' }}>
            Facultatif : pour trouver près de chez toi ce qui te manque. Chiffrée comme le reste de tes données.
          </span>
          <AddressPicker onPicked={() => setEditing(false)} />
        </>
      )}
    </section>
  )
}
