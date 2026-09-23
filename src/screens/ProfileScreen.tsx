import { ALLERGENS, CUISINES, DIETS, type Prefs } from '../domain/types'
import { setState, useStore } from '../state/store'

export function ProfileScreen() {
  const p = useStore((s) => s.prefs)
  const set = (patch: Partial<Prefs>) => setState((s) => ({ prefs: { ...s.prefs, ...patch } }))
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 className="title">Tes goûts</h1>
        <div className="muted" style={{ font: '14px/1.45 var(--font)' }}>
          On cache les recettes qui ne te vont pas, promis.
        </div>
      </div>
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
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 className="caps" style={{ margin: 0 }}>
          Cuisines préférées
        </h2>
        <div className="wrap">
          {CUISINES.map((c) => (
            <button key={c} type="button" className="chip chip--pref" aria-pressed={p.cuisines.includes(c)} onClick={() => set({ cuisines: toggle(p.cuisines, c) })}>
              {c}
            </button>
          ))}
        </div>
      </section>
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
  )
}
