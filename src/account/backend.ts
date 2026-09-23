/** What the server stores for a user: nothing it can read. */
export interface Vault {
  /** Data key wrapped by the key derived from the password. */
  wrappedKey: string
  wrapIv: string
  /** Encrypted data (fridge, preferences, favorites, lists, invented recipes). */
  data: string
  dataIv: string
  /** Server time of the last write (ISO). */
  updatedAt: string
}

export interface AccountBackend {
  /** `confirmEmail`: the server sent a confirmation e-mail, sign in after clicking it. */
  signUp(email: string, password: string): Promise<{ confirmEmail: boolean }>
  signIn(email: string, password: string): Promise<{ userId: string }>
  signOut(): Promise<void>
  /** Current session kept by the backend client, if any. */
  session(): Promise<{ userId: string; email: string } | null>
  getVault(userId: string): Promise<Vault | null>
  /** Creates or replaces the vault; returns the new `updatedAt`. */
  putVault(userId: string, vault: Omit<Vault, 'updatedAt'>): Promise<string>
  deleteVault(userId: string): Promise<void>
}

/** Error with a message ready to show (French). */
export class AccountError extends Error {}
