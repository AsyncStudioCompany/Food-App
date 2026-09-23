import { useState } from 'react'
import { deleteAccountData, getAccount, signIn, signOut, signUp, useAccount } from '../account/account'
import { Sheet } from '../ui/Sheet'

const time = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** "Ton compte" block at the top of the profile. */
export function AccountSection() {
  const a = useAccount()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 className="caps" style={{ margin: 0 }}>
        Ton compte
      </h2>
      {a.status === 'unavailable' && (
        <div className="panel-row" style={{ padding: '14px 16px' }}>
          <span className="muted" style={{ font: '13px/1.45 var(--font)' }}>
            Les comptes ne sont pas encore activés sur cette installation (voir docs/INSTALLATION.md). Tes données restent chiffrées sur cet appareil.
          </span>
        </div>
      )}
      {a.status === 'signedOut' && (
        <div className="panel-row" style={{ padding: '14px 16px', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: '600 15px var(--font)' }}>Retrouve ton frigo partout</span>
            <span className="muted" style={{ font: '13px/1.4 var(--font)' }}>
              Tout est chiffré sur ton appareil avant d'être envoyé.
            </span>
          </div>
          <button type="button" className="chip chip--pref" aria-pressed="true" onClick={() => setOpen(true)} style={{ flex: 'none' }}>
            Se connecter
          </button>
        </div>
      )}
      {a.status === 'signedIn' && (
        <div className="panel-row" style={{ padding: '14px 16px', gap: 12, flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: '600 15px var(--font)', overflowWrap: 'anywhere' }}>{a.email}</span>
            <span className="muted" style={{ font: '13px var(--font)' }}>
              {a.syncing ? 'Synchronisation…' : a.lastSync ? `Chiffré et synchronisé · ${time(a.lastSync)}` : 'Chiffré de bout en bout'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn-line" style={{ height: 44 }} onClick={() => void signOut()}>
              Se déconnecter
            </button>
            <button type="button" style={{ height: 44, font: '600 14px var(--font)', color: 'var(--miss)' }} onClick={() => setConfirmDelete(true)}>
              Supprimer mes données
            </button>
          </div>
        </div>
      )}
      {(a.notice || (a.error && !open)) && (
        <div role="status" style={{ font: '600 13px/1.4 var(--font)', color: a.error && !open ? 'var(--miss)' : 'var(--ok-ink)' }}>
          {a.error && !open ? a.error : a.notice}
        </div>
      )}
      {open && <SignInSheet onClose={() => setOpen(false)} />}
      {confirmDelete && (
        <Sheet onClose={() => setConfirmDelete(false)} label="Supprimer mes données">
          <div className="sheet__head">
            <span className="sheet__title">Supprimer tes données ?</span>
            <span className="sheet__sub">
              Ton frigo, tes préférences, tes favoris et tes listes seront effacés du serveur et de cet appareil. C'est définitif.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-line" onClick={() => setConfirmDelete(false)}>
              Annuler
            </button>
            <button
              type="button"
              className="btn-ink"
              style={{ flex: 1, background: 'var(--miss)', color: 'var(--bg)' }}
              disabled={a.busy}
              onClick={() => void deleteAccountData().then(() => setConfirmDelete(false))}
            >
              Supprimer
            </button>
          </div>
        </Sheet>
      )}
    </section>
  )
}

function SignInSheet({ onClose }: { onClose: () => void }) {
  const a = useAccount()
  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async () => {
    await (creating ? signUp : signIn)(email, password)
    if (getAccount().status === 'signedIn') onClose()
  }

  return (
    <Sheet onClose={a.busy ? () => {} : onClose} label={creating ? 'Créer un compte' : 'Se connecter'} gap={16}>
      <div className="sheet__head">
        <span className="sheet__title">{creating ? 'Créer ton compte' : 'Se connecter'}</span>
        <span className="sheet__sub">Tes données sont chiffrées avec ton mot de passe : personne d'autre ne peut les lire, pas même le serveur.</span>
      </div>
      <form
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <input className="input" style={{ height: 48 }} type="email" autoComplete="email" placeholder="E-mail" aria-label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          className="input"
          style={{ height: 48 }}
          type="password"
          autoComplete={creating ? 'new-password' : 'current-password'}
          placeholder={creating ? 'Mot de passe (8 caractères ou plus)' : 'Mot de passe'}
          aria-label="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {creating && (
          <span style={{ font: '600 13px/1.4 var(--font)', color: 'var(--warn-ink)' }}>
            Retiens-le bien : si tu l'oublies, tes données ne pourront pas être récupérées.
          </span>
        )}
        {a.error && (
          <span role="alert" style={{ font: '600 13px/1.4 var(--font)', color: 'var(--miss)' }}>
            {a.error}
          </span>
        )}
        {a.notice && !a.error && <span style={{ font: '600 13px/1.4 var(--font)', color: 'var(--ok-ink)' }}>{a.notice}</span>}
        <button type="submit" className="btn-ink" disabled={a.busy} style={{ opacity: a.busy ? 0.6 : 1 }}>
          {a.busy ? 'Chiffrement…' : creating ? 'Créer mon compte' : 'Se connecter'}
        </button>
      </form>
      <button type="button" className="muted" style={{ alignSelf: 'center', height: 40, font: '600 14px var(--font)' }} onClick={() => setCreating((c) => !c)}>
        {creating ? 'Déjà un compte ? Connecte-toi' : 'Pas encore de compte ? Crée-le'}
      </button>
    </Sheet>
  )
}
