import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store'
import { Empty, Field, Modal, PageHeader, Section, Tabs, fmtDate } from '../ui'
import type { Review, ReviewSection } from '../types'

const SEC: { id: ReviewSection; label: string }[] = [{ id: 'verification', label: 'Needs Verification' }, { id: 'clarification', label: 'Permission Clarification' }, { id: 'approval', label: 'Awaiting Approval' }]
const pri = { High: 'text-bad bg-bad/10 border-bad/20', Medium: 'text-[#9a6a12] bg-warn/15 border-warn/30', Low: 'text-slate2 bg-na/10 border-na/25' }

export default function ReviewCenter() {
  const { s, can, resolveReview, addNote, toast, userName } = useApp()
  const [tab, setTab] = useState(SEC[0].label), [act, setAct] = useState<{ r: Review; kind: 'verify' | 'docs' | 'unresolved' | 'reject' | 'note' } | null>(null), [note, setNote] = useState(''), [err, setErr] = useState('')
  const sec = SEC.find(x => x.label === tab)!.id
  const items = s.reviews.filter(r => r.section === sec && r.status === 'open')
  const closed = s.reviews.filter(r => r.status !== 'open')
  const ok = can('review')
  const submit = () => {
    if (!act) return
    if (['reject', 'docs', 'note'].includes(act.kind) && !note.trim()) return setErr('A note is required for this action.')
    if (act.kind === 'note') addNote(act.r.id, note)
    else resolveReview(act.r.id, act.kind as 'verify' | 'docs' | 'unresolved' | 'reject', note)
    toast(act.kind === 'verify' ? 'Verified and logged' : 'Action recorded'); setAct(null); setNote(''); setErr('')
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Review center" sub="Cases that need a human decision. Nothing here is verified automatically." />
      <Tabs tabs={SEC.map(x => `${x.label} (${s.reviews.filter(r => r.section === x.id && r.status === 'open').length})`)} value={`${tab} (${items.length})`} onChange={t => setTab(t.replace(/ \(\d+\)$/, ''))} />
      {!ok && <p className="text-sm text-slate2 subtle px-4 py-3">Your role is read-only here. Reviewers and admins can act on these items.</p>}
      {!items.length ? <div className="card"><Empty title="Nothing waiting" text="No open items in this section." /></div> : items.map(r => {
        const a = s.assets.find(x => x.id === r.assetId)!, pr = s.projects.find(x => x.id === r.projectId), perm = s.permissions.find(x => x.id === a.permissionId)
        const canVerify = ok && !!perm?.docs
        return <article key={r.id} className="card p-5 grid md:grid-cols-[1fr_auto] gap-5">
          <div className="space-y-2 text-sm min-w-0"><div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap"><b className="text-[15px]">{a.name}</b><span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 ${pri[r.priority]}`}>{r.priority} priority</span>{pr && <Link className="text-info hover:underline" to={`/projects/${pr.id}`}>{pr.name}</Link>}</div>
            <p>{r.reason}</p><p className="meta leading-relaxed">Documentation: {perm?.docs ?? 'none'} · Missing: {r.missing.join(', ') || 'nothing listed'} · Reviewer: {userName(r.reviewerId)} · Submitted {fmtDate(r.createdAt)}</p>
            {r.notes.map((n, i) => <p key={i} className="text-xs bg-bg border border-line rounded-lg px-3 py-2">{userName(n.by)}: {n.text}</p>)}</div>
          <div className="flex md:flex-col gap-2 flex-wrap md:w-48 md:[&>.btn]:w-full">
            <button className="btn h-8 btn-primary" disabled={!canVerify} title={!ok ? 'Reviewers only' : !perm?.docs ? 'Cannot verify without documentation. Request it first.' : ''} onClick={() => setAct({ r, kind: 'verify' })}>Verify information</button>
            {ok && !canVerify && <p className="text-xs leading-snug text-muted">Attach a license document first. Documentation is required before verifying.</p>}
            <button className="btn h-8" disabled={!ok} onClick={() => setAct({ r, kind: 'docs' })}>Request documentation</button>
            <button className="btn h-8" disabled={!ok} onClick={() => setAct({ r, kind: 'unresolved' })}>Mark unresolved</button>
            <button className="btn h-8" disabled={!ok} onClick={() => setAct({ r, kind: 'note' })}>Add note</button>
            <button className="btn h-8 btn-danger" disabled={!ok} onClick={() => setAct({ r, kind: 'reject' })}>Reject</button></div></article>
      })}
      {closed.length > 0 && <Section title="Closed or unresolved"><ul className="divide-y divide-line text-sm -my-3">{closed.map(r => <li key={r.id} className="py-3 flex justify-between gap-4"><span>{s.assets.find(a => a.id === r.assetId)!.name}: {r.reason}</span><span className="text-muted capitalize shrink-0">{r.status}</span></li>)}</ul></Section>}
      {act && <Modal title={{ verify: 'Verify information', docs: 'Request documentation', unresolved: 'Mark as unresolved', reject: 'Reject submitted information', note: 'Add note' }[act.kind]} onClose={() => { setAct(null); setErr('') }} footer={<><button className="btn" onClick={() => setAct(null)}>Cancel</button><button className="btn btn-primary" onClick={submit}>Confirm</button></>}>
        {act.kind === 'verify' && <p className="text-sm text-slate2 mb-4 leading-relaxed">You confirm the attached documentation supports the recorded permission. This is recorded in the audit log under your name.</p>}
        <Field label="Internal note" error={err}><textarea className="input h-24 py-2" value={note} onChange={e => setNote(e.target.value)} /></Field></Modal>}
    </div>
  )
}
