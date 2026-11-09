import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Empty, PageHeader, fmtDate } from '../ui'

export default function Notifications() {
  const { s, setNoticeRead } = useApp(), nav = useNavigate()
  const [f, setF] = useState<'all' | 'unread' | string>('all')
  const kinds = ['all', 'unread', 'conflict', 'verify', 'expiry', 'docs', 'rec', 'check']
  const KL: Record<string, string> = { all: 'All', unread: 'Unread', conflict: 'Conflicts', verify: 'Verification', expiry: 'Expiry', docs: 'Documents', rec: 'Recommendations', check: 'Checks' }
  const list = s.notices.filter(n => f === 'all' || (f === 'unread' ? !n.read : n.kind === f)).sort((a, b) => b.ts.localeCompare(a.ts))
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Notifications" sub="Alerts about conflicts, verification requests, and expiring licenses." actions={<button className="btn" onClick={() => setNoticeRead('all')} disabled={!s.notices.some(n => !n.read)}>Mark all as read</button>} />
      <div className="flex gap-2 flex-wrap">{kinds.map(k => <button key={k} aria-pressed={f === k} onClick={() => setF(k)} className={`px-3.5 h-8 rounded-full border text-xs font-medium transition-colors ${f === k ? 'bg-navy text-white border-navy' : 'bg-white border-line text-slate2 hover:bg-bg'}`}>{KL[k] ?? k}</button>)}</div>
      <div className="card divide-y divide-line">{list.length ? list.map(n => <div key={n.id} className={`px-5 py-4 flex items-start gap-4 ${n.read ? '' : 'bg-info/[.04]'}`}>
        <span className={`mt-2 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-line' : 'bg-info'}`} aria-label={n.read ? 'Read' : 'Unread'} />
        <button className="text-left flex-1" onClick={() => { setNoticeRead(n.id); nav(n.link) }}><p className={`text-sm ${n.read ? '' : 'font-medium'}`}>{n.text}</p><p className="meta mt-1">{fmtDate(n.ts)}</p></button>
        <button className="text-xs font-medium text-info hover:underline shrink-0 py-2.5 -my-2.5" onClick={() => setNoticeRead(n.id, !n.read)}>{n.read ? 'Mark unread' : 'Mark read'}</button></div>) : <Empty title="No notifications" text="Nothing matches this filter." />}</div>
    </div>
  )
}
