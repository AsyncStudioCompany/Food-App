import { useState } from 'react'
import { deleteAccountData, signOut, useAccount } from '../account/account'
import { Sheet } from '../ui/Sheet'

const time = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** "Ton compte" block of the profile (the group gives the title). */
export function AccountSection() {
  const a = useAccount()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {a.status === 'unavailable' && (
        <div className="panel-row" style={{ padding: '14px 16px' }}>
          <span className="muted" style={{ font: '13px/1.45 var(--font)' }}>
            Les comptes ne sont pas activés sur cette installation (voir docs/INSTALLATION.md). Ton profil reste chiffré sur cet appareil.
          </span>
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
      {(a.notice || a.error) && (
        <div role="status" style={{ font: '600 13px/1.4 var(--font)', color: a.error ? 'var(--miss)' : 'var(--ok-ink)' }}>
          {a.error ?? a.notice}
        </div>
      )}
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
