import { useState } from 'react'
import { useApp } from '../store'
import { Avatar, Confirm, Field, Modal, PageHeader, Tabs, fmtDate } from '../ui'
import type { Role } from '../types'

const ROLES: Role[] = ['Admin', 'Editor', 'Reviewer', 'Viewer']
const DESC: Record<Role, string> = { Admin: 'Full workspace access, members, permissions, settings.', Editor: 'Create projects, upload assets, act on recommendations.', Reviewer: 'Review records, verify documentation, resolve requests.', Viewer: 'Read-only access.' }

export default function Team() {
  const { s, me, can, invite, setRole, removeUser, setWorkspace, reset, toast, userName } = useApp()
  const [tab, setTab] = useState('Members'), [inv, setInv] = useState(false), [email, setEmail] = useState(''), [role, setR] = useState<Role>('Editor'), [err, setErr] = useState(''), [del, setDel] = useState<string | null>(null)
  const [ws, setWs] = useState(s.workspace.name), [ot, setOt] = useState(s.workspace.orgType)
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem('editscope.prefs') ?? '{}') } catch { return {} } })
  const admin = can('manage_team')
  const send = () => { if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email.'); if (s.users.some(u => u.email === email)) return setErr('That person is already a member.'); invite(email, role); toast(`Invited ${email}`); setInv(false); setEmail(''); setErr('') }
  const tog = (k: string) => { const n = { ...prefs, [k]: !(prefs[k] ?? true) }; setPrefs(n); try { localStorage.setItem('editscope.prefs', JSON.stringify(n)) } catch { /* ignore */ } }
  return (
    <div className="space-y-6">
      <PageHeader title="Team & settings" sub="Manage members, workspace details, and preferences." />
      <Tabs tabs={['Members', 'Workspace', 'Notifications', 'Security', 'Subscription', 'Audit log']} value={tab} onChange={setTab} />
      {tab === 'Members' && <section className="card scroll-hint overflow-x-auto"><div className="card-head"><h2 className="card-title">{s.users.length} members</h2><button className="btn btn-primary h-8" disabled={!admin} title={admin ? '' : 'Admins only'} onClick={() => setInv(true)}>Invite member</button></div>
        <table className="w-full min-w-[560px]"><thead><tr>{['Member', 'Email', 'Role', ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{s.users.map(u => <tr key={u.id}><td className="td"><span className="flex items-center gap-2"><Avatar name={u.name} size={26} />{u.name}{u.id === me!.id && <span className="text-xs text-muted">(you)</span>}</span></td><td className="td text-muted">{u.email}</td>
          <td className="td"><select className="input h-8 w-32" aria-label={`Role for ${u.name}`} disabled={!admin || u.id === me!.id} value={u.role} onChange={e => { setRole(u.id, e.target.value as Role); toast('Role updated') }}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></td>
          <td className="td"><button className="btn btn-danger h-8" disabled={!admin || u.id === me!.id} onClick={() => setDel(u.id)}>Remove</button></td></tr>)}</tbody></table>
        <ul className="p-5 text-xs text-muted grid sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-line bg-bg/50">{ROLES.map(r => <li key={r}><b className="text-navy">{r}:</b> {DESC[r]}</li>)}</ul></section>}
      {tab === 'Workspace' && <section className="card p-6 max-w-xl space-y-4"><Field label="Workspace name"><input className="input" disabled={!admin} value={ws} onChange={e => setWs(e.target.value)} /></Field>
        <Field label="Organization type"><select className="input" disabled={!admin} value={ot} onChange={e => setOt(e.target.value)}>{['Creative Agency', 'Marketing Team', 'Production House', 'Brand Management', 'Independent Creator', 'Other'].map(o => <option key={o}>{o}</option>)}</select></Field>
        <div className="flex flex-wrap gap-2 pt-1"><button className="btn btn-primary" disabled={!admin || !ws.trim()} onClick={() => { setWorkspace(ws, ot); toast('Workspace saved') }}>Save</button><button className="btn" disabled={!admin} onClick={reset}>Restore demo data</button></div>
        <p className="text-xs text-muted">Data is stored in this browser (demonstration data). Restoring resets all projects, assets and reviews.</p></section>}
      {tab === 'Notifications' && <section className="card max-w-xl divide-y divide-line">{[['conflict', 'Permission conflicts'], ['verify', 'Verification requests'], ['expiry', 'License expiry warnings'], ['rec', 'Recommendation activity']].map(([k, l]) => <label key={k} className="flex items-center justify-between px-6 py-4 text-sm cursor-pointer hover:bg-bg/50"><span>{l}</span><input type="checkbox" checked={prefs[k] ?? true} onChange={() => tog(k)} /></label>)}</section>}
      {tab === 'Security' && <section className="card p-6 max-w-xl text-sm space-y-3 leading-relaxed"><p>Role-based access is enforced in the interface for all screens. Only Reviewers and Admins can change verification status.</p><p className="text-muted">Two-factor authentication, SSO and server-side row-level security are not part of this demo build.</p></section>}
      {tab === 'Subscription' && <section className="card p-6 max-w-xl text-sm space-y-1.5"><p className="font-semibold">Demo workspace</p><p className="text-muted">No billing is connected. Plans and invoices are not simulated.</p></section>}
      {tab === 'Audit log' && <section className="card scroll-hint overflow-x-auto"><table className="w-full min-w-[560px]"><thead><tr>{['When', 'User', 'Action', 'Entity'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{s.audit.slice(0, 50).map(a => <tr key={a.id}><td className="td text-muted">{fmtDate(a.ts)}</td><td className="td">{userName(a.userId)}</td><td className="td">{a.action}</td><td className="td text-muted">{a.entityType} {a.entityId}</td></tr>)}</tbody></table></section>}
      {inv && <Modal title="Invite member" onClose={() => setInv(false)} footer={<><button className="btn" onClick={() => setInv(false)}>Cancel</button><button className="btn btn-primary" onClick={send}>Send invite</button></>}><div className="space-y-4"><Field label="Email" error={err}><input className="input" value={email} onChange={e => setEmail(e.target.value)} /></Field><Field label="Role"><select className="input" value={role} onChange={e => setR(e.target.value as Role)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></Field><p className="text-xs text-muted">No email is sent in this demo; the member is added to the list.</p></div></Modal>}
      {del && <Confirm title="Remove member?" text="They will lose access to this workspace." yes="Remove" onNo={() => setDel(null)} onYes={() => { removeUser(del); setDel(null); toast('Member removed') }} />}
    </div>
  )
}
