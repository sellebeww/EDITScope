import { describe, expect, it } from 'vitest'
import { seed } from './data'
import { checkProject, recommend } from './engine'

const s = seed()
const ctx = { assets: s.assets, permissions: s.permissions }
const p1 = s.projects[0]
const status = (id: string) => checkProject(p1, ctx).rows.find(r => r.asset.id === id)!.status

describe('rights engine', () => {
  it('classifies the Summer Campaign sample assets', () => {
    expect(status('a10')).toBe('conflict') // paid ads excluded
    expect(status('a07')).toBe('conflict') // Instagram/TikTok not allowed
    expect(status('a05')).toBe('unverified') // no docs
    expect(status('a19')).toBe('conditional') // brand approval
    expect(status('a01')).toBe('verified')
  })
  it('never marks missing info as allowed or prohibited', () => {
    const f = checkProject(p1, ctx).rows.find(r => r.asset.id === 'a05')!.findings
    expect(f.map(x => x.type)).toEqual(['unverified'])
    expect(f[0].explanation).toContain('Human verification required')
  })
  it('flags expired licenses', () => {
    const p2 = s.projects[1]
    expect(checkProject(p2, ctx).rows.find(r => r.asset.id === 'a06')!.status).toBe('conflict')
  })
  it('accepting change-usage re-runs checks and may leave other conflicts', () => {
    const f = checkProject(p1, ctx).findings.find(x => x.assetId === 'a10')!
    const rec = recommend(f, p1, ctx).find(r => r.action === 'change_usage')!
    if (rec.effect.k !== 'project') throw new Error('expected project effect')
    const next = { ...p1, ...rec.effect.patch }
    const res = checkProject(next, ctx)
    expect(res.rows.find(r => r.asset.id === 'a10')!.status).not.toBe('conflict')
    expect(res.overall).not.toBe('verified') // other assets still block
  })
})
