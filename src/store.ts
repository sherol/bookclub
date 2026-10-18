import { toIsoDate, toNumber, todayIso } from './calc'
import { SheetsClient, type Row } from './google/sheets'
import { STAGES, type Book, type ClubPost, type Data, type Session, type Stage, type Task } from './schema'

export interface NewBook {
  title: string
  series: string
  seriesNo: string
  stage: Stage
  targetWords: number
  draftDue: string
  publishingPath: string
}

export interface CheckIn {
  member: string
  book: string
  update: string
  ask: string
}

/** Everything the screens can read or change. The demo and the Google Sheet share it. */
export interface Store {
  readonly kind: 'demo' | 'sheet'
  readonly sheetUrl?: string
  load(): Promise<Data>
  addBook(book: NewBook): Promise<void>
  setStage(book: Book, stage: Stage): Promise<void>
  logSession(session: Session): Promise<void>
  setTaskStatus(task: Task, status: string): Promise<void>
  postCheckIn(checkIn: CheckIn): Promise<void>
}

const newId = (prefix: string) => `${prefix}${Date.now().toString(36).toUpperCase()}`
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))
const asStage = (v: unknown): Stage => (STAGES as readonly string[]).includes(str(v)) ? (str(v) as Stage) : 'Inventory'

export function rowsToData(tabs: Record<string, Row[]>): Data {
  const books: Book[] = (tabs.Books ?? [])
    .filter((r) => str(r.values['Book ID']))
    .map((r) => ({
      row: r.row,
      id: str(r.values['Book ID']),
      title: str(r.values['Title']) || 'Untitled',
      series: str(r.values['Series']),
      seriesNo: str(r.values['Series #']),
      stage: asStage(r.values['Stage']),
      targetWords: toNumber(r.values['Target words']),
      currentWords: toNumber(r.values['Current words']),
      draftDue: toIsoDate(r.values['Draft due']),
      publishingPath: str(r.values['Publishing path']),
    }))
  const sessions: Session[] = (tabs.Sessions ?? []).map((r) => ({
    date: toIsoDate(r.values['Date']),
    bookId: str(r.values['Book ID']),
    words: toNumber(r.values['Words added']),
    minutes: toNumber(r.values['Minutes']),
  }))
  const tasks: Task[] = (tabs.Tasks ?? []).map((r) => ({
    row: r.row,
    id: str(r.values['Task ID']),
    bookId: str(r.values['Book ID']),
    task: str(r.values['Task']),
    stage: str(r.values['Stage']),
    due: toIsoDate(r.values['Due date']),
    status: str(r.values['Status']) || 'Not started',
  }))
  const club: ClubPost[] = (tabs.Club ?? []).map((r) => ({
    date: toIsoDate(r.values['Date']),
    member: str(r.values['Member']),
    book: str(r.values['Book']),
    update: str(r.values['Update']),
    ask: str(r.values['Ask']),
  }))
  return { books, sessions, tasks, club }
}

export class SheetStore implements Store {
  readonly kind = 'sheet'
  constructor(private client: SheetsClient) {}

  get sheetUrl() {
    return this.client.url
  }

  async load(): Promise<Data> {
    return rowsToData(await this.client.readTabs(['Books', 'Sessions', 'Tasks', 'Club']))
  }

  async addBook(b: NewBook): Promise<void> {
    await this.client.append('Books', {
      'Book ID': newId('B'),
      Title: b.title,
      Series: b.series,
      'Series #': b.seriesNo,
      Stage: b.stage,
      'Target words': b.targetWords || '',
      'Draft due': b.draftDue,
      'Publishing path': b.publishingPath,
    })
  }

  async setStage(book: Book, stage: Stage): Promise<void> {
    await this.client.update('Books', book.row, 'Stage', stage)
  }

  async logSession(s: Session): Promise<void> {
    await this.client.append('Sessions', {
      Date: s.date,
      'Book ID': s.bookId,
      'Words added': s.words,
      Minutes: s.minutes,
    })
  }

  async setTaskStatus(task: Task, status: string): Promise<void> {
    await this.client.update('Tasks', task.row, 'Status', status)
  }

  async postCheckIn(c: CheckIn): Promise<void> {
    await this.client.append('Club', {
      Date: todayIso(),
      Member: c.member,
      Book: c.book,
      Update: c.update,
      Ask: c.ask,
    })
  }
}

/** Sample data kept in memory, so the app can be tried without signing in. */
export class DemoStore implements Store {
  readonly kind = 'demo'
  private data: Data

  constructor(today = todayIso()) {
    const plus = (days: number) => todayIso(new Date(Date.parse(`${today}T12:00:00`) + days * 86_400_000))
    const book = (row: number, id: string, title: string, series: string, seriesNo: string, stage: Stage, targetWords: number, draftDue: string): Book => ({
      row, id, title, series, seriesNo, stage, targetWords, currentWords: 0, draftDue, publishingPath: 'Self',
    })
    this.data = {
      books: [
        book(2, 'B1', '[Working title A]', '[Series]', '1', 'Revision', 85000, ''),
        book(3, 'B2', '[Working title B]', '[Series]', '2', 'Drafting', 85000, plus(62)),
        book(4, 'B3', '[Working title C]', '[Series]', '3', 'Outline', 90000, ''),
        book(5, 'B4', '[Working title D]', '', '', 'Production', 70000, ''),
        book(6, 'B5', '[Idea: lighthouse novella]', '', '', 'Inventory', 30000, ''),
      ],
      sessions: [
        { date: plus(-20), bookId: 'B2', words: 40880, minutes: 3800 },
        { date: today, bookId: 'B2', words: 420, minutes: 40 },
      ],
      tasks: [
        { row: 2, id: 'T1', bookId: 'B1', task: 'Apply line edits, ch. 9–14', stage: 'Revision', due: plus(-2), status: 'In progress' },
        { row: 3, id: 'T2', bookId: 'B4', task: 'Approve ISBN list for 3 formats', stage: 'Production', due: plus(2), status: 'Not started' },
        { row: 4, id: 'T3', bookId: 'B2', task: 'Post weekly club check-in', stage: 'Drafting', due: plus(0), status: 'Done' },
      ],
      club: [
        { date: plus(-1), member: '[Member 1]', book: '[Their book] · Revision', update: 'Win: finished pass 2', ask: 'Does chapter 2’s opening hook you? One page.' },
        { date: plus(-2), member: '[Member 2]', book: '[Their book] · Drafting', update: 'Win: 3 sessions in a row', ask: 'A nudge on Thursday.' },
      ],
    }
  }

  private rollUp(): void {
    for (const b of this.data.books) {
      b.currentWords = this.data.sessions.filter((s) => s.bookId === b.id).reduce((n, s) => n + s.words, 0)
    }
  }

  async load(): Promise<Data> {
    this.rollUp()
    return structuredClone(this.data)
  }

  async addBook(b: NewBook): Promise<void> {
    this.data.books.push({ ...b, row: this.data.books.length + 2, id: newId('B'), currentWords: 0 })
  }

  async setStage(book: Book, stage: Stage): Promise<void> {
    const found = this.data.books.find((b) => b.id === book.id)
    if (found) found.stage = stage
  }

  async logSession(s: Session): Promise<void> {
    this.data.sessions.push(s)
  }

  async setTaskStatus(task: Task, status: string): Promise<void> {
    const found = this.data.tasks.find((t) => t.id === task.id)
    if (found) found.status = status
  }

  async postCheckIn(c: CheckIn): Promise<void> {
    this.data.club.unshift({ date: todayIso(), ...c })
  }
}
