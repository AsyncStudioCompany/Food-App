import { createClient, type AuthError } from '@supabase/supabase-js'
import { AccountError, type AccountBackend, type Vault } from './backend'

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou mot de passe incorrect.',
  email_not_confirmed: "Confirme d'abord ton e-mail avec le lien reçu, puis connecte-toi.",
  user_already_exists: 'Un compte existe déjà avec cet e-mail : connecte-toi.',
  email_exists: 'Un compte existe déjà avec cet e-mail : connecte-toi.',
  over_email_send_rate_limit: 'Trop de tentatives, réessaie dans quelques minutes.',
  over_request_rate_limit: 'Trop de tentatives, réessaie dans quelques minutes.',
  email_address_invalid: "Cette adresse e-mail n'est pas valide.",
  signup_disabled: 'Les inscriptions sont fermées sur ce serveur.',
}

function fail(error: AuthError | { message: string; code?: string }): never {
  throw new AccountError(MESSAGES[error.code ?? ''] ?? 'Le serveur de comptes ne répond pas comme prévu. Réessaie plus tard.')
}

interface Row {
  user_id: string
  wrapped_key: string
  wrap_iv: string
  data: string
  data_iv: string
  updated_at: string
}

const toVault = (r: Row): Vault => ({ wrappedKey: r.wrapped_key, wrapIv: r.wrap_iv, data: r.data, dataIv: r.data_iv, updatedAt: r.updated_at })

/** Accounts on Supabase (Auth + the `vaults` table of supabase/migrations). */
export function supabaseBackend(url: string, anonKey: string): AccountBackend {
  const sb = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  return {
    async signUp(email, password) {
      const { data, error } = await sb.auth.signUp({ email, password })
      if (error) fail(error)
      return { confirmEmail: !data.session }
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password })
      if (error) fail(error)
      return { userId: data.user.id }
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async session() {
      const { data } = await sb.auth.getSession()
      const user = data.session?.user
      return user ? { userId: user.id, email: user.email ?? '' } : null
    },
    async getVault(userId) {
      const { data, error } = await sb.from('vaults').select('*').eq('user_id', userId).maybeSingle<Row>()
      if (error) fail(error)
      return data ? toVault(data) : null
    },
    async putVault(userId, v) {
      const { data, error } = await sb
        .from('vaults')
        .upsert({ user_id: userId, wrapped_key: v.wrappedKey, wrap_iv: v.wrapIv, data: v.data, data_iv: v.dataIv, updated_at: new Date().toISOString() })
        .select('updated_at')
        .single<{ updated_at: string }>()
      if (error) fail(error)
      return data.updated_at
    },
    async deleteVault(userId) {
      const { error } = await sb.from('vaults').delete().eq('user_id', userId)
      if (error) fail(error)
    },
  }
}
