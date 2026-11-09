import { createPortal } from 'react-dom'
import { Printer, Download, X } from 'lucide-react'
import { checkProject, recommend, segment } from './engine'
import { useApp } from './store'
import { Disclaimer, OVERALL_LABEL, StatusBadge, fmtDate } from './ui'
import type { Project } from './types'

export function useReport(p: Project) {
  const { s, ctx, userName } = useApp()
  const c = checkProject(p, ctx)
  const recs = c.findings.flatMap(f => recommend(f, p, ctx))
  const reviews = s.reviews.filter(r => r.projectId === p.id)
  return { p, c, recs, reviews, userName, generated: new Date().toISOString().slice(0, 10), s }
}

export function downloadCsv(r: ReturnType<typeof useReport>) {
  const q = (v: unknown) => { const x = String(v ?? ''); return `"${(/^[=+\-@\t\r]/.test(x) ? "'" + x : x).replace(/"/g, '""')}"` }
  const rows: unknown[][] = [['Section', 'Item', 'Detail 1', 'Detail 2', 'Detail 3']]
  const { p, c } = r
  rows.push(['Project', p.name, `Client: ${p.client}`, `Usage: ${p.usages.join('; ')}`, `Channels: ${p.channels.join('; ')} | ${p.region} | ${p.start} to ${p.end}`])
  c.rows.forEach(x => rows.push(['Asset', x.asset.name, x.asset.type, x.status, segment(x.pa)]))
  c.findings.forEach(f => rows.push(['Finding', r.s.assets.find(a => a.id === f.assetId)!.name, f.title, f.explanation, f.evidence]))
  r.recs.forEach(x => rows.push(['Recommended action', r.s.assets.find(a => a.id === x.assetId)!.name, x.title, x.proposed, `Effort: ${x.effort}`]))
  p.actions.forEach(a => rows.push(['Decision', a.assetName, a.title, a.status, `${r.userName(a.by)} ${a.at.slice(0, 10)}`]))
  c.findings.filter(f => f.status !== 'conditional').forEach(f => rows.push(['Unresolved', r.s.assets.find(a => a.id === f.assetId)!.name, f.title, f.status, '']))
  r.reviews.forEach(v => rows.push(['Review', r.s.assets.find(a => a.id === v.assetId)!.name, v.section, v.status, v.createdAt]))
  rows.push(['Generated', r.generated, 'Not a legal opinion or a guarantee of copyright compliance.', '', ''])
  const url = URL.createObjectURL(new Blob([rows.map(x => x.map(q).join(',')).join('\n')], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = `${p.name.replace(/\W+/g, '-')}-rights-report.csv`; a.click(); URL.revokeObjectURL(url)
}

export function ReportModal({ p, onClose }: { p: Project; onClose: () => void }) {
  const r = useReport(p)
  const { c } = r
  const nm = (id: string) => r.s.assets.find(a => a.id === id)!.name
  const H = ({ children }: { children: string }) => <h3 className="font-semibold mt-5 mb-2">{children}</h3>
  return createPortal(
    <div className="print-area fixed inset-0 z-[60] bg-white overflow-auto">
      <div className="no-print sticky top-0 bg-white border-b border-line px-4 h-12 flex items-center justify-between">
        <span className="text-sm font-medium">Report preview</span>
        <div className="flex gap-2"><button className="btn h-8" onClick={() => downloadCsv(r)}><Download size={14} />CSV</button><button className="btn btn-primary h-8" onClick={() => window.print()}><Printer size={14} />Print / PDF</button><button className="btn h-8" aria-label="Close" onClick={onClose}><X size={14} /></button></div>
      </div>
      <article className="max-w-3xl mx-auto p-8 text-sm text-navy">
        <h1 className="text-2xl font-semibold">{p.name}: Rights report</h1>
        <p className="text-muted">{p.client} · generated {r.generated} · {OVERALL_LABEL[c.overall]}</p>
        <H>Project information</H><p>Usage: {p.usages.join(', ')}. Channels: {p.channels.join(', ')}. Region: {p.region}. Dates: {p.start} to {p.end}. {p.commercial ? 'Commercial' : 'Non-commercial'}.</p>
        <H>Asset list</H><table className="w-full"><tbody>{c.rows.map(x => <tr key={x.pa.id}><td className="py-1">{x.asset.name}</td><td>{x.asset.type}</td><td>{segment(x.pa)}</td><td><StatusBadge s={x.status} /></td></tr>)}</tbody></table>
        <H>Recorded permission findings</H>{c.findings.length ? <ul className="list-disc pl-5 space-y-1">{c.findings.map(f => <li key={f.id}><b>{nm(f.assetId)}:</b> {f.title}. {f.explanation} <span className="text-muted">[{f.evidence}]</span></li>)}</ul> : <p>No findings.</p>}
        <H>Recommended actions</H>{r.recs.length ? <ul className="list-disc pl-5 space-y-1">{r.recs.map(x => <li key={x.id}><b>{nm(x.assetId)}:</b> {x.title}. {x.proposed} (effort {x.effort})</li>)}</ul> : <p>None outstanding.</p>}
        <H>Accepted actions and decisions</H>{p.actions.length ? <ul className="list-disc pl-5">{p.actions.map(a => <li key={a.id}>{a.title} on {a.assetName}: {a.status} by {r.userName(a.by)}, {fmtDate(a.at)}</li>)}</ul> : <p>None yet.</p>}
        <H>Unresolved issues</H><p>{c.findings.filter(f => f.status !== 'conditional').length} unresolved conflicts or unverified assets.</p>
        <H>Review history</H>{r.reviews.length ? <ul className="list-disc pl-5">{r.reviews.map(v => <li key={v.id}>{nm(v.assetId)}: {v.section}, {v.status}, opened {v.createdAt}</li>)}</ul> : <p>No reviews.</p>}
        <div className="mt-8 pt-4 border-t border-line"><Disclaimer /></div>
      </article>
    </div>, document.body)
}
