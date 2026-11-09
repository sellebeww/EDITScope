import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../store'
import { checkProject, libraryStatus } from '../engine'
import { Disclaimer, Kpi, PageHeader, STATUS_COLOR, Section, StatusBadge, OVERALL_LABEL } from '../ui'
import { ReportModal } from '../report'
import type { Status } from '../types'

export default function Reports() {
  const { s, ctx } = useApp()
  const [rep, setRep] = useState<string | null>(null)
  const d = useMemo(() => {
    const checks = s.projects.map(p => checkProject(p, ctx))
    const types: Record<string, number> = {}; checks.forEach(c => c.findings.forEach(f => { types[f.type] = (types[f.type] ?? 0) + 1 }))
    const dist: Record<Status, number> = { verified: 0, conditional: 0, conflict: 0, unverified: 0 }; s.assets.forEach(a => dist[libraryStatus(s.permissions.find(p => p.id === a.permissionId))]++)
    const acts = s.projects.flatMap(p => p.actions)
    const accepted = acts.filter(a => a.status === 'accepted').length
    const monthly: Record<string, number> = {}; s.audit.filter(a => /rights check|Accepted|Created project/i.test(a.action)).forEach(a => { const m = a.ts.slice(0, 7); monthly[m] = (monthly[m] ?? 0) + 1 })
    return { checks, types, dist, acts, accepted, monthly, unresolved: checks.reduce((n, c) => n + c.findings.filter(f => f.status !== 'conditional').length, 0), needPerm: s.reviews.filter(r => r.section === 'approval' && r.status === 'open').length, resolved: s.reviews.filter(r => r.status === 'resolved').length }
  }, [s, ctx])
  const rate = d.acts.length ? Math.round((d.accepted / d.acts.length) * 100) : 0
  const LBL: Record<string, string> = { usage: 'Usage', channel: 'Channel', region: 'Region', commercial: 'Commercial', expired: 'Expired', attribution: 'Attribution', approval: 'Approval', unverified: 'Unverified' }
  const bar = Object.entries(d.types).map(([k, v]) => ({ name: LBL[k] ?? k, value: v }))
  const line = Object.entries(d.monthly).sort().map(([k, v]) => ({ name: k, value: v }))
  return (
    <div className="space-y-8">
      <PageHeader title="Reports" sub="Rights-check results, restriction trends, and exportable project reports." />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 stagger">
        <Kpi label="Projects reviewed" value={s.projects.length} /><Kpi label="Rights checks run" value={s.audit.filter(a => /rights check/i.test(a.action)).length} sub="logged in audit trail" /><Kpi label="Need extra permission" value={d.needPerm} />
        <Kpi label="Resolved cases" value={d.resolved} /><Kpi label="Unresolved issues" value={d.unresolved} /><Kpi label="Recs accepted" value={d.accepted} sub={`${rate}% of decisions`} /></div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Asset permission status"><div className="h-60"><ResponsiveContainer><PieChart><Pie isAnimationActive={false} data={(Object.keys(d.dist) as Status[]).map(k => ({ name: k, value: d.dist[k] }))} dataKey="value" nameKey="name" outerRadius={80} label={x => `${x.name} ${x.value}`}>{(Object.keys(d.dist) as Status[]).map(k => <Cell key={k} fill={STATUS_COLOR[k]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></Section>
        <Section title="Most common restriction types"><div className="h-60"><ResponsiveContainer><BarChart data={bar}><CartesianGrid stroke="#E6EAF0" vertical={false} /><XAxis dataKey="name" fontSize={11} interval={0} tickMargin={6} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar isAnimationActive={false} dataKey="value" fill="#477DC4" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Section>
        <Section title="Monthly rights-check activity"><div className="h-60">{line.length ? <ResponsiveContainer><LineChart data={line}><CartesianGrid stroke="#E6EAF0" vertical={false} /><XAxis dataKey="name" fontSize={11} interval={0} tickMargin={6} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Line isAnimationActive={false} dataKey="value" stroke="#223653" strokeWidth={2} /></LineChart></ResponsiveContainer> : <p className="text-sm text-muted">Run a check to see activity.</p>}</div></Section>
        <Section title="Recommendation acceptance"><div className="h-60 flex flex-col justify-center"><p className="text-5xl font-semibold tracking-tight tabular-nums">{rate}%</p><div className="mt-5 h-2 max-w-sm rounded-full bg-line overflow-hidden"><div className="h-full rounded-full bg-ok progress-fill" style={{ width: `${rate}%` }} /></div><p className="text-sm text-muted mt-3">{d.accepted} accepted of {d.acts.length} recorded {d.acts.length === 1 ? "decision" : "decisions"}</p></div></Section></div>
      <Section title="Project reports" flush><div className="scroll-hint overflow-x-auto"><table className="w-full min-w-[560px]"><thead><tr>{['Project', 'Status', 'Findings', ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{s.projects.map((p, i) => <tr key={p.id}><td className="td font-medium">{p.name}</td><td className="td"><StatusBadge s={d.checks[i].overall} label={OVERALL_LABEL[d.checks[i].overall]} /></td><td className="td">{d.checks[i].findings.length}</td><td className="td"><button className="btn h-8" onClick={() => setRep(p.id)}>View / export PDF &amp; CSV</button></td></tr>)}</tbody></table></div></Section>
      <Disclaimer />
      {rep && <ReportModal p={s.projects.find(p => p.id === rep)!} onClose={() => setRep(null)} />}
    </div>
  )
}
