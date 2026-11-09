import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { seed } from './data'
import { checkProject } from './engine'
import type { Asset, Grant, Permission, Project, Rec, Review, Role, State, User } from './types'

const KEY = 'editscope.v2'
export type Perm = 'create_project' | 'upload_asset' | 'decide_rec' | 'review' | 'edit_permission' | 'manage_team'
const RULES: Record<Perm, Role[]> = {
  create_project: ['Admin', 'Editor'], upload_asset: ['Admin', 'Editor'], decide_rec: ['Admin', 'Editor'],
  review: ['Admin', 'Reviewer'], edit_permission: ['Admin', 'Reviewer'], manage_team: ['Admin'],
}
export interface Toast { id: number; text: string; kind: 'ok' | 'err' }
const load = (): State => {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s) } catch { /* storage unavailable: use seed */ }
  return seed()
}
const today = () => new Date().toISOString().slice(0, 10)
let uid = 100
const nid = (p: string) => `${p}${Date.now().toString(36)}${uid++}`

function useStore() {
  const [s, setS] = useState<State>(load)
  const [toasts, setToasts] = useState<Toast[]>([])
  const sRef = useRef(s); sRef.current = s
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ } }, [s])

  const me = s.users.find(u => u.id === s.meId) ?? null
  const can = (p: Perm) => !!me && RULES[p].includes(me.role)
  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random(); setToasts(t => [...t, { id, text, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])
  const upd = (f: (s: State) => State) => setS(f)
  const log = (st: State, action: string, entityType: string, entityId: string): State =>
    ({ ...st, audit: [{ id: nid('l'), userId: st.meId ?? 'system', action, entityType, entityId, ts: new Date().toISOString() }, ...st.audit] })
  const notify = (st: State, kind: State['notices'][0]['kind'], text: string, link: string): State =>
    ({ ...st, notices: [{ id: nid('n'), kind, text, ts: new Date().toISOString(), read: false, link }, ...st.notices] })
  const touch = (p: Project): Project => ({ ...p, updatedAt: today() })
  const mapP = (st: State, id: string, f: (p: Project) => Project): State => ({ ...st, projects: st.projects.map(p => (p.id === id ? touch(f(p)) : p)) })

  const api = {
    s, me, can, toasts, toast, dismiss: (id: number) => setToasts(t => t.filter(x => x.id !== id)),
    ctx: { assets: s.assets, permissions: s.permissions },
    userName: (id: string | null) => s.users.find(u => u.id === id)?.name ?? (id === 'system' ? 'System' : '—'),
    login(email: string, _pw: string): string | null {
      const u = sRef.current.users.find(x => x.email.toLowerCase() === email.toLowerCase())
      if (!u) return 'No account found for that email. Try dana@northstar.studio (demo).'
      upd(st => log({ ...st, meId: u.id }, 'Signed in', 'user', u.id)); return null
    },
    register(name: string, email: string, org: string, orgType: string) {
      const u: User = { id: nid('u'), name, email, role: 'Admin' }
      upd(st => ({ ...st, users: [...st.users, u], meId: u.id, onboarded: false, workspace: { ...st.workspace, name: org, orgType } }))
    },
    setWorkspace: (name: string, orgType: string) => upd(st => log({ ...st, workspace: { ...st.workspace, name, orgType } }, 'Updated workspace settings', 'workspace', st.workspace.id)),
    finishOnboarding: () => upd(st => ({ ...st, onboarded: true })),
    logout: () => upd(st => ({ ...st, meId: null })),
    switchUser: (id: string) => upd(st => ({ ...st, meId: id })),
    reset() { localStorage.removeItem(KEY); setS({ ...seed(), meId: sRef.current.meId }); toast('Demo data restored') },

    createProject(p: Omit<Project, 'id' | 'assets' | 'recStatus' | 'actions' | 'updatedAt' | 'lastChecked' | 'ownerId'>) {
      const id = nid('p')
      upd(st => log({ ...st, projects: [{ ...p, id, ownerId: st.meId!, assets: [], recStatus: {}, actions: [], updatedAt: today(), lastChecked: new Date().toISOString() }, ...st.projects] }, `Created project ${p.name}`, 'project', id))
      return id
    },
    updateProject: (id: string, patch: Partial<Project>) => upd(st => log(mapP(st, id, p => ({ ...p, ...patch })), 'Updated project details', 'project', id)),
    addToProject(pid: string, assetId: string, track: Project['assets'][0]['track'], start: number, len: number, context: string) {
      upd(st => log(mapP(st, pid, p => ({ ...p, assets: [...p.assets, { id: nid('t'), assetId, track, start, len, context }] })), 'Added asset to project', 'project', pid))
    },
    removeFromProject: (pid: string, paId: string) => upd(st => log(mapP(st, pid, p => ({ ...p, assets: p.assets.filter(a => a.id !== paId) })), 'Removed asset from project', 'project', pid)),

    addAsset(a: Omit<Asset, 'id' | 'permissionId' | 'addedAt'>, perm: Partial<Permission>) {
      const id = nid('a'), permId = nid('PERM-')
      const permission: Permission = {
        id: permId, assetId: id, rightsHolder: a.creator, licenseType: 'Unspecified', permittedUses: [], restrictedUses: [], permittedChannels: [], permittedRegions: [],
        commercial: null, expiration: null, attribution: null, approvalRequired: false, restrictions: '', docs: null, verification: 'unverified', reviewerId: null, lastReviewed: null,
        history: [{ at: today(), by: sRef.current.meId!, note: 'Permission record created from upload. Not verified.' }], ...perm,
      }
      upd(st => notify(log({ ...st, assets: [{ ...a, id, permissionId: permId, addedAt: today() }, ...st.assets], permissions: [permission, ...st.permissions] }, `Uploaded asset ${a.name}`, 'asset', id), 'verify', `${a.name} requires verification.`, '/review'))
      return id
    },
    savePermission(id: string, patch: Partial<Permission>, note: string) {
      upd(st => log({ ...st, permissions: st.permissions.map(p => (p.id === id ? { ...p, ...patch, history: [{ at: today(), by: st.meId!, note }, ...p.history] } : p)) }, note, 'permission', id))
    },
    markForVerification(permId: string) {
      const st0 = sRef.current, perm = st0.permissions.find(p => p.id === permId)!
      const pa = st0.projects.find(p => p.assets.some(a => a.assetId === perm.assetId))
      upd(st => {
        const r: Review = { id: nid('r'), assetId: perm.assetId, projectId: pa?.id ?? '', section: perm.docs ? 'verification' : 'clarification', reason: 'Submitted for verification.', missing: perm.docs ? [] : ['License document'], reviewerId: st.users.find(u => u.role === 'Reviewer')?.id ?? st.meId!, createdAt: today(), priority: 'Medium', status: 'open', notes: [] }
        return log({ ...st, reviews: [r, ...st.reviews], permissions: st.permissions.map(p => (p.id === permId ? { ...p, verification: 'pending' } : p)) }, 'Marked for verification', 'permission', permId)
      })
      toast('Sent to the Review Center')
    },

    recheck(pid: string) {
      upd(st => log(notify(mapP(st, pid, p => ({ ...p, lastChecked: new Date().toISOString() })), 'check', `${st.projects.find(p => p.id === pid)!.name} completed a new rights check.`, `/projects/${pid}`), 'Re-ran rights check', 'project', pid))
    },
    decide(pid: string, rec: Rec, decision: 'accepted' | 'rejected' | 'review') {
      const st0 = sRef.current
      const pr = st0.projects.find(p => p.id === pid)!
      const asset = st0.assets.find(a => a.id === rec.assetId)!
      upd(st => {
        let next = mapP(st, pid, p => {
          let q: Project = { ...p, recStatus: { ...p.recStatus, [rec.id]: decision }, actions: [{ id: nid('x'), title: rec.title, assetName: asset.name, status: decision, at: new Date().toISOString(), by: st.meId! }, ...p.actions] }
          if (decision !== 'accepted') return q
          const e = rec.effect
          const pa = q.assets.find(a => a.assetId === rec.assetId)
          if (e.k === 'replace' && e.withId && pa) q = { ...q, assets: q.assets.map(a => (a === pa ? { ...a, assetId: e.withId!, attributionAdded: false, approvalObtained: false } : a)) }
          if (e.k === 'replace' && !e.withId) q = { ...q, recStatus: { ...q.recStatus, [rec.id]: 'review' } }
          if (e.k === 'remove') q = { ...q, assets: q.assets.filter(a => a.assetId !== rec.assetId) }
          if (e.k === 'project') q = { ...q, ...e.patch }
          if (e.k === 'attribution' && pa) q = { ...q, assets: q.assets.map(a => (a === pa ? { ...a, attributionAdded: true } : a)) }
          return { ...q, lastChecked: new Date().toISOString() }
        })
        if (decision === 'review' || (decision === 'accepted' && rec.effect.k === 'review')) {
          const e = rec.effect.k === 'review' ? rec.effect : { section: 'clarification' as const, grant: undefined }
          const r: Review = { id: nid('r'), assetId: rec.assetId, projectId: pid, section: e.section, reason: `${rec.title}: ${rec.reason}`, missing: [], reviewerId: st.users.find(u => u.role === 'Reviewer')?.id ?? st.meId!, createdAt: today(), priority: 'Medium', status: 'open', notes: [], grant: e.grant }
          next = { ...next, reviews: [r, ...next.reviews] }
        }
        next = log(next, `${decision === 'accepted' ? 'Accepted' : decision === 'rejected' ? 'Rejected' : 'Requested review for'} recommendation: ${rec.title} (${asset.name})`, 'recommendation', rec.id)
        if (decision === 'accepted') next = notify(next, 'rec', `Recommendation accepted: ${rec.title} on ${pr.name}.`, `/projects/${pid}`)
        return next
      })
      toast(decision === 'accepted' ? 'Recommendation accepted. Rights check re-run.' : decision === 'rejected' ? 'Recommendation rejected' : 'Sent for human review')
    },

    reopenRec: (pid: string, recId: string) => upd(st => log(mapP(st, pid, p => { const { [recId]: _, ...rest } = p.recStatus; return { ...p, recStatus: rest } }), 'Reopened recommendation', 'recommendation', recId)),

    resolveReview(id: string, action: 'verify' | 'docs' | 'unresolved' | 'reject', note: string) {
      upd(st => {
        const r = st.reviews.find(x => x.id === id)!
        const perm = st.permissions.find(p => p.assetId === r.assetId)
        let next = st
        const entry = note ? [{ at: new Date().toISOString(), by: st.meId!, text: note }] : []
        const status = action === 'verify' ? 'resolved' : action === 'reject' ? 'rejected' : 'unresolved'
        if (action === 'verify' && perm) {
          const g: Grant | undefined = r.grant
          next = { ...next, permissions: next.permissions.map(p => {
            if (p.id !== perm.id) return p
            const q: Permission = { ...p, verification: 'verified', reviewerId: st.meId, lastReviewed: today(), history: [{ at: today(), by: st.meId!, note: g ? `Granted: ${g.kind} ${g.value ?? ''}`.trim() : 'Verified after review.' }, ...p.history] }
            if (g?.kind === 'use') q.permittedUses = [...q.permittedUses, g.value!]
            if (g?.kind === 'channel') q.permittedChannels = [...q.permittedChannels, g.value!]
            if (g?.kind === 'region') q.permittedRegions = [...q.permittedRegions, g.value!]
            if (g?.kind === 'commercial') q.commercial = true
            if (g?.kind === 'expiry') q.expiration = g.value ?? q.expiration
            return q
          }) }
          if (g?.kind === 'approval') next = mapP(next, r.projectId, p => ({ ...p, assets: p.assets.map(a => (a.assetId === r.assetId ? { ...a, approvalObtained: true } : a)) }))
        }
        if (action === 'reject' && perm) next = { ...next, permissions: next.permissions.map(p => (p.id === perm.id ? { ...p, verification: 'rejected' } : p)) }
        next = { ...next, reviews: next.reviews.map(x => (x.id === id ? { ...x, status: action === 'docs' ? 'open' : status, notes: [...x.notes, ...entry, ...(action === 'docs' ? [{ at: new Date().toISOString(), by: st.meId!, text: 'Requested additional documentation.' }] : [])], section: action === 'docs' ? 'clarification' : x.section } : x)) }
        if (action === 'docs') next = notify(next, 'docs', 'A reviewer requested additional documentation.', '/review')
        return log(next, `Review ${id}: ${action}`, 'review', id)
      })
    },

    addNote: (id: string, text: string) => upd(st => log({ ...st, reviews: st.reviews.map(r => (r.id === id ? { ...r, notes: [...r.notes, { at: new Date().toISOString(), by: st.meId!, text }] } : r)) }, 'Added internal note', 'review', id)),

    invite(email: string, role: Role) { upd(st => log({ ...st, users: [...st.users, { id: nid('u'), name: email.split('@')[0], email, role }] }, `Invited ${email} as ${role}`, 'user', email)) },
    setRole: (id: string, role: Role) => upd(st => log({ ...st, users: st.users.map(u => (u.id === id ? { ...u, role } : u)) }, `Changed role to ${role}`, 'user', id)),
    removeUser: (id: string) => upd(st => log({ ...st, users: st.users.filter(u => u.id !== id) }, 'Removed member', 'user', id)),
    setNoticeRead: (id: string | 'all', read = true) => upd(st => ({ ...st, notices: st.notices.map(n => (id === 'all' || n.id === id ? { ...n, read } : n)) })),
  }
  return api
}

type Api = ReturnType<typeof useStore>
const Ctx = createContext<Api>(null as never)
export const Provider = ({ children }: { children: ReactNode }) => { const v = useStore(); return <Ctx.Provider value={v}>{children}</Ctx.Provider> }
export const useApp = () => useContext(Ctx)

/** Derived rights-check result for a project, recomputed whenever data changes. */
export function useCheck(p: Project) {
  const { s } = useApp()
  return useMemo(() => checkProject(p, { assets: s.assets, permissions: s.permissions }), [p, s.assets, s.permissions])
}
