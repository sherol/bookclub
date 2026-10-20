import { describe, expect, it, vi } from 'vitest'
import { TABS } from '../schema'
import { SheetsClient, columnLetter, quoteTab } from './sheets'

type Call = { url: string; method: string; body: any }

function fakeGoogle(handler: (c: Call) => { status?: number; json: unknown }) {
  const calls: Call[] = []
  const fetchImpl = vi.fn(async (url: string, init: RequestInit = {}) => {
    const call = { url: decodeURIComponent(url), method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : null }
    calls.push(call)
    const { status = 200, json } = handler(call)
    return new Response(JSON.stringify(json), { status })
  })
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch }
}

const headerBatch = () => ({ valueRanges: Object.values(TABS).map((h) => ({ values: [[...h]] })) })

describe('helpers', () => {
  it('names columns like Sheets', () => {
    expect(columnLetter(0)).toBe('A')
    expect(columnLetter(25)).toBe('Z')
    expect(columnLetter(26)).toBe('AA')
  })
  it('quotes tab names', () => {
    expect(quoteTab('Story bible')).toBe("'Story bible'")
    expect(quoteTab("Sam's")).toBe("'Sam''s'")
  })
})

describe('SheetsClient.open', () => {
  const isFolderQuery = (c: Call) => c.url.includes("value='folder'")
  const isSheetQuery = (c: Call) => c.url.includes("value='v1'")

  it('reuses the folder and the sheet already in it', async () => {
    const g = fakeGoogle((c) => {
      if (c.method === 'GET' && isFolderQuery(c)) return { json: { files: [{ id: 'fold1' }] } }
      if (c.method === 'GET' && isSheetQuery(c)) return { json: { files: [{ id: 'abc', parents: ['fold1'] }] } }
      return { json: headerBatch() }
    })
    const client = new SheetsClient(async () => 'tok', g.fetchImpl)
    await client.open()
    expect(client.spreadsheetId).toBe('abc')
    expect(client.folderId).toBe('fold1')
    expect(g.calls.filter((c) => c.method !== 'GET')).toHaveLength(0)
  })

  it('moves a sheet made before the folder existed into the folder', async () => {
    const g = fakeGoogle((c) => {
      if (c.method === 'GET' && isFolderQuery(c)) return { json: { files: [] } }
      if (c.method === 'POST' && c.url.includes('drive/v3/files')) return { json: { id: 'fold2' } }
      if (c.method === 'GET' && isSheetQuery(c)) return { json: { files: [{ id: 'abc', parents: ['rootId'] }] } }
      return { json: headerBatch() }
    })
    const client = new SheetsClient(async () => 'tok', g.fetchImpl)
    await client.open()
    const folder = g.calls.find((c) => c.method === 'POST' && c.url.includes('drive/v3/files'))!
    expect(folder.body).toEqual({ name: 'Bookclub', mimeType: 'application/vnd.google-apps.folder', appProperties: { bookclub: 'folder' } })
    const move = g.calls.find((c) => c.method === 'PATCH')!
    expect(move.url).toContain('/drive/v3/files/abc?addParents=fold2')
    expect(move.url).toContain('removeParents=rootId')
    expect(g.calls.some((c) => c.url.endsWith('/v4/spreadsheets'))).toBe(false)
  })

  it('creates the sheet inside the folder with every tab, headers and dropdowns', async () => {
    const tabs = Object.keys(TABS)
    const g = fakeGoogle((c) => {
      if (c.method === 'GET' && isFolderQuery(c)) return { json: { files: [{ id: 'fold1' }] } }
      if (c.method === 'GET' && isSheetQuery(c)) return { json: { files: [] } }
      if (c.url.endsWith('/v4/spreadsheets') && c.method === 'POST')
        return { json: { spreadsheetId: 'new1', sheets: tabs.map((title, i) => ({ properties: { sheetId: i, title } })) } }
      if (c.method === 'GET' && c.url.includes('/drive/v3/files/new1')) return { json: { parents: ['rootId'] } }
      if (c.url.includes('batchGet')) return { json: headerBatch() }
      return { json: {} }
    })
    const client = new SheetsClient(async () => 'tok', g.fetchImpl)
    await client.open()
    expect(client.spreadsheetId).toBe('new1')
    const create = g.calls.find((c) => c.url.endsWith('/v4/spreadsheets'))!
    expect(create.body.sheets.map((s: any) => s.properties.title)).toEqual(tabs)
    const values = g.calls.find((c) => c.url.includes('values:batchUpdate'))!
    expect(values.body.data[1]).toEqual({ range: "'Books'!A1", values: [[...TABS.Books]] })
    const format = g.calls.find((c) => c.url.endsWith(':batchUpdate') && !c.url.includes('values'))!
    expect(format.body.requests[0].setDataValidation.range.startColumnIndex).toBe(TABS.Books.indexOf('Stage'))
    const tag = g.calls.find((c) => c.method === 'PATCH')!
    expect(tag.url).toContain('/drive/v3/files/new1?addParents=fold1')
    expect(tag.url).toContain('removeParents=rootId')
    expect(tag.body).toEqual({ appProperties: { bookclub: 'v1' } })
  })
})

