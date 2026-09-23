import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AISLES, INGREDIENTS } from '../data/catalog'
import { daysLeft, isSoon } from '../domain/expiry'
import { suggest } from '../domain/matching'
import { normalize } from '../domain/search'
import { qtyLabel, toBase } from '../domain/units'
import { today, useRanking } from '../state/recipes'
import { setState, useStore } from '../state/store'
import { BrandBar } from '../ui/BrandBar'
import { plural } from '../ui/labels'
import { QuantitySheet } from './QuantitySheet'

export function FridgeScreen() {
  const navigate = useNavigate()
  const fridge = useStore((s) => s.fridge)
  const query = useStore((s) => s.fridgeQuery)
  const [editing, setEditing] = useState<string | null>(null)
  const { doable } = suggest(useRanking())
  const day = today()

  const count = Object.keys(fridge).length
  const expiring = Object.values(fridge).filter((f) => isSoon(daysLeft(f.expiresOn, day))).length
  const q = normalize(query.trim())

  const aisles = useMemo(
    () =>
      AISLES.map(([id, name]) => {
        const inAisle = INGREDIENTS.filter((i) => i.aisle === id)
        return {
          id,
          name,
          count: `${inAisle.filter((i) => fridge[i.id]).length}/${inAisle.length}`,
          items: inAisle.filter((i) => !q || normalize(i.name).includes(q)),
        }
      }).filter((a) => a.items.length),
    [fridge, q],
  )

  return (
    <>
      <div className="screen" style={{ paddingBottom: 'calc(190px + var(--safe-bottom))' }}>
        <div style={{ marginBottom: 18 }}>
          <BrandBar />
        </div>
        <h1 className="title title--pretty" style={{ marginBottom: 8 }}>
          <span>{plural(count, 'aliment')}</span> <span className="muted">dans ton frigo.</span>
        </h1>
        <div className="muted" style={{ font: '500 13px var(--mono)', marginBottom: 16 }}>
          {count}/{INGREDIENTS.length} · {expiring ? `${expiring} à finir vite` : 'rien ne presse'}
        </div>
        <input
          className="input"
          style={{ marginBottom: 18 }}
          value={query}
          onChange={(e) => setState({ fridgeQuery: e.target.value })}
          placeholder="Ajoute un aliment… (ex. courgette)"
          aria-label="Chercher un aliment"
        />
        {aisles.map((a) => (
          <section key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 className="caps" style={{ margin: 0 }}>
                {a.name}
              </h2>
              <span className="muted" style={{ font: '600 12px var(--font)' }}>
                {a.count}
              </span>
            </div>
            <div className="wrap">
              {a.items.map((i) => {
                const f = fridge[i.id]
                return (
                  <button key={i.id} type="button" className="chip chip--food" aria-pressed={!!f} onClick={() => setEditing(i.id)}>
                    {f && isSoon(daysLeft(f.expiresOn, day)) && <span className="warn-dot" aria-label="à finir vite" />}
                    <span>{i.name}</span>
                    {f && <span className="chip--food__qty">{qtyLabel(toBase(f.qty, f.unit), i.unit)}</span>}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
        {aisles.length === 0 && (
          <div className="muted" style={{ font: '14px var(--font)', padding: '10px 0' }}>
            Aucun aliment ne correspond. Essaie « tomate » ou « riz ».
          </div>
        )}
      </div>
      <div className="cta-dock" style={{ bottom: 'calc(96px + var(--safe-bottom))' }}>
        <button type="button" className="cta" style={{ justifyContent: 'space-between' }} onClick={() => navigate('/recettes')}>
          <span>Trouver des recettes</span>
          <span style={{ font: '600 14px var(--font)', opacity: 0.85 }}>{doable.length} idées</span>
        </button>
      </div>
      {editing && <QuantitySheet ingredientId={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
