import { describe, expect, it } from 'vitest'
import { seed } from './data'
import { checkProject, libraryStatus, recommend } from './engine'

const s = seed()
const ctx = { assets: s.assets, permissions: s.permissions }
const p = (id: string) => s.projects.find(x => x.id === id)!
const row = (pid: string, aid: string) => checkProject(p(pid), ctx).rows.find(r => r.asset.id === aid)!

describe('rights engine: more rules', () => {
  it('flags license that expires before project end (Nordic Sans in Brand Refresh)', () => {
    expect(row('p3', 'a17').findings.map(f => f.type)).toContain('expired')
  })
  it('flags non-commercial license on commercial project', () => {
    expect(row('p3', 'a15').findings.map(f => f.type)).toContain('commercial')
  })
  it('flags region outside licensed territory', () => {
    expect(row('p2', 'a02').findings.map(f => f.type)).toContain('region')
  })
  it('pending verification is unverified, never allowed or blocked', () => {
    const r = row('p3', 'a16')
    expect(r.status).toBe('unverified')
    expect(r.findings).toHaveLength(1)
  })
  it('attribution is conditional until added', () => {
    expect(row('p2', 'a11').status).toBe('conditional')
    const q = { ...p('p2'), assets: p('p2').assets.map(a => (a.assetId === 'a11' ? { ...a, attributionAdded: true } : a)) }
    expect(checkProject(q, ctx).rows.find(r => r.asset.id === 'a11')!.status).toBe('verified')
  })
  it('every finding yields at least one recommendation, and none are no-op project edits', () => {
    for (const proj of s.projects)
      for (const f of checkProject(proj, ctx).findings) {
        const recs = recommend(f, proj, ctx)
        expect(recs.length).toBeGreaterThan(0)
        for (const r of recs) if (r.effect.k === 'project') expect(JSON.stringify({ ...proj, ...r.effect.patch })).not.toBe(JSON.stringify(proj))
      }
  })
  it('library status follows the five sample scenarios', () => {
    const st = (n: string) => libraryStatus(s.permissions.find(x => x.id === `PERM-0${n}`), '2026-11-09')
    expect([st('10'), st('01'), st('13'), st('06'), st('19')]).toEqual(['conditional', 'verified', 'unverified', 'conflict', 'conditional'])
  })
})
