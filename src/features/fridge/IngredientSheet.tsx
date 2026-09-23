import { Minus, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { putFridgeItem, removeFridgeItem } from '../../data/fridgeStore'
import type { FridgeItem, Ingredient, Unit } from '../../domain/types'
import { convert, formatQuantity, UNIT_LABELS } from '../../domain/units'
import { decrement, defaultFridgeEntry, fridgeUnits, increment } from './quantity'

type Props = {
  ingredient: Ingredient
  current?: FridgeItem
  onClose: () => void
}

export function IngredientSheet({ ingredient, current, onClose }: Props) {
  const units = fridgeUnits(ingredient)
  const initial = current
    ? { quantity: current.quantity, unit: current.unit ?? units[0] }
    : defaultFridgeEntry(ingredient)
  const [quantity, setQuantity] = useState<number | undefined>(initial.quantity)
  const [unit, setUnit] = useState<Unit>(initial.unit)
  const [expiresOn, setExpiresOn] = useState(current?.expiresOn ?? '')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function changeUnit(next: Unit) {
    if (quantity !== undefined) {
      const converted = convert(quantity, unit, next, ingredient)
      setQuantity(converted !== undefined ? Math.max(0.25, Math.round(converted * 100) / 100) : defaultFridgeEntry(ingredient).quantity ?? 1)
    }
    setUnit(next)
  }

  function save() {
    putFridgeItem(ingredient.id, {
      quantity,
      unit: quantity === undefined ? undefined : unit,
      expiresOn: expiresOn || undefined,
    })
    onClose()
  }

  function remove() {
    removeFridgeItem(ingredient.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="relative w-full max-w-md rounded-t-3xl border-t border-stone-800 bg-stone-900 px-5 pt-5 pb-[calc(var(--safe-bottom)+1.25rem)]"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">{ingredient.emoji ?? '🥫'}</span>
          <h2 id="sheet-title" className="text-xl font-semibold">{ingredient.name}</h2>
          <button type="button" aria-label="Fermer" onClick={onClose} className="ml-auto rounded-full p-2 text-stone-400 active:bg-stone-800">
            <X className="size-5" />
          </button>
        </div>

        <p className="mb-2 text-sm text-stone-400">Quantité</p>
        {quantity === undefined ? (
          <button
            type="button"
            onClick={() => setQuantity(defaultFridgeEntry({ ...ingredient, defaultUnit: unit }).quantity ?? 1)}
            className="mb-4 w-full rounded-2xl border border-dashed border-stone-700 py-4 text-stone-300"
          >
            Quantité non précisée · Préciser
          </button>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-stone-950 p-2">
              <button
                type="button"
                aria-label="Diminuer"
                onClick={() => setQuantity(decrement(quantity, unit))}
                className="flex size-12 items-center justify-center rounded-xl bg-stone-800 active:bg-stone-700"
              >
                <Minus className="size-5" />
              </button>
              <output aria-live="polite" className="text-2xl font-semibold tabular-nums">
                {formatQuantity(quantity, unit)}
              </output>
              <button
                type="button"
                aria-label="Augmenter"
                onClick={() => setQuantity(increment(quantity, unit))}
                className="flex size-12 items-center justify-center rounded-xl bg-stone-800 active:bg-stone-700"
              >
                <Plus className="size-5" />
              </button>
            </div>
            <div className="mb-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Unité">
              {units.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={option === unit}
                  onClick={() => changeUnit(option)}
                  className={`rounded-full px-4 py-2 text-sm ${option === unit ? 'bg-stone-50 text-stone-950' : 'border border-stone-700 text-stone-300'}`}
                >
                  {UNIT_LABELS[option]}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setQuantity(undefined)} className="mb-4 text-sm text-stone-400 underline">
              Je ne sais pas combien
            </button>
          </>
        )}

        <label className="mb-6 block">
          <span className="mb-2 block text-sm text-stone-400">À consommer avant (facultatif)</span>
          <input
            type="date"
            value={expiresOn}
            onChange={(event) => setExpiresOn(event.target.value)}
            className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100"
          />
        </label>

        <div className="flex gap-3">
          {current && (
            <button type="button" onClick={remove} className="flex-1 rounded-full border border-red-400/40 py-3.5 font-medium text-red-300">
              Retirer
            </button>
          )}
          <button type="button" onClick={save} className="flex-[2] rounded-full bg-stone-50 py-3.5 font-semibold text-stone-950">
            {current ? 'Enregistrer' : 'Ajouter au frigo'}
          </button>
        </div>
      </div>
    </div>
  )
}
