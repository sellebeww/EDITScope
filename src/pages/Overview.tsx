import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus } from 'lucide-react'
import { useApp } from '../store'
import { checkProject, libraryStatus } from '../engine'
import { Avatar, Kpi, OVERALL_LABEL, PageHeader, Progress, Section, StatusBadge, STATUS_COLOR, fmtDate } from '../ui'
import type { Status } from '../types'

export function useRows() {
  const { s, ctx } = useApp()
  return useMemo(() => s.projects.map(p => { const c = checkProject(p, ctx); const pct = p.assets.length ? Math.round((c.counts.verified / p.assets.length) * 100) : 0; return { p, c, pct } }), [s.projects, ctx])
}

export default function Overview() {
  const { s, me, can, userName } = useApp()
  const nav = useNavigate()
  const rows = useRows()
  const conflicts = rows.reduce((n, r) => n + r.c.findings.filter(f => f.status === 'conflict').length, 0)
  const open = s.reviews.filter(r => r.status === 'open').length
  const dist = useMemo(() => { const d: Record<Status, number> = { verified: 0, conditional: 0, conflict: 0, unverified: 0 }; s.assets.forEach(a => d[libraryStatus(s.permissions.find(p => p.id === a.permissionId))]++); return d }, [s.assets, s.permissions])
  const urgent = [...rows].sort((a, b) => (b.c.counts.conflict * 3 + b.c.counts.unverified) - (a.c.counts.conflict * 3 + a.c.counts.unverified)).filter(r => r.c.counts.conflict + r.c.counts.unverified > 0).slice(0, 3)
  const h = new Date().getHours()
  return (
    <div className="space-y-8">
      <PageHeader title={`Good ${h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'}, ${me!.name.split(' ')[0]}`} sub="Here is the current status of your content rights and editing workflows."
        actions={can('create_project') ? <Link to="/projects?new=1" className="btn btn-primary"><Plus size={16} />New project</Link> : undefined} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <Kpi label="Active projects" value={s.projects.length} onClick={() => nav('/projects')} />
        <Kpi label="Assets registered" value={s.assets.length} onClick={() => nav('/library')} />
        <Kpi label="Pending reviews" value={String(open).padStart(2, '0')} onClick={() => nav('/review')} />
        <Kpi label="Usage conflicts" value={String(conflicts).padStart(2, '0')} sub="across all projects" onClick={() => nav('/projects')} />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Section title="Project activity" className="lg:col-span-2" flush action={<Link to="/projects" className="text-sm font-medium text-info hover:underline">View all</Link>}>
          <div className="scroll-hint overflow-x-auto"><table className="w-full min-w-[620px] [&_.th]:px-3.5 [&_.td]:px-3.5"><thead><tr>{["Project", "Owner", 'Updated', 'Assets', 'Status', 'Progress'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{rows.map(({ p, c, pct }) => <tr key={p.id} className="hover:bg-bg/60">
              <td className="td font-medium min-w-[130px]"><Link className="hover:underline" to={`/projects/${p.id}`}>{p.name}</Link></td>
              <td className="td"><span className="flex items-center gap-2 whitespace-nowrap"><Avatar name={userName(p.ownerId)} size={22} />{userName(p.ownerId)}</span></td>
              <td className="td text-muted whitespace-nowrap">{fmtDate(p.updatedAt)}</td><td className="td tabular-nums">{p.assets.length}</td>
              <td className="td whitespace-nowrap"><StatusBadge s={c.overall} label={OVERALL_LABEL[c.overall]} /></td><td className="td"><Progress pct={pct} /></td>
              </tr>)}</tbody></table></div>
        </Section>
        <Section title="Permission overview">
          <div className="h-44"><ResponsiveContainer><PieChart><Pie isAnimationActive={false} data={(Object.keys(dist) as Status[]).map(k => ({ name: k, value: dist[k] }))} dataKey="value" innerRadius={42} outerRadius={64} paddingAngle={2} stroke="none">
            {(Object.keys(dist) as Status[]).map(k => <Cell key={k} fill={STATUS_COLOR[k]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          <ul className="space-y-2.5 mt-4">{(['verified', 'conditional', 'conflict', 'unverified'] as Status[]).map(k => <li key={k} className="flex items-center justify-between text-sm"><StatusBadge s={k} label={k === 'conflict' ? 'Conflict detected' : k === 'unverified' ? 'Pending verification' : undefined} /><span className="tabular-nums font-medium">{dist[k]}</span></li>)}</ul>
        </Section>
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <Section title="Review priority" className="lg:col-span-2">
          {urgent.length ? <ul className="divide-y divide-line -my-3">{urgent.map(({ p, c }) => <li key={p.id} className="py-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="text-sm font-medium truncate">{p.name}</p><p className="meta mt-0.5">{c.counts.conflict} conflicts · {c.counts.unverified} unverified</p></div>
            <Link to={`/projects/${p.id}`} className="btn h-8 shrink-0">View details</Link></li>)}</ul> : <p className="text-sm text-muted">Nothing urgent. All projects are clear of conflicts.</p>}</Section>
        <Section title="Recent activity" className="lg:col-span-3">
          <ul className="space-y-4">{s.audit.slice(0, 6).map(a => <li key={a.id} className="text-sm flex gap-3"><Avatar name={userName(a.userId)} size={28} /><div className="min-w-0"><p>{a.action}</p><p className="meta mt-0.5">{userName(a.userId)} · {fmtDate(a.ts)}</p></div></li>)}</ul></Section>
      </div>
    </div>
  )
}
