const DAY = 86_400_000
// Google Sheets day 0 is 1899-12-30.
const SHEETS_EPOCH = Date.UTC(1899, 11, 30)

export function todayIso(now = new Date()): string {
  const d = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return d.toISOString().slice(0, 10)
}

/** Normalises a sheet date (serial number, ISO text or other date text) to YYYY-MM-DD. */
export function toIsoDate(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(SHEETS_EPOCH + Math.round(value * DAY)).toISOString().slice(0, 10)
  }
  if (typeof value !== 'string' || value.trim() === '') return ''
  const s = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const t = Date.parse(s)
  return Number.isNaN(t) ? '' : todayIso(new Date(t))
}

export function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY)
}

/** Daily target = remaining words ÷ days left before the draft milestone (docs/design.md). */
export function dailyTarget(targetWords: number, currentWords: number, draftDue: string, today: string): number | null {
  if (!targetWords || !draftDue) return null
  const remaining = Math.max(0, targetWords - currentWords)
  const days = Math.max(1, daysBetween(today, draftDue))
  return Math.ceil(remaining / days)
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const fmt = (n: number) => n.toLocaleString('en-US')
