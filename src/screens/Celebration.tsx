import { setState, useStore } from '../state/store'
import { MoodIllustration } from '../ui/Illustrations'

/** "Bon appétit !" after "J'ai cuisiné". */
export function Celebration() {
  const c = useStore((s) => s.celebrate)
  if (!c) return null
  const s = c.used > 1 ? 's' : ''
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bon appétit !"
      style={{ position: 'absolute', inset: 0, zIndex: 11, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '40px 30px', textAlign: 'center', animation: 'mj-rise .45s ease-out' }}
    >
      <div style={{ width: 208, height: 184, marginBottom: 10 }}>
        <MoodIllustration kind="done" scale={2} />
      </div>
      <div style={{ font: '600 40px/1.05 var(--font)', letterSpacing: '-0.035em' }}>Bon appétit !</div>
      <div className="muted" style={{ font: '15px/1.5 var(--font)', maxWidth: 280, textWrap: 'pretty' }}>
        {c.name} : {c.used} ingrédient{s} de ton frigo utilisé{s}. Zéro gâchis, t'assures.
      </div>
      {c.saved.length > 0 && (
        <div style={{ font: '600 13px var(--font)', padding: '8px 14px', borderRadius: 999, background: 'var(--ok-soft)', color: 'var(--ok-ink)' }}>
          Sauvés de la poubelle : {c.saved.join(', ')}
        </div>
      )}
      <button type="button" className="cta" style={{ marginTop: 18, width: 'auto', height: 54, padding: '0 30px' }} onClick={() => setState({ celebrate: null })}>
        Retour aux recettes
      </button>
    </div>
  )
}
