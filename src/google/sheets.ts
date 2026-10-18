import { CURRENT_WORDS_FORMULA, STAGES, TABS, TASK_STATUSES, PUBLISHING_PATHS, type TabName } from '../schema'

const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE = 'https://www.googleapis.com/drive/v3/files'
// Marks the sheet this app created, so it can be found again with the drive.file scope.
const APP_PROPERTY = { key: 'bookclub', value: 'v1' }

export class AuthError extends Error {}

export type Cell = string | number | boolean | null
export interface Row {
  row: number // 1-based sheet row
  values: Record<string, Cell>
}

export type GetToken = (forceRefresh?: boolean) => Promise<string>

export function quoteTab(tab: string): string {
  return `'${tab.replace(/'/g, "''")}'`
}

export function columnLetter(index: number): string {
  let n = index + 1
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

// USER_ENTERED turns text starting with = into a formula; keep typed text as text.
export function asEntered(value: Cell): Cell {
  return typeof value === 'string' && /^[=+\-@]/.test(value) ? `'${value}` : value
}

export class SheetsClient {
  spreadsheetId = ''
  private headers: Partial<Record<TabName, string[]>> = {}

  constructor(private getToken: GetToken, private fetchImpl: typeof fetch = fetch.bind(globalThis)) {}

  private async request<T>(url: string, init: RequestInit = {}, retried = false): Promise<T> {
    const token = await this.getToken(retried)
    const res = await this.fetchImpl(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
    })
    if (res.status === 401) {
      if (!retried) return this.request(url, init, true)
      throw new AuthError('Google sign-in expired')
    }
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Google API ${res.status}: ${body.slice(0, 300)}`)
    }
    return (await res.json()) as T
  }

  get url(): string {
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`
  }

  /** Finds the Bookclub sheet this app created earlier, or creates it with every tab set up. */
  async open(): Promise<void> {
    const q = `appProperties has { key='${APP_PROPERTY.key}' and value='${APP_PROPERTY.value}' } and trashed=false`
    const found = await this.request<{ files: { id: string }[] }>(
      `${DRIVE}?q=${encodeURIComponent(q)}&fields=files(id)&orderBy=createdTime`,
    )
    if (found.files.length > 0) {
      this.spreadsheetId = found.files[0].id
    } else {
      await this.create()
    }
    await this.loadHeaders()
  }

  private async create(): Promise<void> {
    const tabs = Object.keys(TABS) as TabName[]
    const created = await this.request<{ spreadsheetId: string; sheets: { properties: { sheetId: number; title: string } }[] }>(
      SHEETS,
      {
        method: 'POST',
        body: JSON.stringify({
          properties: { title: 'Bookclub' },
          sheets: tabs.map((title) => ({ properties: { title, gridProperties: { frozenRowCount: 1 } } })),
        }),
      },
    )
    this.spreadsheetId = created.spreadsheetId
    const sheetId = (title: string) => created.sheets.find((s) => s.properties.title === title)!.properties.sheetId

    await this.request(`${SHEETS}/${this.spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          ...tabs.map((tab) => ({ range: `${quoteTab(tab)}!A1`, values: [TABS[tab]] })),
          {
            range: `${quoteTab('Dashboard')}!A2`,
            values: STAGES.map((s, i) => [s, `=COUNTIF(Books!G:G,A${i + 2})`]),
          },
        ],
      }),
    })

    const dropdown = (tab: TabName, header: string, options: readonly string[]) => ({
      setDataValidation: {
        range: {
          sheetId: sheetId(tab),
          startRowIndex: 1,
          startColumnIndex: (TABS[tab] as readonly string[]).indexOf(header),
          endColumnIndex: (TABS[tab] as readonly string[]).indexOf(header) + 1,
        },
        rule: {
          condition: { type: 'ONE_OF_LIST', values: options.map((v) => ({ userEnteredValue: v })) },
          showCustomUi: true,
          strict: true,
        },
      },
    })
    await this.request(`${SHEETS}/${this.spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          dropdown('Books', 'Stage', STAGES),
          dropdown('Books', 'Publishing path', PUBLISHING_PATHS),
          dropdown('Tasks', 'Status', TASK_STATUSES),
          dropdown('Tasks', 'Stage', STAGES),
          ...tabs.map((tab) => ({
            repeatCell: {
              range: { sheetId: sheetId(tab), startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: 'userEnteredFormat.textFormat.bold',
            },
          })),
        ],
      }),
    })

    await this.request(`${DRIVE}/${this.spreadsheetId}`, {
      method: 'PATCH',
      body: JSON.stringify({ appProperties: { [APP_PROPERTY.key]: APP_PROPERTY.value } }),
    })
  }

  private async loadHeaders(): Promise<void> {
    const tabs = Object.keys(TABS) as TabName[]
    const ranges = tabs.map((t) => `ranges=${encodeURIComponent(`${quoteTab(t)}!1:1`)}`).join('&')
    const res = await this.request<{ valueRanges: { values?: string[][] }[] }>(
      `${SHEETS}/${this.spreadsheetId}/values:batchGet?${ranges}`,
    )
    tabs.forEach((tab, i) => {
      this.headers[tab] = res.valueRanges[i]?.values?.[0] ?? [...TABS[tab]]
    })
  }

  private headerOf(tab: TabName): string[] {
    return this.headers[tab] ?? [...TABS[tab]]
  }

  /** Reads several tabs in one call. Dates come back as serial numbers (see toIsoDate). */
  async readTabs(tabs: TabName[]): Promise<Record<string, Row[]>> {
    const ranges = tabs.map((t) => `ranges=${encodeURIComponent(quoteTab(t))}`).join('&')
    const res = await this.request<{ valueRanges: { values?: Cell[][] }[] }>(
      `${SHEETS}/${this.spreadsheetId}/values:batchGet?${ranges}` +
        '&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER',
    )
    const out: Record<string, Row[]> = {}
    tabs.forEach((tab, i) => {
      const [header = [], ...rows] = res.valueRanges[i]?.values ?? []
      this.headers[tab] = header.map(String)
      out[tab] = rows
        .map((cells, r) => ({
          row: r + 2,
          values: Object.fromEntries(header.map((h, c) => [String(h), cells[c] ?? null])),
        }))
        .filter((row) => Object.values(row.values).some((v) => v !== null && v !== ''))
    })
    return out
  }

  async append(tab: TabName, values: Record<string, Cell>): Promise<void> {
    const header = this.headerOf(tab)
    const row = header.map((h) => (h === 'Current words' && tab === 'Books' ? CURRENT_WORDS_FORMULA : asEntered(values[h] ?? '')))
    await this.request(
      `${SHEETS}/${this.spreadsheetId}/values/${encodeURIComponent(quoteTab(tab))}:append` +
        '?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS',
      { method: 'POST', body: JSON.stringify({ values: [row] }) },
    )
  }

  async update(tab: TabName, row: number, header: string, value: Cell): Promise<void> {
    const col = this.headerOf(tab).indexOf(header)
    if (col < 0) throw new Error(`Column "${header}" not found in the ${tab} tab`)
    const range = `${quoteTab(tab)}!${columnLetter(col)}${row}`
    await this.request(
      `${SHEETS}/${this.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      { method: 'PUT', body: JSON.stringify({ values: [[asEntered(value)]] }) },
    )
  }
}
