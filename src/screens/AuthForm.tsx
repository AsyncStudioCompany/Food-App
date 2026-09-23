import { useState } from 'react'
import { signIn, signUp, useAccount } from '../account/account'

/** E-mail + password form, for signing up or signing in. */
export function AuthForm({ creating }: { creating: boolean }) {
  const a = useAccount()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      onSubmit={(e) => {
        e.preventDefault()
        void (creating ? signUp : signIn)(email, password)
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
          Retiens-le bien : tes données sont chiffrées avec, et si tu l'oublies, personne ne pourra les récupérer.
        </span>
      )}
      {a.error && (
        <span role="alert" style={{ font: '600 13px/1.4 var(--font)', color: 'var(--miss)' }}>
          {a.error}
        </span>
      )}
      {a.notice && !a.error && (
        <span role="status" style={{ font: '600 13px/1.4 var(--font)', color: 'var(--ok-ink)' }}>
          {a.notice}
        </span>
      )}
      <button type="submit" className="cta" disabled={a.busy} style={{ justifyContent: 'center', marginTop: 6, opacity: a.busy ? 0.6 : 1 }}>
        {a.busy ? 'Chiffrement…' : creating ? 'Créer mon compte' : 'Se connecter'}
      </button>
    </form>
  )
}
