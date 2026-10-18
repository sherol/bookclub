import { describe, expect, it } from 'vitest'
import { dailyTarget, toIsoDate } from './calc'
import { rowsToData } from './store'

describe('dailyTarget', () => {
  it('matches the design doc example', () => {
    // 85,000-word novel at 20,000 words with 65 days left → 1,000 a day
    expect(dailyTarget(85000, 20000, '2026-12-22', '2026-10-18')).toBe(1000)
  })
  it('is null without a target or due date', () => {
    expect(dailyTarget(0, 0, '2026-12-22', '2026-10-18')).toBeNull()
    expect(dailyTarget(85000, 0, '', '2026-10-18')).toBeNull()
  })
  it('asks for everything left when the due date has passed', () => {
    expect(dailyTarget(1000, 400, '2026-10-01', '2026-10-18')).toBe(600)
  })
})

describe('toIsoDate', () => {
  it('reads Sheets serial numbers', () => {
    expect(toIsoDate(46313)).toBe('2026-10-18')
  })
  it('keeps ISO text and ignores blanks', () => {
    expect(toIsoDate('2026-12-19')).toBe('2026-12-19')
    expect(toIsoDate('')).toBe('')
    expect(toIsoDate(null)).toBe('')
  })
})

describe('rowsToData', () => {
  it('turns sheet rows into books with safe defaults', () => {
    const data = rowsToData({
      Books: [
        { row: 2, values: { 'Book ID': 'B1', Title: 'Tide', Stage: 'Drafting', 'Target words': 80000, 'Current words': 1200, 'Draft due': 46375 } },
        { row: 3, values: { 'Book ID': 'B2', Title: '', Stage: 'Nonsense' } },
        { row: 4, values: { Title: 'no id' } },
      ],
    })
    expect(data.books).toHaveLength(2)
    expect(data.books[0]).toMatchObject({ row: 2, id: 'B1', stage: 'Drafting', currentWords: 1200, draftDue: '2026-12-19' })
    expect(data.books[1]).toMatchObject({ title: 'Untitled', stage: 'Inventory' })
  })
})
