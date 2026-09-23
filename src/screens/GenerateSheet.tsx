import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AiError, inventRecipe } from '../state/ai'
import { flash, useStore } from '../state/store'
import { MoodIllustration } from '../ui/Illustrations'
import { plural, recipePath } from '../ui/labels'
import { Sheet } from '../ui/Sheet'

/** "Invente-moi une recette": the AI builds a recipe from the fridge and the preferences. */
export function GenerateSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const count = useStore((s) => Object.keys(s.fridge).length)
  const [wish, setWish] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const go = async () => {
    setBusy(true)
    setError(null)
    try {
      const recipe = await inventRecipe(wish)
      onClose()
      navigate(recipePath(recipe.id))
      flash('Rangée dans « Inventées pour toi ».')
    } catch (e) {
      setError(e instanceof AiError ? e.message : "Oups, ça n'a pas marché. Réessaie.")
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={busy ? () => {} : onClose} label="Une recette sur mesure">
      <div className="sheet__head">
        <span className="sheet__title">Une recette sur mesure</span>
        <span className="sheet__sub">
          {count ? `L'IA part de tes ${plural(count, 'aliment')} et de tes goûts.` : "Ton frigo est vide : l'IA partira de tes goûts."}
        </span>
      </div>
      {busy ? (
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px 14px 10px', borderRadius: 'var(--r1)', background: 'var(--warn-soft)' }} aria-live="polite">
          <div style={{ width: 104, height: 92, flex: 'none' }}>
            <MoodIllustration kind="cooking" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ font: '600 21px/1.1 var(--font)', letterSpacing: '-0.035em' }}>Ça mijote…</span>
            <span style={{ font: '13.5px/1.4 var(--font)', opacity: 0.8 }}>On invente ta recette, quelques secondes.</span>
          </div>
        </div>
      ) : (
        <input
          className="input"
          style={{ height: 48 }}
          value={wish}
          maxLength={200}
          onChange={(e) => setWish(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void go()}
          placeholder="Une envie ? (ex. réconfortant, sans four)"
          aria-label="Ton envie"
        />
      )}
      {error && (
        <div style={{ font: '600 14px/1.4 var(--font)', color: 'var(--miss)' }} role="alert">
          {error}
        </div>
      )}
      <button type="button" className="cta" style={{ justifyContent: 'center', height: 54, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => void go()}>
        {busy ? 'En cuisine…' : 'Inventer'}
      </button>
    </Sheet>
  )
}
