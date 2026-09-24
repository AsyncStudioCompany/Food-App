import { useState, type ReactNode } from 'react'
import { INGREDIENTS } from '../data/catalog'
import { normalize } from '../domain/search'
import { ALLERGENS, CUISINES, DIETS, GOALS, type Prefs } from '../domain/types'
import { BY_ID } from '../state/recipes'
import { setState, useStore } from '../state/store'
import { AccountSection } from './AccountSection'
import { AddressSection } from './AddressPicker'

const set = (patch: Partial<Prefs>) => setState((s) => ({ prefs: { ...s.prefs, ...patch } }))
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

/** A themed group: title, one line on what it does, then its settings. */
function Group({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          {title}
        </h2>
        <span className="muted" style={{ font: '13.5px/1.45 var(--font)' }}>
          {hint}
        </span>
      </div>
      {children}
    </section>
  )
}

/** A setting inside a group: caps label, with what is picked on the right (like the fridge aisles). */
function Setting({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h3 className="caps" style={{ margin: 0 }}>
          {label}
        </h3>
        {value && (
          <span className="muted" style={{ font: '600 12px var(--font)', textAlign: 'right' }}>
            {value}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

const count = (n: number, one: string, many: string, none: string) => (n === 0 ? none : n === 1 ? `1 ${one}` : `${n} ${many}`)

/** Common dislikes, offered before typing. */
const QUICK_AVOID = ['champignons', 'poivron', 'aubergine', 'olives', 'chevre', 'fruits_de_mer', 'oignon', 'celeri', 'betterave']

function AvoidPicker({ avoid }: { avoid: string[] }) {
  const [query, setQuery] = useState('')
  const q = normalize(query.trim())
  const candidates = q
    ? INGREDIENTS.filter((i) => i.aisle !== 'epices' && !avoid.includes(i.id) && normalize(i.name).includes(q)).slice(0, 8)
    : QUICK_AVOID.filter((id) => BY_ID.has(id) && !avoid.includes(id)).map((id) => BY_ID.get(id)!)
  return (
    <>
      {avoid.length > 0 && (
        <div className="wrap" aria-label="Ingrédients évités">
          {avoid.map((id) => (
            <button key={id} type="button" className="chip chip--pref" aria-pressed="true" aria-label={`Ne plus éviter : ${BY_ID.get(id)?.name ?? id}`} onClick={() => set({ avoid: avoid.filter((x) => x !== id) })}>
              {BY_ID.get(id)?.name ?? id}&nbsp;&nbsp;×
            </button>
          ))}
        </div>
      )}
      <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ajoute un ingrédient… (ex. coriandre)" aria-label="Chercher un ingrédient à éviter" />
      {candidates.length > 0 ? (
        <div className="wrap" aria-label={q ? 'Ingrédients trouvés' : 'Suggestions'}>
          {candidates.map((i) => (
            <button
              key={i.id}
              type="button"
              className="chip chip--pref"
              aria-pressed="false"
              onClick={() => {
                set({ avoid: [...avoid, i.id] })
                setQuery('')
              }}
            >
              + {i.name}
            </button>
          ))}
        </div>
      ) : (
        q && (
          <span className="muted" style={{ font: '13px var(--font)' }}>
            Aucun ingrédient ne correspond.
          </span>
        )
      )}
    </>
  )
}

export function ProfileScreen() {
  const p = useStore((s) => s.prefs)

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 className="title">Tes goûts</h1>
        <div className="muted" style={{ font: '14px/1.45 var(--font)' }}>
          On cache les recettes qui ne te vont pas, promis.
        </div>
      </div>

      <Group title="Ce que tu ne manges pas" hint="Filtres stricts : les recettes qui ne les respectent pas sont cachées.">
        <Setting label="Régime" value={p.diet === 'Tout' ? 'Omnivore' : p.diet}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DIETS.map((d) => (
              <button key={d} type="button" className="chip" aria-pressed={p.diet === d} onClick={() => set({ diet: d })} style={{ height: 48, justifyContent: 'center', borderRadius: 'var(--r2)', font: '600 14px var(--font)' }}>
                {d}
              </button>
            ))}
          </div>
        </Setting>
        <Setting label="Allergies & intolérances" value={count(p.allergies.length, 'choisie', 'choisies', 'Aucune')}>
          <div className="wrap">
            {ALLERGENS.map((a) => (
              <button key={a} type="button" className="chip chip--pref" aria-pressed={p.allergies.includes(a)} onClick={() => set({ allergies: toggle(p.allergies, a) })}>
                {a}
              </button>
            ))}
          </div>
        </Setting>
        <Setting label="Ingrédients à éviter" value={count(p.avoid.length, 'évité', 'évités', 'Aucun')}>
          <AvoidPicker avoid={p.avoid} />
        </Setting>
      </Group>

      <Group title="Ce qui te fait envie" hint="Pour le tri : ces recettes passent devant, sans cacher les autres.">
        <Setting label="Objectif" value={p.goal}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GOALS.map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={p.goal === g} onClick={() => set({ goal: g })} style={{ height: 48, justifyContent: 'center', borderRadius: 'var(--r2)', font: '600 14px var(--font)' }}>
                {g}
              </button>
            ))}
          </div>
        </Setting>
        <Setting label="Cuisines préférées" value={count(p.cuisines.length, 'choisie', 'choisies', 'Toutes')}>
          <div className="wrap">
            {CUISINES.map((c) => (
              <button key={c} type="button" className="chip chip--pref" aria-pressed={p.cuisines.includes(c)} onClick={() => set({ cuisines: toggle(p.cuisines, c) })}>
                {c}
              </button>
            ))}
          </div>
        </Setting>
      </Group>

      <Group title="En cuisine" hint="Tes réglages par défaut pour les recettes.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="panel-row" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: '600 15px var(--font)' }}>Portions par défaut</span>
              <span className="muted" style={{ font: '13px var(--font)' }}>
                Tu cuisines pour combien ?
              </span>
            </div>
            <div className="stepper">
              <button type="button" className="stepper__btn" aria-label="Moins de portions" onClick={() => set({ portions: Math.max(1, p.portions - 1) })}>
                −
              </button>
              <span className="stepper__val">{p.portions}</span>
              <button type="button" className="stepper__btn" aria-label="Plus de portions" onClick={() => set({ portions: Math.min(12, p.portions + 1) })}>
                +
              </button>
            </div>
          </div>
          <div className="panel-row" style={{ padding: '14px 16px', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: '600 15px var(--font)' }}>Recettes inventées par l'IA</span>
              <span className="muted" style={{ font: '13px var(--font)' }}>
                {p.ai ? 'Activées : « Invente-moi une recette » dans Recettes.' : 'Désactivées : que des vraies recettes.'}
              </span>
            </div>
            <button type="button" role="switch" aria-checked={p.ai} aria-label="Recettes inventées par l'IA" className="switch" onClick={() => set({ ai: !p.ai })}>
              <span className="switch__knob" />
            </button>
          </div>
        </div>
      </Group>

      <Group title="Ton adresse" hint="Facultatif : pour trouver près de chez toi ce qui te manque. Chiffrée comme le reste de tes données.">
        <AddressSection location={p.location} />
      </Group>

      <Group title="Ton compte" hint="Pour retrouver tes données, chiffrées, sur tous tes appareils.">
        <AccountSection />
      </Group>
    </div>
  )
}