describe('reading and writing', () => {
  async function opened(handler: (c: Call) => { status?: number; json: unknown }) {
    const g = fakeGoogle((c) => {
      if (c.url.includes("value='folder'")) return { json: { files: [{ id: 'fold1' }] } }
      if (c.url.includes('drive/v3')) return { json: { files: [{ id: 'abc', parents: ['fold1'] }] } }
      if (c.url.includes('batchGet') && c.url.includes('!1:1')) return { json: headerBatch() }
      return handler(c)
    })
    const client = new SheetsClient(async () => 'tok', g.fetchImpl)
    await client.open()
    return { client, calls: g.calls }
  }

  it('maps rows by header and skips blank rows', async () => {
    const { client } = await opened(() => ({
      json: { valueRanges: [{ values: [['Date', 'Book ID', 'Words added', 'Minutes'], [46313, 'B1', 500, 30], [], ['', '', '', '']] }] },
    }))
    const tabs = await client.readTabs(['Sessions'])
    expect(tabs.Sessions).toEqual([{ row: 2, values: { Date: 46313, 'Book ID': 'B1', 'Words added': 500, Minutes: 30 } }])
  })

  it('appends in header order, with the word-count formula and typed text kept as text', async () => {
    const { client, calls } = await opened(() => ({ json: {} }))
    await client.append('Books', { 'Book ID': 'B9', Title: '=HYPERLINK("x")', Stage: 'Outline' })
    const call = calls.at(-1)!
    expect(call.url).toContain("/values/'Books':append?valueInputOption=USER_ENTERED")
    const row = call.body.values[0]
    expect(row[TABS.Books.indexOf('Title')]).toBe('\'=HYPERLINK("x")')
    expect(row[TABS.Books.indexOf('Current words')]).toMatch(/^=SUMIFS\(Sessions!C:C/)
    expect(row[TABS.Books.indexOf('Stage')]).toBe('Outline')
  })

  it('updates one cell by header name', async () => {
    const { client, calls } = await opened(() => ({ json: {} }))
    await client.update('Tasks', 5, 'Status', 'Done')
    expect(calls.at(-1)!.url).toContain("/values/'Tasks'!G5?valueInputOption=USER_ENTERED")
    expect(calls.at(-1)!.body).toEqual({ values: [['Done']] })
  })

  it('refreshes the token once on 401', async () => {
    let n = 0
    const getToken = vi.fn(async () => 'tok')
    const g = fakeGoogle(() => (n++ === 0 ? { status: 401, json: {} } : { json: { files: [{ id: 'abc', parents: ['abc'] }], valueRanges: [] } }))
    const client = new SheetsClient(getToken, g.fetchImpl)
    await client.open()
    expect(getToken).toHaveBeenCalledWith(true)
  })
})
