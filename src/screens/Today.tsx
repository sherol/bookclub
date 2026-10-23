import { useState, type FormEvent } from 'react'
import type { Run } from '../App'
import { dailyTarget, fmt, formatDate, todayIso } from '../calc'
import type { Data } from '../schema'

interface Props {
  data: Data
  run: Run
  busy: boolean
}

export function Today({ data, run, busy }: Props) {
  const today = todayIso()
  const [bookId, setBookId] = useState(() => data.books.find((b) => b.stage === 'Drafting')?.id ?? data.books[0]?.id ?? '')
  const book = data.books.find((b) => b.id === bookId)
  const sessions = data.sessions.filter((s) => s.bookId === bookId)
  const wordsToday = sessions.filter((s) => s.date === today).reduce((n, s) => n + s.words, 0)
  // Target for today counts from where the book stood this morning.
  const target = book ? dailyTarget(book.targetWords, book.currentWords - wordsToday, book.draftDue, today) : null
  const minutes = sessions.reduce((n, s) => n + s.minutes, 0)
  const pace = minutes ? Math.round((sessions.reduce((n, s) => n + s.words, 0) / minutes) * 60) : null
  const pct = target ? Math.min(100, Math.round((wordsToday / target) * 100)) : 0

  const weekAhead = todayIso(new Date(Date.now() + 7 * 86_400_000))
  const tasks = data.tasks
    .filter((t) => t.status !== 'Done' || t.due === today)
    .filter((t) => !t.due || t.due <= weekAhead)
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))
  const titleOf = (id: string) => data.books.find((b) => b.id === id)?.title ?? ''

  async function log(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const words = Number(f.get('words')) || 0
    const mins = Number(f.get('minutes')) || 0
    if (!bookId || words <= 0) return
    const saved = await run((store) => store.logSession({ date: today, bookId, words, minutes: mins }))
    if (saved) form.reset()
  }

  return (
    <div className="narrow">
      <h1>Today</h1>
      <p className="muted">{formatDate(today)}</p>

      {data.books.length === 0 ? (
        <p className="panel">Add a book on the board first.</p>
      ) : (
        <>
          <section className="panel">
            <label className="inline">
              Book
              <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
                {data.books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} · {b.stage}
                  </option>
                ))}
              </select>
            </label>
            <div className="big-number">
              <span>{fmt(wordsToday)}</span>
              <span className="muted">{target ? `of ${fmt(target)} words stashed today` : 'words stashed today'}</span>
            </div>
            {target ? (
              <div className="bar big" role="img" aria-label={`${pct}% of today’s target`}>
                <div className={pct >= 100 ? 'met' : ''} style={{ width: `${pct}%` }} />
              </div>
            ) : (
              <p className="muted small">Set a target word count and draft due date on this book to get a daily target.</p>
            )}
            {book && (
              <p className="muted small">
                {fmt(book.currentWords)}
                {book.targetWords ? ` / ${fmt(book.targetWords)}` : ''} words
                {book.draftDue && ` · draft due ${formatDate(book.draftDue)}`}
                {pace !== null && ` · your pace ${fmt(pace)} words/hour`}
              </p>
            )}
          </section>

          <form className="panel" onSubmit={log}>
            <h2>Log a session</h2>
            <div className="two-col">
              <label>
                Words added
                <input name="words" type="number" min="1" required />
              </label>
              <label>
                Minutes
                <input name="minutes" type="number" min="0" />
              </label>
            </div>
            <button type="submit" className="btn wide" disabled={busy}>
              Log session
            </button>
          </form>
        </>
      )}

      <section>
        <h2>This week</h2>
        {tasks.length === 0 && <p className="muted">No tasks due this week. Add rows to the Tasks tab of your sheet.</p>}
        <ul className="tasks">
          {tasks.map((t) => {
            const done = t.status === 'Done'
            const late = !done && t.due !== '' && t.due < today
            return (
              <li key={`${t.row}-${t.id}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={done}
                    disabled={busy}
                    onChange={() => run((store) => store.setTaskStatus(t, done ? 'Not started' : 'Done'))}
                  />
                  <span className={done ? 'done' : ''}>
                    {t.task}
                    <span className={`task-meta${late ? ' late' : ''}`}>
                      {[titleOf(t.bookId), late ? `overdue since ${formatDate(t.due)}` : t.due && `due ${formatDate(t.due)}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
