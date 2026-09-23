import { useState } from 'react'
import { addDays, daysLeft, EXPIRY_CHOICES } from '../domain/expiry'
import type { FridgeItem } from '../domain/types'
import { convert, round2, sheetQtyLabel, STEP, UNITS } from '../domain/units'
import { BY_ID, today } from '../state/recipes'
import { setState, useStore } from '../state/store'
import { Sheet } from '../ui/Sheet'

/** Quantity, unit and expiry of one fridge ingredient. */
export function QuantitySheet({ ingredientId, onClose }: { ingredientId: string; onClose: () => void }) {
  const ing = BY_ID.get(ingredientId)!
  const existing = useStore((s) => s.fridge[ingredientId])
  const day = today()
  const [draft, setDraft] = useState<FridgeItem>(
    () =>
      existing ?? {
        qty: ing.defaultQty,
        unit: ing.unit,
        // Pantry food keeps; fresh food gets a week by default.
        expiresOn: ing.aisle === 'epicerie' ? null : addDays(day, 7),
      },
  )
  const isNew = !existing
  const step = STEP[draft.unit]
  const units = UNITS[ing.unit]
  const days = daysLeft(draft.expiresOn, day)

  const save = () => {
    setState((s) => {
      const fridge = { ...s.fridge }
      if (draft.qty > 0) fridge[ingredientId] = draft
      else delete fridge[ingredientId]
      return { fridge, fridgeQuery: '' }
    })
    onClose()
  }
  const remove = () => {
    setState((s) => {
      const fridge = { ...s.fridge }
      delete fridge[ingredientId]
      return { fridge }
    })
    onClose()
  }

  return (
    <Sheet onClose={onClose} label={ing.name}>
      <div className="sheet__head">
        <span className="sheet__title">{ing.name}</span>
        <span className="sheet__sub">{isNew ? 'Combien tu en as ?' : 'Dans ton frigo'}</span>
      </div>
      <div className="panel-row" style={{ padding: 10 }}>
        <button
          type="button"
          aria-label="Moins"
          onClick={() => setDraft((d) => ({ ...d, qty: Math.max(0, round2(d.qty - step)) }))}
          style={{ width: 56, height: 56, borderRadius: 'var(--r3)', background: 'var(--bg)', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '500 26px var(--font)', userSelect: 'none' }}
        >
          −
        </button>
        <span style={{ font: '700 34px var(--font)', letterSpacing: '-.02em' }} aria-live="polite">
          {sheetQtyLabel(draft.qty, draft.unit)}
        </span>
        <button
          type="button"
          aria-label="Plus"
          onClick={() => setDraft((d) => ({ ...d, qty: round2(d.qty + step) }))}
          style={{ width: 56, height: 56, borderRadius: 'var(--r3)', background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '500 26px var(--font)', userSelect: 'none' }}
        >
          +
        </button>
      </div>
      {units.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 'var(--r2)', background: 'var(--surface)', border: '1px solid var(--line)' }}>
          {units.map((u) => {
            const on = u === draft.unit
            return (
              <button
                key={u}
                type="button"
                aria-pressed={on}
                onClick={() => !on && setDraft((d) => ({ ...d, unit: u, qty: convert(d.qty, d.unit, u) }))}
                style={{ flex: 1, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r3)', background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--bg)' : 'var(--ink)', font: '600 14px var(--font)' }}
              >
                {u}
              </button>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="caps">À consommer avant</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EXPIRY_CHOICES.map(([label, d]) => (
            <button
              key={label}
              type="button"
              className="chip chip--exp"
              aria-pressed={days === d}
              onClick={() => setDraft((x) => ({ ...x, expiresOn: d == null ? null : addDays(day, d) }))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {!isNew && (
          <button type="button" className="btn-line" style={{ color: 'var(--miss)' }} onClick={remove}>
            Retirer
          </button>
        )}
        <button type="button" className="btn-ink" style={{ flex: 1 }} onClick={save}>
          {isNew ? 'Ajouter au frigo' : 'Valider'}
        </button>
      </div>
    </Sheet>
  )
}
