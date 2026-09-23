import { useState } from 'react'
import { useAccount } from '../account/account'
import { Brand } from '../ui/BrandBar'
import { MoodIllustration } from '../ui/Illustrations'
import { AuthForm } from './AuthForm'
import { Onboarding } from './Onboarding'

type Mode = 'home' | 'signup' | 'signin' | 'local'

/** What you see before signing in: no recipes, only the way in. */
export function Welcome() {
  const a = useAccount()
  const [mode, setMode] = useState<Mode>('home')
  const accounts = a.status !== 'unavailable'

  if (mode === 'local') return <Onboarding />

  if (mode === 'signup' || mode === 'signin') {
    const creating = mode === 'signup'
    return (
      <div className="screen" style={{ paddingBottom: 'calc(40px + var(--safe-bottom))' }}>
        <button type="button" className="round-btn" aria-label="Retour" onClick={() => setMode('home')} style={{ marginBottom: 22 }}>
          ←
        </button>
        <h1 className="title title--pretty" style={{ marginBottom: 8 }}>
          {creating ? (
            <>
              <span>Crée ton compte</span> <span className="muted">en 2 secondes.</span>
            </>
          ) : (
            <>
              <span>Content de</span> <span className="muted">te revoir.</span>
            </>
          )}
        </h1>
        <p className="muted" style={{ font: '14px/1.45 var(--font)', margin: '0 0 22px' }}>
          Tes données sont chiffrées avec ton mot de passe : personne d'autre ne peut les lire, pas même le serveur.
        </p>
        <AuthForm key={mode} creating={creating} />
        <button type="button" className="muted" style={{ display: 'block', margin: '14px auto 0', height: 40, font: '600 14px var(--font)' }} onClick={() => setMode(creating ? 'signin' : 'signup')}>
          {creating ? 'Déjà un compte ? Connecte-toi' : 'Pas encore de compte ? Crée-le'}
        </button>
      </div>
    )
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', paddingBottom: 'calc(28px + var(--safe-bottom))' }}>
      <Brand />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: '24px 0' }}>
        <div style={{ width: 208, height: 184, marginBottom: 6 }}>
          <MoodIllustration kind="ready" scale={2} />
        </div>
        <h1 className="title title--pretty">
          <span>Cuisine avec</span> <span className="muted">ce que t'as.</span>
        </h1>
        <p className="muted" style={{ font: '15px/1.5 var(--font)', margin: 0, textWrap: 'pretty' }}>
          Ton frigo, tes goûts, ton objectif : Mijote te dit quoi cuisiner, sans rien gâcher.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {accounts ? (
          <>
            <button type="button" className="cta" style={{ justifyContent: 'center' }} onClick={() => setMode('signup')}>
              Créer mon compte
            </button>
            <button type="button" className="btn-line" style={{ justifyContent: 'center', height: 56 }} onClick={() => setMode('signin')}>
              J'ai déjà un compte
            </button>
          </>
        ) : (
          <>
            <button type="button" className="cta" style={{ justifyContent: 'center' }} onClick={() => setMode('local')}>
              Commencer
            </button>
            <span className="muted" style={{ font: '13px/1.4 var(--font)', textAlign: 'center' }}>
              Les comptes ne sont pas activés sur cette installation : ton profil reste sur cet appareil.
            </span>
          </>
        )}
      </div>
    </div>
  )
}
