import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { dietSuffix, recipeTraits } from '../domain/diet'
import { expiryText, isSoon } from '../domain/expiry'
import { cook, evaluate } from '../domain/matching'
import { pantrySpices } from '../domain/pantry'
import { stepKind } from '../domain/steps'
import { qtyLabel } from '../domain/units'
import { deleteGenerated } from '../state/ai'
import { photoBg, usePhotos } from '../state/photos'
import { BY_ID, useAllRecipes, useMatchContext } from '../state/recipes'
import { setState, useStore } from '../state/store'
import { LikeButton } from '../ui/Heart'
import { MoodIllustration, StepIllustration, type MoodKind } from '../ui/Illustrations'
import { missLabel, plural } from '../ui/labels'
import { ListSheet } from './ListSheet'
import { StoresSheet } from './StoresSheet'

export function RecipeScreen() {
  const { id } = useParams()
  const recipe = useAllRecipes().find((r) => r.id === id)
  return recipe ? <RecipeView key={recipe.id} recipeId={recipe.id} /> : <Navigate to="/recettes" replace />
}

function RecipeView({ recipeId }: { recipeId: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const recipe = useAllRecipes().find((r) => r.id === recipeId)!
  const ctx = useMatchContext()
  const photos = usePhotos()
  const defaultPortions = useStore((s) => s.prefs.portions)
  const [portions, setPortions] = useState(defaultPortions)
  const [done, setDone] = useState<Record<number, boolean>>({})
  const [listOpen, setListOpen] = useState(false)
  const [storesOpen, setStoresOpen] = useState(false)

  const e = useMemo(() => evaluate(recipe, portions, ctx), [recipe, portions, ctx])
  const traits = recipeTraits(recipe, BY_ID)
  const pantry = ['sel', 'poivre', "huile d'olive", ...(recipe.pantry ?? [])]
  // Only when you keep track of your spices (at least one in the fridge): otherwise every spice would be "lacking".
  const tracksSpices = Object.keys(ctx.fridge).some((id) => BY_ID.get(id)?.aisle === 'epices')
  const lacking = tracksSpices ? pantrySpices(pantry).filter((id) => !ctx.fridge[id]) : []
  const m = e.missing.length
  const total = recipe.steps.length
  const doneCount = recipe.steps.filter((_, k) => done[k]).length
  const kind: MoodKind = doneCount === total ? 'done' : doneCount > 0 ? 'cooking' : m > 0 ? 'missing' : 'ready'
  const names = e.missing.map((x) => x.ingredient.name.toLowerCase()).join(' et ')
  const mood = {
    ready: { bg: 'var(--ok-soft)', title: 'Tout est dans ton frigo', text: `On allume le feu ? Dans ${recipe.minutes} min, c'est dans l'assiette.` },
    missing: { bg: 'var(--miss-soft)', title: `Il te manque ${m} truc${m > 1 ? 's' : ''}`, text: `Un saut à l'épicerie pour ${names}, ou on improvise sans.` },
    cooking: { bg: 'var(--warn-soft)', title: `Étape ${doneCount} sur ${total}`, text: doneCount / total < 0.5 ? "C'est parti, ça commence à sentir bon…" : 'Plus que quelques gestes, tiens bon !' },
    done: { bg: 'var(--ok-soft)', title: "C'est prêt !", text: "Dis-nous que t'as cuisiné, on met ton frigo à jour." },
  }[kind]

  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/recettes'))
  const cooked = () => {
    const result = cook(e, ctx.fridge)
    setState({
      fridge: result.fridge,
      celebrate: { name: recipe.name, used: result.used, saved: result.saved.map((i) => i.name.toLowerCase()) },
    })
    navigate('/recettes')
  }
  const remove = () => {
    deleteGenerated(recipe.id)
    navigate('/recettes', { replace: true })
  }

  return (
    <>
      <div className="screen screen--flush" style={{ paddingTop: 0, paddingBottom: 'calc(120px + var(--safe-bottom))' }}>
        <div style={{ height: 'calc(290px + var(--top))', background: photoBg(photos[recipe.id]), position: 'relative' }}>
          <button type="button" className="hero-pill" style={{ left: 16 }} onClick={back}>
            ← Retour
          </button>
          <div style={{ position: 'absolute', top: 'calc(var(--top) + 12px)', right: 16, display: 'flex', gap: 8 }}>
            <LikeButton recipeId={recipe.id} variant="hero" />
            <button type="button" className="hero-pill" style={{ position: 'static' }} onClick={() => setListOpen(true)}>
              + Liste
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="badge" style={{ background: m === 0 ? 'var(--ok-soft)' : 'var(--miss-soft)', color: m === 0 ? 'var(--ok-ink)' : 'var(--miss)' }}>
            {m === 0 ? 'Tu as tout' : `Il te manque ${plural(m, 'ingrédient')}`}
          </span>
          <h1 style={{ margin: 0, font: '600 32px/1.08 var(--font)', letterSpacing: '-0.035em' }}>{recipe.name}</h1>
          <div className="muted" style={{ font: '14px var(--font)' }}>
            {recipe.minutes} min · {recipe.cuisine}
            {dietSuffix(traits)}
            {recipe.generated && ' · Inventée pour toi'}
            {recipe.source && ` · via ${recipe.source.name}`}
          </div>
          <div className="muted" style={{ font: '12.5px var(--mono)' }}>
            ≈ {e.nutrition.kcal} kcal · {e.nutrition.protein} g prot. · {e.nutrition.carbs} g gluc. · {e.nutrition.fat} g lip. / portion
          </div>
        </div>

        <div style={{ margin: '18px 20px 0', display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px 14px 10px', borderRadius: 'var(--r1)', background: mood.bg }}>
          <div style={{ width: 104, height: 92, flex: 'none' }}>
            <MoodIllustration kind={kind} count={m} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ font: '600 21px/1.1 var(--font)', letterSpacing: '-0.035em' }}>{mood.title}</span>
            <span style={{ font: '13.5px/1.4 var(--font)', opacity: 0.8, textWrap: 'pretty' }}>{mood.text}</span>
            {(kind === 'cooking' || kind === 'done') && (
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(127,127,127,.22)', overflow: 'hidden', marginTop: 4 }}>
                <div style={{ height: '100%', width: `${Math.round((doneCount / total) * 100)}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width .4s ease' }} />
              </div>
            )}
          </div>
        </div>

        {m > 0 && (
          <div style={{ margin: '10px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, minWidth: 0, font: '600 13px/1.4 var(--font)', color: 'var(--miss)' }}>{missLabel(e)}</span>
            <button
              type="button"
              onClick={() => setStoresOpen(true)}
              style={{ flex: 'none', minHeight: 40, font: '600 14px var(--font)', color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Où les trouver ?
            </button>
          </div>
        )}

        <div className="panel-row" style={{ margin: '20px 20px 0', padding: '12px 14px' }}>
          <span style={{ font: '600 15px var(--font)' }}>Portions</span>
          <div className="stepper">
            <button type="button" className="stepper__btn" aria-label="Moins de portions" onClick={() => setPortions((p) => Math.max(1, p - 1))}>
              −
            </button>
            <span className="stepper__val" aria-live="polite">
              {portions}
            </span>
            <button type="button" className="stepper__btn" aria-label="Plus de portions" onClick={() => setPortions((p) => Math.min(12, p + 1))}>
              +
            </button>
          </div>
        </div>

        <h2 className="section-title" style={{ margin: 0, padding: '24px 20px 8px' }}>
          Ingrédients
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
          {e.items.map((i) => {
            const soon = isSoon(i.days)
            const note =
              i.status === 'ok'
                ? soon
                  ? 'Dans ton frigo · ' + expiryText(i.days)
                  : 'Dans ton frigo'
                : i.status === 'partial'
                  ? `Pas assez : tu as ${qtyLabel(i.have, i.ingredient.unit)}`
                  : 'À acheter'
            const noteColor = i.status === 'ok' ? (soon ? 'var(--warn-ink)' : 'var(--muted)') : i.status === 'partial' ? 'var(--warn-ink)' : 'var(--miss)'
            const dot = i.status === 'ok' ? 'var(--ok)' : i.status === 'partial' ? 'var(--warn)' : 'var(--miss)'
            return (
              <div key={i.ingredient.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', flex: 'none', background: dot }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ font: '600 15px var(--font)' }}>{i.ingredient.name}</span>
                  <span style={{ font: '12.5px var(--font)', color: noteColor }}>{note}</span>
                </div>
                <span className="muted" style={{ font: '600 14px var(--font)' }}>
                  {qtyLabel(i.need, i.ingredient.unit)}
                </span>
              </div>
            )
          })}
          <div className="muted" style={{ font: '13px var(--font)', padding: '10px 0' }}>
            Du placard : {pantry.join(', ')}.
          </div>
          {lacking.length > 0 && (
            <div style={{ font: '600 13px/1.4 var(--font)', color: 'var(--warn-ink)', paddingBottom: 10 }}>
              Pas dans tes épices : {lacking.map((id) => BY_ID.get(id)!.name.toLowerCase()).join(', ')}.
            </div>
          )}
        </div>

        <h2 className="section-title" style={{ margin: 0, padding: '18px 20px 8px' }}>
          Étapes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px' }}>
          {recipe.steps.map((txt, k) => {
            const on = !!done[k]
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => setDone((d) => ({ ...d, [k]: !d[k] }))}
                style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 12px 12px 14px', borderRadius: 'var(--r2)', background: on ? 'var(--bg)' : 'var(--surface)', border: '1px solid var(--line)', width: '100%' }}
              >
                <span style={{ width: 28, height: 28, flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px var(--font)', background: on ? 'var(--ok)' : 'var(--soft)', color: on ? 'var(--accent-ink)' : 'var(--ink)' }}>
                  {on ? '✓' : k + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0, font: '15px/1.5 var(--font)', color: on ? 'var(--muted)' : 'var(--ink)', textDecoration: on ? 'line-through' : 'none', textWrap: 'pretty' }}>{txt}</span>
                <div style={{ width: 68, height: 60, flex: 'none', borderRadius: 'var(--r3)', background: 'var(--soft)', position: 'relative', overflow: 'hidden', opacity: on ? 0.45 : 1, transition: 'opacity .3s' }}>
                  <StepIllustration kind={stepKind(txt)} />
                </div>
              </button>
            )
          })}
        </div>

        {recipe.photoCredit && (
          <div className="muted" style={{ padding: '18px 20px 0', font: '12px var(--font)' }}>
            Photo :{' '}
            <a href={recipe.photoCredit.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
              {recipe.photoCredit.author}
            </a>
            , {recipe.photoCredit.license}
          </div>
        )}

        {recipe.generated && (
          <div style={{ padding: '18px 20px 0' }}>
            <button type="button" style={{ height: 40, font: '600 14px var(--font)', color: 'var(--miss)' }} onClick={remove}>
              Supprimer cette recette
            </button>
          </div>
        )}
      </div>

      <div className="cta-dock" style={{ bottom: 'calc(24px + var(--safe-bottom))' }}>
        <button type="button" className="cta" style={{ justifyContent: 'center' }} onClick={cooked}>
          {m === 0 ? "J'ai cuisiné" : "J'ai cuisiné quand même"}
        </button>
      </div>

      {listOpen && <ListSheet recipeId={recipe.id} onClose={() => setListOpen(false)} />}
      {storesOpen && (
        <StoresSheet
          items={e.missing.map((x) => ({ id: x.ingredient.id, name: x.ingredient.name, qty: Math.max(0, x.need - x.have) }))}
          onClose={() => setStoresOpen(false)}
        />
      )}
    </>
  )
}
