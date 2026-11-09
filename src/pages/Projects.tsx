import { Fragment, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useApp } from '../store'
import { CHANNELS, REGIONS, USAGES, demoPhoto } from '../data'
import { Avatar, Chips, Empty, Field, Modal, OVERALL_LABEL, PageHeader, Progress, ProjectThumb, SearchBox, StatusBadge, ViewToggle, fmtDate } from '../ui'
import { useRows } from './Overview'

const STEPS = ['Basics', 'Intended usage', 'Channels', 'Conditions', 'Review']
function CreateModal({ onClose }: { onClose: () => void }) {
  const { createProject, toast } = useApp(), nav = useNavigate()
  const [i, setI] = useState(0), [err, setErr] = useState<Record<string, string>>({})
  const [f, setF] = useState({ name: '', description: '', client: '', category: 'Advertising', usages: [] as string[], channels: [] as string[], region: 'Worldwide', start: '', end: '', commercial: true, scope: 'Public' })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }))
  const validate = () => {
    const x: Record<string, string> = {}
    if (i === 0) { if (!f.name.trim()) x.name = 'Project name is required.'; if (!f.client.trim()) x.client = 'Client or brand is required.' }
    if (i === 1 && !f.usages.length) x.usages = 'Pick at least one intended usage.'
    if (i === 2 && !f.channels.length) x.channels = 'Pick at least one channel.'
    if (i === 3) { if (!f.start || !f.end) x.start = 'Start and end dates are required.'; else if (f.end < f.start) x.end = 'End date must be after the start date.' }
    setErr(x); return !Object.keys(x).length
  }
  const done = () => { const id = createProject(f); toast('Project created'); onClose(); nav(`/projects/${id}`) }
  return (
    <Modal title={`New project · ${STEPS[i]} (${i + 1}/5)`} onClose={onClose} footer={<>
      {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>Back</button>}
      {i < 4 ? <button className="btn btn-primary" onClick={() => validate() && setI(i + 1)}>Continue</button> : <button className="btn btn-primary" onClick={done}>Create project</button>}</>}>
      <div className="space-y-4">
        {i === 0 && <>
          <Field label="Project name" error={err.name}><input className="input" value={f.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="Description"><textarea className="input h-20 py-2" value={f.description} onChange={e => set('description', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4"><Field label="Client or brand" error={err.client}><input className="input" value={f.client} onChange={e => set('client', e.target.value)} /></Field>
            <Field label="Category"><select className="input" value={f.category} onChange={e => set('category', e.target.value)}>{['Advertising', 'Video', 'Branding', 'Web', 'Education', 'Other'].map(c => <option key={c}>{c}</option>)}</select></Field></div></>}
        {i === 1 && <Field label="Intended usage" error={err.usages}><Chips options={USAGES} value={f.usages} onChange={v => set('usages', v)} /></Field>}
        {i === 2 && <Field label="Distribution channels" error={err.channels}><Chips options={CHANNELS} value={f.channels} onChange={v => set('channels', v)} /></Field>}
        {i === 3 && <>
          <Field label="Target region"><select className="input" value={f.region} onChange={e => set('region', e.target.value)}>{REGIONS.map(r => <option key={r}>{r}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-4"><Field label="Start date" error={err.start}><input type="date" className="input" value={f.start} onChange={e => set('start', e.target.value)} /></Field>
            <Field label="End date" error={err.end}><input type="date" className="input" value={f.end} onChange={e => set('end', e.target.value)} /></Field></div>
          <div className="grid grid-cols-2 gap-4"><Field label="Use type"><select className="input" value={String(f.commercial)} onChange={e => set('commercial', e.target.value === 'true')}><option value="true">Commercial</option><option value="false">Non-commercial</option></select></Field>
            <Field label="Audience scope"><select className="input" value={f.scope} onChange={e => set('scope', e.target.value)}>{['Public', 'Public, paid reach', 'Internal', 'Invite only'].map(r => <option key={r}>{r}</option>)}</select></Field></div></>}
        {i === 4 && <dl className="text-sm grid grid-cols-3 gap-y-3 gap-x-4">{([['Name', f.name], ['Client', f.client], ['Usage', f.usages.join(', ')], ['Channels', f.channels.join(', ')], ['Region', f.region], ['Dates', `${f.start} to ${f.end}`], ['Type', f.commercial ? 'Commercial' : 'Non-commercial']] as const).map(([k, v]) => <Fragment key={k}><dt className="text-muted">{k}</dt><dd className="col-span-2">{v}</dd></Fragment>)}</dl>}
      </div>
    </Modal>
  )
}

export default function Projects() {
  const { s, can, userName } = useApp()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState(''), [status, setStatus] = useState('all'), [owner, setOwner] = useState('all'), [when, setWhen] = useState('all'), [sort, setSort] = useState('updated'), [view, setView] = useState<'grid' | 'list'>('grid')
  const rows = useRows()
  const cutoff = (d: number) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10)
  const shown = rows.filter(({ p, c }) => (!q || (p.name + p.client).toLowerCase().includes(q.toLowerCase())) && (status === 'all' || c.overall === status) && (owner === 'all' || p.ownerId === owner) && (when === 'all' || p.updatedAt >= cutoff(+when)))
    .sort((a, b) => (sort === 'name' ? a.p.name.localeCompare(b.p.name) : b.p.updatedAt.localeCompare(a.p.updatedAt)))
  return (
    <div className="space-y-6">
      <PageHeader title="Projects" sub={`${rows.length} projects in this workspace, each checked against its intended usage.`}
        actions={<button className="btn btn-primary" disabled={!can('create_project')} title={can('create_project') ? '' : 'Your role cannot create projects'} onClick={() => setSp({ new: '1' })}><Plus size={16} />New project</button>} />
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search projects" label="Search projects" className="w-full sm:w-56" />
        <select className="input w-full sm:w-36" aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{Object.entries(OVERALL_LABEL).filter(([k]) => k !== 'empty').map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className="input w-full sm:w-36" aria-label="Owner" value={owner} onChange={e => setOwner(e.target.value)}><option value="all">All owners</option>{s.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <select className="input w-full sm:w-36" aria-label="Date" value={when} onChange={e => setWhen(e.target.value)}><option value="all">Any time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select>
        <select className="input w-full sm:w-44" aria-label="Sort" value={sort} onChange={e => setSort(e.target.value)}><option value="updated">Sort: last updated</option><option value="name">Sort: name</option></select>
        <ViewToggle value={view} onChange={setView} />
      </div>
      {!shown.length ? <div className="card"><Empty title="No projects match" text="Try clearing filters or create a new project." /></div>
      : view === 'grid' ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 stagger">{shown.map(({ p, c, pct }) => (
        <Link key={p.id} to={`/projects/${p.id}`} className="card p-4 card-hover flex flex-col gap-4"><ProjectThumb name={p.name} h={112} src={demoPhoto(p.id)} />
          <div className="flex-1 space-y-2"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold leading-snug">{p.name}</h3><StatusBadge s={c.overall} label={OVERALL_LABEL[c.overall]} /></div><p className="text-sm text-muted line-clamp-2">{p.description || p.client}</p></div>
          <Progress pct={pct} />
          <div className="flex items-center justify-between gap-2 text-xs text-muted pt-3 border-t border-line"><span className="flex items-center gap-2 min-w-0"><Avatar name={userName(p.ownerId)} size={20} /><span className="truncate">{userName(p.ownerId)}</span></span><span className="shrink-0">{p.assets.length} assets · {fmtDate(p.updatedAt)}</span></div></Link>))}</div>
      : <div className="card scroll-hint overflow-x-auto"><table className="w-full min-w-[820px]"><thead><tr>{['Project', 'Client', 'Owner', 'Updated', 'Assets', 'Status', 'Progress'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{shown.map(({ p, c, pct }) => <tr key={p.id} className="hover:bg-bg/60"><td className="td font-medium"><Link className="hover:underline" to={`/projects/${p.id}`}>{p.name}</Link></td><td className="td">{p.client}</td><td className="td">{userName(p.ownerId)}</td><td className="td text-muted">{fmtDate(p.updatedAt)}</td><td className="td">{p.assets.length}</td><td className="td"><StatusBadge s={c.overall} label={OVERALL_LABEL[c.overall]} /></td><td className="td"><Progress pct={pct} /></td></tr>)}</tbody></table></div>}
      {sp.get('new') && (can('create_project') ? <CreateModal onClose={() => setSp({})} /> : null)}
    </div>
  )
}
