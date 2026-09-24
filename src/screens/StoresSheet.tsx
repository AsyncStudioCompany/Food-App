import { useEffect, useState } from 'react'
import { basket, directionsUrl, distanceLabel, priceLabel, sortStores, type PricedStore, type StoreSort } from '../domain/stores'
import { BY_ID } from '../state/recipes'
import { useStore } from '../state/store'
import { fetchStores, StoresError, type StoresResult } from '../state/stores'
import { Sheet } from '../ui/Sheet'
import { AddressPicker } from './AddressPicker'

export interface MissingItem {
  id: string
  name: string
  /** Quantity to buy, in the ingredient's base unit. */
  qty: number
}

type Load = { status: 'loading' } | { status: 'done'; result: StoresResult } | { status: 'error'; message: string }

const KIND_LABEL: Record<PricedStore['kind'], string> = { supermarket: 'Supermarché', convenience: 'Épicerie', grocery: 'Épicerie', greengrocer: 'Primeur' }

const time = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** "Où les trouver ?": shops around the user's place, with the price of what's missing. */
export function StoresSheet({ items, onClose }: { items: MissingItem[]; onClose: () => void }) {
  const place = useStore((s) => s.prefs.location)
  const [selected, setSelected] = useState(() => items.map((i) => i.id))
  const [sort, setSort] = useState<StoreSort>('near')
  const [attempt, setAttempt] = useState(0)
  const ids = items.map((i) => i.id).join(',')
  // The answer for the current place, ingredients and attempt; anything else means it's loading.
  const request = place ? `${place.lat},${place.lon}|${ids}|${attempt}` : ''
  const [answer, setAnswer] = useState<{ request: string; load: Load } | null>(null)
  const load: Load = answer?.request === request ? answer.load : { status: 'loading' }

  useEffect(() => {
    if (!place) return
    let live = true
    const settle = (l: Load) => live && setAnswer({ request, load: l })
    fetchStores(place, ids.split(','))
      .then((result) => settle({ status: 'done', result }))
      .catch((e) => settle({ status: 'error', message: e instanceof StoresError ? e.message : 'Les magasins ne répondent pas pour le moment.' }))
    return () => {
      live = false
    }
  }, [place, ids, request])

  // At least one ingredient stays selected.
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : [...s, id]))
  const chosen = items.filter((i) => selected.includes(i.id))
  const rows =
    load.status === 'done'
      ? sortStores(
          load.result.stores.map((store) => ({ store, basket: basket(store, chosen, BY_ID) })),
          sort,
        )
      : []

  return (
    <Sheet onClose={onClose} gap={16} label="Où les trouver ?">
      <div className="sheet__head">
        <span className="sheet__title sheet__title--26">Où les trouver ?</span>
        <span className="sheet__sub">{place ? `Autour de ${place.label}` : 'Dis-nous où tu es'}</span>
      </div>

      {!place ? (
        <>
          <span className="muted" style={{ font: '14px/1.45 var(--font)' }}>
            Renseigne ton adresse pour voir les supermarchés et épiceries à moins de 3 km. Tu pourras la changer dans ton Profil.
          </span>
          <AddressPicker />
        </>
      ) : (
        <>
          <div className="wrap" role="group" aria-label="Ingrédients à acheter">
            {items.map((i) => (
              <button key={i.id} type="button" className="chip chip--filter" aria-pressed={selected.includes(i.id)} onClick={() => toggle(i.id)}>
                {i.name}
              </button>
            ))}
          </div>
          <div className="wrap" role="group" aria-label="Trier">
            <button type="button" className="chip chip--filter" aria-pressed={sort === 'near'} onClick={() => setSort('near')}>
              Le plus proche
            </button>
            <button type="button" className="chip chip--filter" aria-pressed={sort === 'cheap'} onClick={() => setSort('cheap')}>
              Le moins cher
            </button>
          </div>
          {sort === 'cheap' && (
            <span className="muted" style={{ font: '13px/1.45 var(--font)' }}>
              On ne compare que les prix connus. Les relevés Open Prices sont partiels : un magasin sans prix n'est pas forcément plus cher.
            </span>
          )}

          {load.status === 'loading' && (
            <span className="muted" role="status" style={{ font: '14px var(--font)', padding: '8px 0' }}>
              On cherche les magasins autour de toi…
            </span>
          )}
          {load.status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              <span role="status" style={{ font: '600 13px/1.4 var(--font)', color: 'var(--miss)' }}>
                {load.message}
              </span>
              <button type="button" className="btn-line" style={{ height: 44 }} onClick={() => setAttempt((a) => a + 1)}>
                Réessayer
              </button>
            </div>
          )}
          {load.status === 'done' && (
            <>
              {load.result.offline && (
                <span role="status" style={{ font: '600 13px/1.4 var(--font)', color: 'var(--warn-ink)' }}>
                  Hors connexion : résultats du {time(load.result.updatedAt)}.
                </span>
              )}
              {rows.length === 0 ? (
                <span className="muted" style={{ font: '14px var(--font)' }}>
                  Aucun supermarché ni épicerie à moins de 3 km.
                </span>
              ) : (
                <div className="rows">
                  {rows.map(({ store, basket: b }) => {
                    const brandOnly = b.known > 0 && chosen.every((i) => store.prices[i.id]?.from !== 'store')
                    return (
                      <a
                        key={store.id}
                        className="row"
                        href={directionsUrl(store)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Itinéraire vers ${store.name}`}
                        style={{ padding: '12px 14px', color: 'inherit', textDecoration: 'none' }}
                      >
                        <div className="row__body">
                          <span className="row__name">{store.name}</span>
                          <span className="row__meta">
                            {distanceLabel(store.distance)} · {store.brand && store.brand !== store.name ? store.brand : KIND_LABEL[store.kind]}
                          </span>
                          <span className="row__status" style={{ color: b.known === 0 ? 'var(--muted)' : b.known === b.count ? 'var(--ok-ink)' : 'var(--warn-ink)' }}>
                            {b.known === 0 ? 'Aucun prix relevé' : `${b.known} prix connu${b.known > 1 ? 's' : ''} sur ${b.count}`}
                            {brandOnly && " · prix de l'enseigne"}
                          </span>
                        </div>
                        {b.total != null ? (
                          <span style={{ font: '700 15px var(--font)', whiteSpace: 'nowrap' }}>{priceLabel(b.total)}</span>
                        ) : (
                          <span className="muted" style={{ font: '600 13px var(--font)', whiteSpace: 'nowrap' }}>
                            prix inconnu
                          </span>
                        )}
                      </a>
                    )
                  })}
                </div>
              )}
              {!load.result.pricesComplete && !load.result.offline && (
                <span className="muted" style={{ font: '12.5px/1.4 var(--font)' }}>
                  Certains prix n'ont pas pu être chargés.
                </span>
              )}
              <span className="muted" style={{ font: '12px/1.45 var(--font)' }}>
                Un appui ouvre l'itinéraire dans Plans. Magasins :{' '}
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                  © OpenStreetMap
                </a>
                . Prix :{' '}
                <a href="https://prices.openfoodfacts.org" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                  Open Prices
                </a>
                , pour la quantité qu'il te faut.
              </span>
            </>
          )}
        </>
      )}

      <button type="button" className="btn-ink" onClick={onClose}>
        Fermer
      </button>
    </Sheet>
  )
}
