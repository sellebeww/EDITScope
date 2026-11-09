import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useApp } from '../store'
import { CHANNELS, REGIONS, USAGES } from '../data'
import { Chips, DL, Empty, Field, Modal, PageHeader, SearchBox, Section, StatusBadge, VerBadge, fmtDate } from '../ui'
import { libraryStatus } from '../engine'
import type { Permission } from '../types'

export function Permissions() {
  const { s } = useApp()
  const [q, setQ] = useState(''), [v, setV] = useState('all')
  const rows = s.permissions.filter(p => { const a = s.assets.find(x => x.id === p.assetId); return (!q || `${a?.name} ${p.rightsHolder} ${p.licenseType}`.toLowerCase().includes(q.toLowerCase())) && (v === 'all' || p.verification === v) })
  return (
    <div className="space-y-6">
      <PageHeader title="Rights & permissions" sub="Recorded licenses, restrictions, and verification status for every asset." />
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search permissions" label="Search permissions" className="w-full sm:w-72" />
        <select className="input w-full sm:w-48" aria-label="Verification" value={v} onChange={e => setV(e.target.value)}><option value="all">All verification</option>{['verified', 'pending', 'unverified', 'rejected'].map(x => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}</select></div>
      <div className="card scroll-hint overflow-x-auto">{rows.length ? <table className="w-full min-w-[900px] [&_.th]:px-3.5 [&_.td]:px-3.5"><thead><tr>{['Asset', 'Rights holder', 'License', 'Allowed usage', 'Restrictions', 'Valid until', 'Verification', 'Reviewed', ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{rows.map(p => <tr key={p.id} className="hover:bg-bg/60"><td className="td font-medium min-w-32">{s.assets.find(a => a.id === p.assetId)?.name}</td><td className="td">{p.rightsHolder}</td><td className="td">{p.licenseType}</td>
          <td className="td min-w-40 max-w-56"><div className="line-clamp-2" title={p.permittedUses.join(', ')}>{p.permittedUses.join(', ') || <span className="text-muted">Not recorded</span>}</div></td>
          <td className="td min-w-40 max-w-56"><div className="line-clamp-2" title={[...p.restrictedUses, p.restrictions].filter(Boolean).join('. ')}>{[...p.restrictedUses, p.restrictions].filter(Boolean).join('. ') || '—'}</div></td>
          <td className="td">{fmtDate(p.expiration)}</td><td className="td"><VerBadge v={p.verification} /></td><td className="td text-muted">{fmtDate(p.lastReviewed)}</td><td className="td"><Link to={`/permissions/${p.id}`} className="btn h-8">Open</Link></td></tr>)}</tbody></table>
        : <Empty title="No permission records" text="Nothing matches your search." />}</div>
    </div>
  )
}

export function PermissionDetail() {
  const { id } = useParams()
  const { s, me, can, savePermission, markForVerification, toast, userName } = useApp()
  const p = s.permissions.find(x => x.id === id)
  const [edit, setEdit] = useState(false), [doc, setDoc] = useState(false)
  if (!p) return <Navigate to="/permissions" />
  const a = s.assets.find(x => x.id === p.assetId)!
  const used = s.projects.filter(pr => pr.assets.some(x => x.assetId === a.id))
  const rows = ([['Rights holder', p.rightsHolder], ['License type', p.licenseType], ['Permitted activities', p.permittedUses.join(', ') || 'Not recorded'], ['Prohibited activities', p.restrictedUses.join(', ') || 'None recorded'],
    ['Distribution', p.permittedChannels.join(', ') || 'Not recorded'], ['Geographic', p.permittedRegions.join(', ') || 'Not recorded'], ['Commercial use', p.commercial === null ? 'Not recorded' : p.commercial ? 'Permitted' : 'Not permitted'],
    ['Expiration', fmtDate(p.expiration)], ['Attribution', p.attribution ?? 'Not required'], ['Other restrictions', p.restrictions || '—'], ['License document', p.docs ?? 'Missing']] as const)
  return (
    <div className="space-y-6">
      <div className="card p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-5"><div className="min-w-0"><h1 className="page-title">{a.name}</h1><p className="text-sm text-muted mt-1.5">{p.id} · {a.type} · {a.source}</p><div className="flex flex-wrap gap-2 mt-4"><VerBadge v={p.verification} /><StatusBadge s={libraryStatus(p)} /></div></div>
        <div className="flex gap-2 flex-wrap items-start">
          <button className="btn" disabled={!can('edit_permission')} title={can('edit_permission') ? '' : 'Only reviewers and admins can edit permissions'} onClick={() => setEdit(true)}>Edit permission</button>
          <button className="btn" disabled={!can('upload_asset')} onClick={() => setDoc(true)}>Upload updated document</button>
          <button className="btn btn-primary" disabled={p.verification === 'pending' || !can('upload_asset')} onClick={() => markForVerification(p.id)}>{p.verification === 'pending' ? 'Awaiting verification' : 'Mark for verification'}</button></div></div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Section title="Permission summary" className="lg:col-span-2"><DL rows={rows} />
          {!p.docs && <p className="mt-5 text-sm text-bad rounded-xl bg-bad/5 border border-bad/20 px-4 py-3">Insufficient permission information. Human verification required.</p>}</Section>
        <div className="space-y-6">
          <Section title="Reviewer"><p className="text-sm font-medium">{p.reviewerId ? userName(p.reviewerId) : 'Not yet reviewed'}</p><p className="meta mt-1">Last reviewed {fmtDate(p.lastReviewed)}</p></Section>
          <Section title="Associated projects">{used.length ? <ul className="text-sm space-y-2">{used.map(u => <li key={u.id}><Link className="text-info hover:underline" to={`/projects/${u.id}`}>{u.name}</Link></li>)}</ul> : <p className="text-sm text-muted">Not used in any project.</p>}</Section>
          <Section title="Verification history">{p.history.length ? <ul className="text-sm space-y-4">{p.history.map((h, i) => <li key={i}>{h.note}<p className="meta mt-0.5">{userName(h.by)} · {fmtDate(h.at)}</p></li>)}</ul> : <p className="text-sm text-muted">No history.</p>}</Section></div></div>
      {edit && <EditPerm p={p} onClose={() => setEdit(false)} />}
      {doc && <DocModal p={p} onClose={() => setDoc(false)} onSave={n => { savePermission(p.id, { docs: n, verification: p.verification === 'verified' ? 'pending' : p.verification }, `Uploaded document ${n}. Verification must be confirmed by a reviewer.`); toast('Document attached. It is not verified until a reviewer confirms it.'); setDoc(false) }} />}
    </div>
  )
}
function DocModal({ onClose, onSave }: { p: Permission; onClose: () => void; onSave: (n: string) => void }) {
  const [n, setN] = useState(''), [e, setE] = useState('')
  return <Modal title="Upload updated document" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => (n ? onSave(n) : setE('Choose a document.'))}>Attach</button></>}>
    <Field label="License document" error={e}><input type="file" accept=".pdf,.txt,.png,.jpg" onChange={x => setN(x.target.files?.[0]?.name ?? '')} /></Field><p className="text-xs text-muted mt-2">Attaching a document does not verify the permission.</p></Modal>
}
function EditPerm({ p, onClose }: { p: Permission; onClose: () => void }) {
  const { me, savePermission, toast } = useApp()
  const [f, setF] = useState({ rightsHolder: p.rightsHolder, licenseType: p.licenseType, permittedUses: p.permittedUses, permittedChannels: p.permittedChannels, permittedRegions: p.permittedRegions, commercial: p.commercial, expiration: p.expiration ?? '', attribution: p.attribution ?? '', restrictions: p.restrictions, approvalRequired: p.approvalRequired, verification: p.verification }), [err, setErr] = useState('')
  const save = () => {
    if (!f.rightsHolder.trim()) return setErr('Rights holder is required.')
    if (f.verification === 'verified' && !p.docs) return setErr('Cannot mark as verified without a license document.')
    savePermission(p.id, { ...f, expiration: f.expiration || null, attribution: f.attribution || null, reviewerId: f.verification === 'verified' ? me!.id : p.reviewerId, lastReviewed: new Date().toISOString().slice(0, 10) }, 'Permission record edited'); toast('Permission saved'); onClose()
  }
  return <Modal title="Edit permission" wide onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
    <div className="space-y-4">{err && <p role="alert" className="text-sm text-bad">{err}</p>}
      <div className="grid sm:grid-cols-2 gap-4"><Field label="Rights holder"><input className="input" value={f.rightsHolder} onChange={e => setF({ ...f, rightsHolder: e.target.value })} /></Field><Field label="License type"><input className="input" value={f.licenseType} onChange={e => setF({ ...f, licenseType: e.target.value })} /></Field></div>
      <Field label="Permitted usage"><Chips options={USAGES} value={f.permittedUses} onChange={v => setF({ ...f, permittedUses: v })} /></Field>
      <Field label="Permitted channels"><Chips options={CHANNELS} value={f.permittedChannels} onChange={v => setF({ ...f, permittedChannels: v })} /></Field>
      <Field label="Permitted regions"><Chips options={REGIONS} value={f.permittedRegions} onChange={v => setF({ ...f, permittedRegions: v })} /></Field>
      <div className="grid sm:grid-cols-3 gap-4"><Field label="Commercial use"><select className="input" value={String(f.commercial)} onChange={e => setF({ ...f, commercial: e.target.value === 'null' ? null : e.target.value === 'true' })}><option value="null">Unknown</option><option value="true">Permitted</option><option value="false">Not permitted</option></select></Field>
        <Field label="Expiration"><input type="date" className="input" value={f.expiration} onChange={e => setF({ ...f, expiration: e.target.value })} /></Field>
        <Field label="Verification status"><select className="input" value={f.verification} onChange={e => setF({ ...f, verification: e.target.value as Permission['verification'] })}>{['verified', 'pending', 'unverified', 'rejected'].map(x => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}</select></Field></div>
      <Field label="Attribution requirement"><input className="input" value={f.attribution} onChange={e => setF({ ...f, attribution: e.target.value })} /></Field>
      <Field label="Other restrictions"><textarea className="input h-16 py-2" value={f.restrictions} onChange={e => setF({ ...f, restrictions: e.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.approvalRequired} onChange={e => setF({ ...f, approvalRequired: e.target.checked })} />Rights-holder approval required before use</label></div></Modal>
}
