import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileAudio, FileImage, FileText, Film, Plus, Type, Upload } from 'lucide-react'
import { useApp } from '../store'
import { libraryStatus } from '../engine'
import { CHANNELS, REGIONS, TYPES, USAGES, demoPhoto } from '../data'
import { Chips, Empty, Field, Modal, PageHeader, Photo, SearchBox, StatusBadge, TYPE_TINT, ViewToggle, fmtDate, useDebounced } from '../ui'
import type { Asset, AssetType, Status } from '../types'

const ICON: Record<string, typeof FileText> = { Image: FileImage, Video: Film, Audio: FileAudio, Illustration: FileImage, Font: Type, Logo: FileImage, Other: FileText }
const ACCEPT = '.jpg,.jpeg,.png,.svg,.mp4,.mov,.mp3,.wav,.pdf,.otf,.ttf'
const guessType = (n: string): AssetType => { const e = n.split('.').pop()!.toLowerCase(); return ['mp4', 'mov'].includes(e) ? 'Video' : ['mp3', 'wav'].includes(e) ? 'Audio' : ['otf', 'ttf'].includes(e) ? 'Font' : ['jpg', 'jpeg', 'png'].includes(e) ? 'Image' : e === 'svg' ? 'Illustration' : 'Other' }

function Upload_({ onClose }: { onClose: () => void }) {
  const { addAsset, toast } = useApp()
  const ref = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null), [err, setErr] = useState<Record<string, string>>({})
  const [f, setF] = useState({ name: '', type: 'Image' as AssetType, creator: '', source: '', license: '', uses: [] as string[], ch: [] as string[], reg: [] as string[], com: 'unknown', exp: '', attr: '', restr: '', doc: '', unverified: true })
  const pick = (x: File | undefined) => { if (!x) return; if (x.size > 200 * 1024 * 1024) return setErr({ file: 'File is larger than 200 MB.' }); setFile(x); setErr({}); setF(v => ({ ...v, name: v.name || x.name.replace(/\.[^.]+$/, ''), type: guessType(x.name) })) }
  const save = () => {
    const x: Record<string, string> = {}
    if (!file) x.file = 'Choose a file to upload.'; if (!f.name.trim()) x.name = 'Asset name is required.'; if (!f.creator.trim()) x.creator = 'Creator or owner is required.'
    if (f.exp && !/^\d{4}-\d{2}-\d{2}$/.test(f.exp)) x.exp = 'Use a valid date.'
    setErr(x); if (Object.keys(x).length) return
    addAsset({ name: f.name, type: f.type, creator: f.creator, source: f.source || 'Uploaded', fileName: file!.name }, {
      rightsHolder: f.creator, licenseType: f.license || 'Unspecified', permittedUses: f.uses, permittedChannels: f.ch, permittedRegions: f.reg, commercial: f.com === 'unknown' ? null : f.com === 'yes',
      expiration: f.exp || null, attribution: f.attr || null, restrictions: f.restr, docs: f.doc || null, verification: 'unverified',
    })
    toast('Asset uploaded. Permission information is not verified yet.'); onClose()
  }
  return (
    <Modal title="Upload asset" wide onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Upload asset</button></>}>
      <div className="space-y-4">
        <div className="border-2 border-dashed border-line bg-bg/50 rounded-2xl p-6 text-center text-sm" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}>
          <input ref={ref} type="file" hidden accept={ACCEPT} onChange={e => pick(e.target.files?.[0])} />
          <Upload className="mx-auto text-muted" size={22} /><p className="mt-2 font-medium">{file ? file.name : 'Drop a file or'} <button className="text-info hover:underline" onClick={() => ref.current?.click()}>browse</button></p><p className="meta mt-1">JPG, PNG, SVG, MP4, MOV, MP3, WAV, PDF, fonts. File names and metadata are stored; file bytes stay on your device in this demo.</p>
          {err.file && <p role="alert" className="text-xs text-bad mt-1">{err.file}</p>}</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Asset name" error={err.name}><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Type"><select className="input" value={f.type} onChange={e => setF({ ...f, type: e.target.value as AssetType })}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Creator / owner" error={err.creator}><input className="input" value={f.creator} onChange={e => setF({ ...f, creator: e.target.value })} /></Field>
          <Field label="Source or provider"><input className="input" value={f.source} onChange={e => setF({ ...f, source: e.target.value })} /></Field>
          <Field label="License type"><input className="input" value={f.license} onChange={e => setF({ ...f, license: e.target.value })} /></Field>
          <Field label="License document" hint="File name of the uploaded document"><input className="input" value={f.doc} onChange={e => setF({ ...f, doc: e.target.value })} /></Field></div>
        <Field label="Allowed usage"><Chips options={USAGES} value={f.uses} onChange={v => setF({ ...f, uses: v })} /></Field>
        <Field label="Allowed channels"><Chips options={CHANNELS} value={f.ch} onChange={v => setF({ ...f, ch: v })} /></Field>
        <Field label="Allowed regions"><Chips options={REGIONS} value={f.reg} onChange={v => setF({ ...f, reg: v })} /></Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Commercial use"><select className="input" value={f.com} onChange={e => setF({ ...f, com: e.target.value })}><option value="unknown">Unknown</option><option value="yes">Permitted</option><option value="no">Not permitted</option></select></Field>
          <Field label="Expiration" error={err.exp}><input type="date" className="input" value={f.exp} onChange={e => setF({ ...f, exp: e.target.value })} /></Field>
          <Field label="Attribution requirement"><input className="input" value={f.attr} onChange={e => setF({ ...f, attr: e.target.value })} /></Field></div>
        <Field label="Additional restrictions"><textarea className="input h-16 py-2" value={f.restr} onChange={e => setF({ ...f, restr: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked disabled /> Permission information has not been verified. An authorized reviewer must verify it; uploading a document does not verify it.</label>
      </div>
    </Modal>
  )
}

export function AssetThumb({ a, size = 'lg' }: { a: Asset; size?: 'lg' | 'sm' }) {
  const I = ICON[a.type]
  // Logos are fictional client brands (no photo exists for them): show a neutral monogram instead of a solid colour block
  if (a.type === 'Logo') { const lg = size === 'lg'; return <div className={`shrink-0 grid place-items-center border border-line bg-bg ${lg ? 'h-28 rounded-xl' : 'h-9 w-9 rounded-lg'}`}><span aria-hidden className={`grid place-items-center font-semibold text-white ${lg ? 'h-14 w-14 rounded-2xl text-2xl' : 'h-6 w-6 rounded-md text-xs'}`} style={{ background: TYPE_TINT.Logo }}>{a.name[0]}</span></div> }
  return <div className={`relative overflow-hidden shrink-0 grid place-items-center text-white ${size === 'lg' ? 'h-28 rounded-xl' : 'h-9 w-9 rounded-lg'}`} style={{ background: TYPE_TINT[a.type] }}><I size={size === 'lg' ? 28 : 16} aria-hidden /><Photo src={demoPhoto(a.id)} /></div>
}

export default function Library() {
  const { s, can } = useApp()
  const [sp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? ''), [type, setType] = useState('all'), [st, setSt] = useState('all'), [view, setView] = useState<'grid' | 'list'>('grid'), [up, setUp] = useState(false)
  const dq = useDebounced(q)
  const rows = s.assets.map(a => { const perm = s.permissions.find(p => p.id === a.permissionId); return { a, perm, status: libraryStatus(perm), projects: s.projects.filter(p => p.assets.some(x => x.assetId === a.id)) } })
    .filter(r => (!dq || (r.a.name + r.a.source + r.a.creator).toLowerCase().includes(dq.toLowerCase())) && (type === 'all' || r.a.type === type) && (st === 'all' || r.status === st))
  return (
    <div className="space-y-6">
      <PageHeader title="Asset library" sub="Status reflects each asset's recorded permission on its own. Project checks may differ."
        actions={<button className="btn btn-primary" disabled={!can('upload_asset')} title={can('upload_asset') ? '' : 'Your role cannot upload assets'} onClick={() => setUp(true)}><Plus size={16} />Upload asset</button>} />
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search assets" label="Search assets" />
        <select className="input w-full sm:w-44" aria-label="Category" value={type} onChange={e => setType(e.target.value)}><option value="all">All categories</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
        <select className="input w-full sm:w-48" aria-label="Rights status" value={st} onChange={e => setSt(e.target.value)}><option value="all">All rights statuses</option>{(['verified', 'conditional', 'conflict', 'unverified'] as Status[]).map(x => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}</select>
        <ViewToggle value={view} onChange={setView} /></div>
      {!rows.length ? <div className="card"><Empty title="No assets found" text="Adjust your search or filters." /></div>
      : view === 'grid' ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">{rows.map(({ a, perm, status, projects }) => (
        <Link key={a.id} to={perm ? `/permissions/${perm.id}` : '#'} className="card p-3 card-hover flex flex-col gap-3"><AssetThumb a={a} />
          <div className="px-1 pb-1 space-y-2 flex-1"><div className="flex items-start justify-between gap-2"><b className="text-sm leading-snug">{a.name}</b><StatusBadge s={status} /></div>
          <p className="meta">{a.type} · {a.source}</p><p className="meta">Expires {fmtDate(perm?.expiration ?? null)}</p><p className="meta truncate pt-2 border-t border-line">{projects.length ? projects.map(p => p.name).join(', ') : 'Not used in a project'}</p></div></Link>))}</div>
      : <div className="card scroll-hint overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr>{['Asset', 'Type', 'Source', 'Status', 'Expires', 'Projects'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{rows.map(({ a, perm, status, projects }) => <tr key={a.id} className="hover:bg-bg/60"><td className="td"><Link to={perm ? `/permissions/${perm.id}` : '#'} className="flex items-center gap-3 font-medium hover:underline"><AssetThumb a={a} size="sm" />{a.name}</Link></td><td className="td">{a.type}</td><td className="td">{a.source}</td><td className="td"><StatusBadge s={status} /></td><td className="td">{fmtDate(perm?.expiration ?? null)}</td><td className="td text-muted">{projects.length}</td></tr>)}</tbody></table></div>}
      {up && <Upload_ onClose={() => setUp(false)} />}
    </div>
  )
}
