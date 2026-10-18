// Google sign-in through Firebase Auth, using the same Firebase project and
// OAuth client as SheetSync (sherol/sheetsync). The Google access token stays
// in memory only; nothing is stored in the browser by this module.
import { getApp, getApps, initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'

// Public web config, the same as SheetSync's. These values identify the
// project; they are not secrets.
const firebaseConfig = {
  projectId: 'gen-lang-client-0263183169',
  appId: '1:138495577806:web:56ded045b4b2ca73878a9f',
  apiKey: 'AIzaSyBifkz664y64TkdVgSvsRsVEuzEyZm19d4',
  authDomain: 'gen-lang-client-0263183169.firebaseapp.com',
  storageBucket: 'gen-lang-client-0263183169.firebasestorage.app',
  messagingSenderId: '138495577806',
}

// drive.file: the app sees only the sheet it created, not the rest of Drive.
const SCOPE = 'https://www.googleapis.com/auth/drive.file'

export const signInAvailable = true

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
provider.addScope(SCOPE)

let token = ''
let expiresAt = 0
let userName = ''

export class SignInNeeded extends Error {}

const FRIENDLY: Record<string, string> = {
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.',
  'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
  'auth/cancelled-popup-request': 'The Google sign-in window was closed before finishing.',
  'auth/unauthorized-domain': 'This site isn’t on the Firebase project’s list of authorized domains (see docs/google-setup.md).',
}

/** Opens Google's sign-in popup. Must be called from a click. */
export async function signIn(): Promise<string> {
  try {
    const result = await signInWithPopup(auth, provider)
    const accessToken = GoogleAuthProvider.credentialFromResult(result)?.accessToken
    if (!accessToken) throw new Error('Google sign-in did not return access to Sheets.')
    token = accessToken
    // Google access tokens last an hour.
    expiresAt = Date.now() + 55 * 60_000
    userName = result.user.displayName ?? ''
    return token
  } catch (e) {
    const code = (e as { code?: string }).code ?? ''
    throw new Error(FRIENDLY[code] ?? (e instanceof Error ? e.message : String(e)))
  }
}

/** Returns the current token. A new one needs a click, so expiry asks the person to reconnect. */
export async function getToken(forceRefresh = false): Promise<string> {
  if (token && !forceRefresh && Date.now() < expiresAt) return token
  throw new SignInNeeded('Your Google sign-in expired.')
}

export function signedInName(): string {
  return userName
}

export function signOut(): void {
  token = ''
  expiresAt = 0
  userName = ''
  firebaseSignOut(auth).catch(() => {})
}
