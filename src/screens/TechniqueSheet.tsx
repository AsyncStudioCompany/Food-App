import type { Technique } from '../domain/techniques'
import { StepIllustration } from '../ui/Illustrations'
import { Sheet } from '../ui/Sheet'

/** "C'est quoi ?": explanation of a cooking technique, opened from a step. */
export function TechniqueSheet({ technique: t, onClose }: { technique: Technique; onClose: () => void }) {
  return (
    <Sheet onClose={onClose} gap={16} label={t.name}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 102, height: 90, flex: 'none', borderRadius: 'var(--r2)', background: 'var(--soft)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 68, height: 60, transform: 'scale(1.5)', transformOrigin: 'top left' }}>
            <StepIllustration kind={t.kind} />
          </div>
        </div>
        <div className="sheet__head">
          <span className="sheet__title sheet__title--26">{t.name}</span>
          <span className="sheet__sub">Technique de cuisine</span>
        </div>
      </div>
      <p style={{ margin: 0, font: '15px/1.55 var(--font)', textWrap: 'pretty' }}>{t.what}</p>
      <div className="panel-row" style={{ padding: '14px 16px', flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
        <span className="caps">Astuce</span>
        <span style={{ font: '14px/1.5 var(--font)', textWrap: 'pretty' }}>{t.tip}</span>
      </div>
      <button type="button" className="btn-ink" onClick={onClose}>
        Compris
      </button>
    </Sheet>
  )
}
