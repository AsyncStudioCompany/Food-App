import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AISLES, INGREDIENTS } from '../data/catalog'
import { addDays } from '../domain/expiry'
import { normalize } from '../domain/search'
import { ALLERGENS, CUISINES, DIETS, GOALS, type Goal, type Prefs } from '../domain/types'
import { today } from '../state/recipes'
import { setState, useStore } from '../state/store'

const GOAL_TEXT: Record<Goal, string> = {
  Équilibré: 'Un peu de tout, sans prise de tête.',
  'Prise de masse': 'Des plats copieux, riches en protéines.',
  Protéines: 'Plus de protéines à chaque repas.',
  'Perte de poids': 'Des plats légers mais rassasiants.',
}

const STEPS = [
  ['Tu manges', 'quoi ?'],
  ['Ton', 'objectif.'],
  ['Tes cuisines', 'préférées.'],
  ["Qu'est-ce que", "t'as chez toi ?"],
] as const

/** First setup after sign-up: diet and allergies, goal, cuisines and portions, fridge. */
export function Onboarding() {
  const navigate = useNavigate()
  const p = useStore((s) => s.prefs)
  const fridge = useStore((s) => s.fridge)
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState('')
  const set = (patch: Partial<Prefs>) => setState((s) => ({ prefs: { ...s.prefs, ...patch } }))
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const last = step === STEPS.length - 1

  const finish = () => {
    navigate('/recettes')
    set({ onboarded: true })
  }
  const next = () => (last ? finish() : setStep(step + 1))

  const toggleFood = (id: string) =>
    setState((s) => {
      const f = { ...s.fridge }
      const ing = INGREDIENTS.find((i) => i.id === id)!
      if (f[id]) delete f[id]
      else f[id] = { qty: ing.defaultQty, unit: ing.unit, expiresOn: ing.aisle === 'epicerie' ? null : addDays(today(), 7) }
      return { fridge: f }
    })

  const q = normalize(query.trim())
  const aisles = useMemo(
    () => AISLES.map(([id, name]) => ({ id, name, items: INGREDIENTS.filter((i) => i.aisle === id && (!q || normalize(i.name).includes(q))) })).filter((a) => a.items.length),
    [q],
  )
  const count = Object.keys(fridge).length

  return (
    <>
      <div className="screen" style={{ paddingBottom: 'calc(120px + var(--safe-bottom))', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {step > 0 ? (
            <button type="button" className="round-btn" aria-label="Étape précédente" onClick={() => setStep(step - 1)}>
              ←
            </button>
          ) : (
            <span style={{ width: 40 }} />
          )}
          <span className="pill-mono">
            {step + 1}/{STEPS.length}
          </span>
          <button type="button" className="muted" style={{ height: 40, font: '600 14px var(--font)' }} onClick={next}>
            Passer
          </button>
        </div>

        <h1 className="title title--pretty">
          <span>{STEPS[step][0]}</span> <span className="muted">{STEPS[step][1]}</span>
        </h1>

        {step === 0 && (
          <>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 className="caps" style={{ margin: 0 }}>
                Régime
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {DIETS.map((d) => (
                  <button key={d} type="button" className="chip" aria-pressed={p.diet === d} onClick={() => set({ diet: d })} style={{ height: 48, justifyContent: 'center', borderRadius: 'var(--r2)', font: '600 14px var(--font)' }}>
                    {d}
                  </button>
                ))}
              </div>
            </section>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 className="caps" style={{ margin: 0 }}>
                Allergies &amp; intolérances
              </h2>
              <div className="wrap">
                {ALLERGENS.map((a) => (
                  <button key={a} type="button" className="chip chip--pref" aria-pressed={p.allergies.includes(a)} onClick={() => set({ allergies: toggle(p.allergies, a) })}>
                    {a}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GOALS.map((g) => {
              const on = p.goal === g
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ goal: g })}
                  style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '14px 16px', borderRadius: 'var(--r2)', border: `1.5px solid ${on ? 'var(--ink)' : 'var(--line)'}`, background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--bg)' : 'var(--ink)', width: '100%' }}
                >
                  <span style={{ font: '600 16px var(--font)' }}>{g}</span>
                  <span style={{ font: '13.5px/1.4 var(--font)', opacity: 0.75 }}>{GOAL_TEXT[g]}</span>
                </button>
              )
            })}
          </div>
        )}

        {step === 2 && (
          <>
            <div className="wrap">
              {CUISINES.map((c) => (
                <button key={c} type="button" className="chip chip--pref" aria-pressed={p.cuisines.includes(c)} onClick={() => set({ cuisines: toggle(p.cuisines, c) })}>
                  {c}
                </button>
              ))}
            </div>
            <div className="panel-row" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: '600 15px var(--font)' }}>Portions</span>
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
          </>
        )}

        {step === 3 && (
          <>
            <p className="muted" style={{ font: '14px/1.45 var(--font)', margin: '-10px 0 0' }}>
              Touche ce que t'as. Tu ajusteras les quantités et les dates dans ton frigo.
            </p>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cherche un aliment… (ex. courgette)" aria-label="Chercher un aliment" />
            {aisles.map((a) => (
              <section key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h2 className="caps" style={{ margin: 0 }}>
                  {a.name}
                </h2>
                <div className="wrap">
                  {a.items.map((i) => (
                    <button key={i.id} type="button" className="chip chip--food" aria-pressed={!!fridge[i.id]} onClick={() => toggleFood(i.id)}>
                      {i.name}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
      <div className="cta-dock" style={{ bottom: 'calc(24px + var(--safe-bottom))' }}>
        <button type="button" className="cta" style={{ justifyContent: last ? 'space-between' : 'center' }} onClick={next}>
          <span>{last ? "C'est parti" : 'Continuer'}</span>
          {last && <span style={{ font: '600 14px var(--font)', opacity: 0.85 }}>{count ? `${count} aliment${count > 1 ? 's' : ''}` : ''}</span>}
        </button>
      </div>
    </>
  )
}
