import { useCallback, useEffect, useState } from 'react'
import { clientId, getToken, signIn, signOut } from './google/auth'
import { AuthError, SheetsClient } from './google/sheets'
import { Logo } from './Logo'
import type { Data } from './schema'
import { Board } from './screens/Board'
import { Club } from './screens/Club'
import { Today } from './screens/Today'
import { DemoStore, SheetStore, type Store } from './store'

const ROUTES = { board: 'Board', today: 'Today', club: 'Club' } as const
type Route = keyof typeof ROUTES

function currentRoute(): Route {
  const r = window.location.hash.replace(/^#\/?/, '')
  return r in ROUTES ? (r as Route) : 'board'
}

export type Run = (change: (store: Store) => Promise<void>) => Promise<void>

// Google sign-in in the browser lasts for the page only; remember that the
// person connected before so the button can say "Reconnect".
const CONNECTED_KEY = 'bookclub.connected'
function wasConnected(): boolean {
  try {
    return localStorage.getItem(CONNECTED_KEY) === '1'
  } catch {
    return false
  }
}
function rememberConnected(on: boolean): void {
  try {
    if (on) localStorage.setItem(CONNECTED_KEY, '1')
    else localStorage.removeItem(CONNECTED_KEY)
  } catch {
    // Only affects the button label.
  }
}

export function App() {
  const [route, setRoute] = useState<Route>(currentRoute)
  const [store, setStore] = useState<Store>(() => new DemoStore())
  const [data, setData] = useState<Data | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onHash = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const reload = useCallback(async (s: Store) => {
    setData(await s.load())
  }, [])

  useEffect(() => {
    reload(store).catch((e) => setError(messageOf(e)))
  }, [store, reload])

  const run: Run = async (change) => {
    setBusy(true)
    setError('')
    try {
      await change(store)
      await reload(store)
    } catch (e) {
      setError(messageOf(e))
    } finally {
      setBusy(false)
    }
  }

  async function connect() {
    setBusy(true)
    setError('')
    try {
      await signIn()
      const client = new SheetsClient(getToken)
      await client.open()
      rememberConnected(true)
      setData(null)
      setStore(new SheetStore(client))
    } catch (e) {
      setError(messageOf(e))
    } finally {
      setBusy(false)
    }
  }

  function disconnect() {
    signOut()
    rememberConnected(false)
    setData(null)
    setStore(new DemoStore())
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/board">
          <Logo size={44} />
          <span>Bookclub</span>
        </a>
        <nav aria-label="Main" className="nav">
          {(Object.keys(ROUTES) as Route[]).map((r) => (
            <a key={r} href={`#/${r}`} aria-current={route === r ? 'page' : undefined}>
              {ROUTES[r]}
            </a>
          ))}
        </nav>
        <div className="account">
          {store.kind === 'sheet' ? (
            <>
              <a className="sheet-link" href={store.sheetUrl} target="_blank" rel="noreferrer">
                Open your sheet
              </a>
              <button type="button" className="btn ghost" onClick={disconnect}>
                Sign out
              </button>
            </>
          ) : clientId ? (
            <button type="button" className="btn" onClick={connect} disabled={busy}>
              {wasConnected() ? 'Reconnect Google Sheet' : 'Connect Google Sheet'}
            </button>
          ) : null}
        </div>
      </header>

      {store.kind === 'demo' && (
        <p className="banner">
          {clientId && wasConnected()
            ? 'You’re looking at sample data. Reconnect to see your books — they’re safe in your sheet.'
            : clientId
            ? 'You’re looking at sample data. Connect your Google Sheet to save your own books — the app creates a “Bookclub” sheet in your Drive the first time.'
            : 'You’re looking at sample data. Google sign-in isn’t set up for this site yet (see docs/google-setup.md).'}
        </p>
      )}
      {error && (
        <p className="banner error" role="alert">
          {error}
        </p>
      )}

      <main className="main" aria-busy={busy}>
        {!data ? (
          <p className="muted">Loading…</p>
        ) : route === 'today' ? (
          <Today data={data} run={run} busy={busy} />
        ) : route === 'club' ? (
          <Club data={data} run={run} busy={busy} />
        ) : (
          <Board data={data} run={run} busy={busy} />
        )}
      </main>
    </div>
  )
}

function messageOf(e: unknown): string {
  if (e instanceof AuthError) return 'Your Google sign-in expired. Sign out and connect again.'
  return e instanceof Error ? e.message : String(e)
}
