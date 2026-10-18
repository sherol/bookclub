// Sheet layout: one tab per record type (docs/design.md, "Tools").
// The app reads columns by header name, so columns can be reordered in the sheet.

export const STAGES = [
  'Inventory',
  'Outline',
  'Drafting',
  'Revision',
  'Editing',
  'Production',
  'Launch',
  'Backlist',
] as const
export type Stage = (typeof STAGES)[number]

export const STAGE_GATES: Record<Stage, string> = {
  Inventory: 'premise, series fit, rank',
  Outline: 'outline, target words, draft date',
  Drafting: 'full draft',
  Revision: 'revised draft',
  Editing: 'locked text',
  Production: 'proof approved',
  Launch: 'retrospective',
  Backlist: 'sales tracked',
}

// Capacity rule: at most one book in each of these stages.
export const SINGLE_SLOT_STAGES: Stage[] = ['Drafting', 'Revision']

export const TASK_STATUSES = ['Not started', 'In progress', 'Done'] as const
export const PUBLISHING_PATHS = ['Self', 'Traditional'] as const

export const TABS = {
  Dashboard: ['Stage', 'Books'],
  Books: [
    'Book ID',
    'Title',
    'Premise',
    'Series',
    'Series #',
    'Genre',
    'Stage',
    'Target words',
    'Current words',
    'Draft due',
    'Excitement',
    'Readiness',
    'Rank',
    'Target release',
    'Publishing path',
    'Draft link',
  ],
  Series: ['Series ID', 'Name', 'Planned books', 'Reading order', 'Series description'],
  Chapters: ['Book ID', 'Chapter #', 'POV', 'Words', 'Draft status', 'Revision pass'],
  'Story bible': ['Series ID', 'Type', 'Name', 'Description', 'First appearance'],
  Milestones: ['Book ID', 'Milestone', 'Due date', 'Done date', 'Gate criteria'],
  Tasks: ['Task ID', 'Book ID', 'Task', 'Owner', 'Stage', 'Due date', 'Status'],
  Contributors: ['Name', 'Role', 'Rate', 'Contact', 'Book IDs'],
  Sessions: ['Date', 'Book ID', 'Words added', 'Minutes'],
  Club: ['Date', 'Member', 'Book', 'Update', 'Ask', 'Encouragement received'],
} as const satisfies Record<string, readonly string[]>

export type TabName = keyof typeof TABS

// Current words is rolled up from Sessions, never typed by hand.
export const CURRENT_WORDS_FORMULA =
  '=SUMIFS(Sessions!C:C,Sessions!B:B,INDIRECT("A"&ROW()))'

export interface Book {
  row: number
  id: string
  title: string
  series: string
  seriesNo: string
  stage: Stage
  targetWords: number
  currentWords: number
  draftDue: string
  publishingPath: string
}

export interface Session {
  date: string
  bookId: string
  words: number
  minutes: number
}

export interface Task {
  row: number
  id: string
  bookId: string
  task: string
  stage: string
  due: string
  status: string
}

export interface ClubPost {
  date: string
  member: string
  book: string
  update: string
  ask: string
}

export interface Data {
  books: Book[]
  sessions: Session[]
  tasks: Task[]
  club: ClubPost[]
}
