import { useState, type FormEvent } from 'react'
import type { Run } from '../App'
import { fmt, formatDate, todayIso } from '../calc'
import type { Data } from '../schema'
import { signedInName } from '../google/auth'

interface Props {
  data: Data
  run: Run
  busy: boolean
}

const NAME_KEY = 'bookclub.memberName'

function savedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function Club({ data, run, busy }: Props) {
  const [name, setName] = useState(() => savedName() || signedInName())
  const book = data.books.find((b) => b.stage === 'Drafting') ?? data.books[0]
  const weekAgo = todayIso(new Date(Date.now() - 6 * 86_400_000))
  const wordsThisWeek = data.sessions.filter((s) => s.date >= weekAgo).reduce((n, s) => n + s.words, 0)
  const posts = [...data.club].sort((a, b) => b.date.localeCompare(a.date))

  async function post(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const get = (k: string) => String(f.get(k) ?? '').trim()
    const member = get('member') || 'Me'
    try {
      localStorage.setItem(NAME_KEY, member)
    } catch {
      // Remembering the name is only a convenience.
    }
    const update = [
      `This week: ${get('thisWeek')}`,
      get('win') && `Win: ${get('win')}`,
      `Stuck on: ${get('stuck') || 'nothing'}`,
      get('next') && `Next week: ${get('next')}`,
    ]
      .filter(Boolean)
      .join(' · ')
    await run((store) =>
      store.postCheckIn({ member, book: book ? `${book.title} · ${book.stage}` : '', update, ask: get('ask') }),
    )
    form.reset()
  }

  return (
    <div className="narrow">
      <h1>Club</h1>
      <p className="muted">Weekly check-ins are saved to the Club tab of your sheet.</p>

      <form className="panel checkin" onSubmit={post}>
        <h2>Your weekly check-in</h2>
        <p className="small">Pre-filled from your sessions. Edit, then post.</p>
        <label>
          Your name
          <input name="member" value={name} onChange={(e) => setName(e.target.value)} placeholder="Me" />
        </label>
        <p className="small">
          <b>Book:</b> {book ? `${book.title} — ${book.stage}` : 'none yet'}
        </p>
        <label>
          This week
          <input name="thisWeek" defaultValue={`${fmt(wordsThisWeek)} words`} key={wordsThisWeek} />
        </label>
        <label>
          Win
          <input name="win" placeholder="One thing that went well" />
        </label>
        <label>
          Stuck on
          <input name="stuck" placeholder="One problem, or leave blank" />
        </label>
        <label>
          Ask
          <input name="ask" placeholder="A read, an opinion, a nudge" />
        </label>
        <label>
          Next week
          <input name="next" placeholder="One goal" />
        </label>
        <button type="submit" className="btn wide" disabled={busy}>
          Post check-in
        </button>
      </form>

      <h2>Recent check-ins</h2>
      {posts.length === 0 && <p className="muted">No check-ins yet.</p>}
      {posts.map((p, i) => (
        <article className="panel post" key={`${p.date}-${i}`}>
          <div className="post-head">
            <span className="avatar" aria-hidden="true">
              {(p.member || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 1).toUpperCase() || '?'}
            </span>
            <div>
              <div className="post-member">{p.member || 'Someone'}</div>
              <div className="muted small">
                {[p.book, formatDate(p.date)].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
          {p.update && <p>{p.update}</p>}
          {p.ask && (
            <p>
              <b>Ask:</b> {p.ask}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}
