import { useState } from 'react'
import { useNavigate } from 'react-router'
import { suggest } from '../domain/matching'
import { useRanking } from '../state/recipes'
import { useStore } from '../state/store'
import { BrandBar } from '../ui/BrandBar'
import { plural } from '../ui/labels'
import { RecipeRow, TopCard } from '../ui/RecipeCards'
import { useDragScroll } from '../ui/useDragScroll'
import { GenerateSheet } from './GenerateSheet'

export function ResultsScreen() {
  const navigate = useNavigate()
  const prefs = useStore((s) => s.prefs)
  const count = useStore((s) => Object.keys(s.fridge).length)
  const { doable, top, complete, almost } = suggest(useRanking())
  const chipsRef = useDragScroll<HTMLDivElement>()
  const topRef = useDragScroll<HTMLDivElement>()
  const [generating, setGenerating] = useState(false)

  const context: [string, string][] = [
    [plural(count, 'ingrédient'), '/'],
    [prefs.diet === 'Tout' ? 'Omnivore' : prefs.diet, '/profil'],
    ...(prefs.goal !== 'Équilibré' ? ([[prefs.goal, '/profil']] as [string, string][]) : []),
    [prefs.allergies.length ? 'Sans ' + prefs.allergies.map((a) => a.toLowerCase()).join(', ') : 'Aucune allergie', '/profil'],
    [prefs.cuisines.length ? prefs.cuisines.join(' · ') : 'Toutes cuisines', '/profil'],
  ]

  return (
    <>
    <div className="screen screen--flush">
      <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 26 }}>
        <BrandBar back="/" />
        <h1 className="title title--pretty">
          <span>{plural(doable.length, 'recette')}</span> <span className="muted">avec ce que t'as.</span>
        </h1>
        <div ref={chipsRef} className="hx" style={{ gap: 8, margin: '0 -20px', padding: '0 20px' }}>
          {context.map(([label, to]) => (
            <button key={label} type="button" className="ctx-chip" onClick={() => navigate(to)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {top.length > 0 && (
        <>
          <div className="pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Les plus adaptées
            </h2>
            <span className="pill-mono">Top 3</span>
          </div>
          <div ref={topRef} className="hx carousel">
            {top.map((e, i) => (
              <TopCard key={e.recipe.id} e={e} rank={i + 1} />
            ))}
          </div>
        </>
      )}

      {complete.length > 0 && (
        <>
          <div className="section-head">
            <h2 className="section-title" style={{ margin: 0 }}>
              Tu as tout
            </h2>
            <span className="section-head__count" style={{ color: 'var(--ok)' }}>
              {plural(complete.length, 'recette')}
            </span>
          </div>
          <div className="rows pad">
            {complete.map((e) => (
              <RecipeRow key={e.recipe.id} e={e} line="save" />
            ))}
          </div>
        </>
      )}

      {almost.length > 0 && (
        <>
          <div className="section-head">
            <h2 className="section-title" style={{ margin: 0 }}>
              Il te manque presque rien
            </h2>
            <span className="section-head__count muted">{plural(almost.length, 'recette')}</span>
          </div>
          <div className="rows pad">
            {almost.map((e) => (
              <RecipeRow key={e.recipe.id} e={e} line="missing" />
            ))}
          </div>
        </>
      )}

      {top.length === 0 && (
        <div style={{ padding: '30px 20px', font: '15px/1.5 var(--font)' }} className="muted">
          Pas grand-chose avec ça… Ajoute 2 ou 3 aliments dans ton frigo et on repart.
        </div>
      )}

      {prefs.ai && (
      <>
      <div className="section-head">
        <h2 className="section-title" style={{ margin: 0 }}>
          Rien ne te tente ?
        </h2>
      </div>
      <div className="pad">
        <button type="button" className="invent-tile" onClick={() => setGenerating(true)}>
          <span className="invent-tile__plus" aria-hidden="true">
            +
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: '600 15px var(--font)' }}>Invente-moi une recette</span>
            <span className="muted" style={{ font: '13px var(--font)' }}>
              L'IA part de ton frigo et de tes goûts.
            </span>
          </span>
        </button>
      </div>
      </>
      )}
    </div>
    {generating && <GenerateSheet onClose={() => setGenerating(false)} />}
    </>
  )
}
