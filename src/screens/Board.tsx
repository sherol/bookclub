import { useState, type FormEvent } from 'react'
import type { Run } from '../App'
import { dailyTarget, fmt, formatDate, todayIso } from '../calc'
import { SINGLE_SLOT_STAGES, STAGE_GATES, STAGES, type Book, type Data, type Stage } from '../schema'

interface Props {
  data: Data
  run: Run
  busy: boolean
}

export function Board({ data, run, busy }: Props) {
  const [notice, setNotice] = useState('')
  const [adding, setAdding] = useState(false)
  const today = todayIso()
  const weekAgo = todayIso(new Date(Date.now() - 6 * 86_400_000))
  const wordsThisWeek = data.sessions.filter((s) => s.date >= weekAgo && s.date <= today).reduce((n, s) => n + s.words, 0)
  const inStage = (stage: Stage) => data.books.filter((b) => b.stage === stage)

  function move(book: Book, stage: Stage) {
    setNotice('')
    const occupant = inStage(stage).find((b) => b.id !== book.id)
    if (SINGLE_SLOT_STAGES.includes(stage) && occupant) {
      setNotice(`Only one book can be in ${stage} at a time. Move “${occupant.title}” on first.`)
      return
    }
    run((store) => store.setStage(book, stage))
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Portfolio board</h1>
          <p className="muted">{data.books.length} books in flight · use “Move to” to change a book’s stage</p>
        </div>
        <div className="tiles">
          {SINGLE_SLOT_STAGES.map((s) => (
            <div className="tile" key={s}>
              <div className="tile-label">{s} slot</div>
              <div className="tile-value">{inStage(s).length} of 1{inStage(s).length >= 1 ? ' · full' : ' · open'}</div>
            </div>
          ))}
          <div className="tile">
            <div className="tile-label">Words stashed, last 7 days</div>
            <div className="tile-value">{fmt(wordsThisWeek)}</div>
          </div>
          <button type="button" className="btn" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
            + Add a book
          </button>
        </div>
      </div>

      {adding && <AddBook run={run} busy={busy} onDone={() => setAdding(false)} />}
      {notice && (
        <p className="banner warn" role="status">
          {notice}
        </p>
      )}

      <div className="board-scroll">
        <div className="board">
          {STAGES.map((stage, i) => (
            <section key={stage} className={`column${stage === 'Drafting' ? ' highlight' : ''}`} aria-label={stage}>
              <div className="column-head">
                <h2>
                  {i + 1}. {stage}
                </h2>
                <span className="muted">{inStage(stage).length}</span>
              </div>
              <p className="gate">Exit: {STAGE_GATES[stage]}</p>
              {inStage(stage).map((book) => (
                <BookCard key={book.id} book={book} today={today} busy={busy} onMove={(s) => move(book, s)} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </>
  )
}

function BookCard({ book, today, busy, onMove }: { book: Book; today: string; busy: boolean; onMove: (s: Stage) => void }) {
  const pct = book.targetWords ? Math.min(100, Math.round((book.currentWords / book.targetWords) * 100)) : null
  const target = book.stage === 'Drafting' ? dailyTarget(book.targetWords, book.currentWords, book.draftDue, today) : null
  const late = book.stage === 'Drafting' && book.draftDue !== '' && book.draftDue < today
  return (
    <article className="card">
      <div className="card-series">{book.series ? `${book.series}${book.seriesNo ? ` · Book ${book.seriesNo}` : ''}` : 'Standalone'}</div>
      <h3>{book.title}</h3>
      {pct !== null && book.currentWords > 0 && (
        <div className="bar" role="img" aria-label={`${pct}% of target words`}>
          <div style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="card-detail">
        {book.targetWords ? `${fmt(book.currentWords)} / ${fmt(book.targetWords)} words` : 'No target set'}
        {target !== null && ` · ${fmt(target)} a day`}
      </div>
      {book.draftDue && book.stage === 'Drafting' && (
        <div className={`card-due${late ? ' late' : ''}`}>{late ? 'Draft overdue' : `Draft due ${formatDate(book.draftDue)}`}</div>
      )}
      <label className="move">
        Move to
        <select value={book.stage} disabled={busy} onChange={(e) => onMove(e.target.value as Stage)}>
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
    </article>
  )
}

function AddBook({ run, busy, onDone }: { run: Run; busy: boolean; onDone: () => void }) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) ?? '').trim()
    const saved = await run((store) =>
      store.addBook({
        title: get('title'),
        series: get('series'),
        seriesNo: get('seriesNo'),
        stage: get('stage') as Stage,
        targetWords: Number(get('targetWords')) || 0,
        draftDue: get('draftDue'),
        publishingPath: get('publishingPath'),
      }),
    )
    if (saved) onDone()
  }
  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h2>Add a book</h2>
      <label>
        Working title
        <input name="title" required />
      </label>
      <label>
        Series (blank for standalone)
        <input name="series" />
      </label>
      <label>
        Position in series
        <input name="seriesNo" inputMode="numeric" />
      </label>
      <label>
        Stage
        <select name="stage" defaultValue="Inventory">
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Target words
        <input name="targetWords" type="number" min="0" step="1000" />
      </label>
      <label>
        Draft due
        <input name="draftDue" type="date" />
      </label>
      <label>
        Publishing path
        <select name="publishingPath" defaultValue="Self">
          <option>Self</option>
          <option>Traditional</option>
        </select>
      </label>
      <div className="form-actions">
        <button type="submit" className="btn" disabled={busy}>
          Save book
        </button>
        <button type="button" className="btn ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}
