// Google sign-in with Google Identity Services (token model). The access token
// stays in memory only; nothing is stored in the browser.

// drive.file: the app sees only the sheet it created, not the rest of Drive.
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GIS_SRC = 'https://accounts.google.com/gsi/client'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}
interface TokenClient {
  callback: (r: TokenResponse) => void
  error_callback?: (e: { type: string; message?: string }) => void
  requestAccessToken: (opts?: { prompt?: string }) => void
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string
            scope: string
            callback: (r: TokenResponse) => void
            error_callback?: (e: { type: string; message?: string }) => void
          }) => TokenClient
          revoke: (token: string, done: () => void) => void
        }
      }
    }
  }
}

export const clientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

let scriptPromise: Promise<void> | null = null
function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      scriptPromise = null
      reject(new Error('Could not load Google sign-in'))
    }
    document.head.appendChild(s)
  })
  return scriptPromise
}

let client: TokenClient | null = null
let token = ''
let expiresAt = 0

async function requestToken(prompt: string): Promise<string> {
  await loadScript()
  const oauth2 = window.google!.accounts.oauth2
  client ??= oauth2.initTokenClient({ client_id: clientId, scope: SCOPE, callback: () => {} })
  return new Promise((resolve, reject) => {
    client!.callback = (r) => {
      if (r.error || !r.access_token) {
        reject(new Error(r.error_description || r.error || 'Sign-in failed'))
        return
      }
      token = r.access_token
      expiresAt = Date.now() + ((r.expires_in ?? 3600) - 60) * 1000
      resolve(token)
    }
    client!.error_callback = (e) => reject(new Error(e.message || e.type))
    client!.requestAccessToken({ prompt })
  })
}

/** Opens Google's consent popup. Must be called from a click. */
export function signIn(): Promise<string> {
  return requestToken('consent')
}

/** Returns a valid token, refreshing silently when it has expired. */
export async function getToken(forceRefresh = false): Promise<string> {
  if (token && !forceRefresh && Date.now() < expiresAt) return token
  return requestToken('')
}

export function signOut(): void {
  if (token) window.google?.accounts.oauth2.revoke(token, () => {})
  token = ''
  expiresAt = 0
}
