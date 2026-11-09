// Public company profile / landing page. Shown to signed-out visitors at "/".
// The live checker runs the real rights engine (src/engine.ts) on sample data.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BellRing, Check, ChevronDown, ClipboardCheck, FileDown, FolderKanban, GitCompare, History, Library, Lock, Menu, RotateCcw, Scale, ScanSearch, ShieldCheck, UserCheck, X,
} from 'lucide-react'
import { checkAsset, statusOf } from '../engine'
import type { Permission, Project, ProjectAsset, Status } from '../types'
import { LogoMark, Photo, STATUS_COLOR, StatusBadge } from '../ui'
import { demoPhoto } from '../data'

// The landing samples reuse the seeded demo assets, so they share the same photos (see CREDITS.md)
const PHOTO: Record<string, string> = { 'Urban Lifestyle Photo': 'a01', 'Soft Piano Loop': 'a11', 'City Drone Footage': 'a07', 'Vintage Illustration': 'a13', 'Summer Vibes Audio': 'a10' }

/* ───────────── hooks ───────────── */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: 0.12 })
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}
function useSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' })
    ids.forEach(i => { const el = document.getElementById(i); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [ids])
  return active
}
function Count({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current!
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1100); setN(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    io.observe(el); return () => io.disconnect()
  }, [to])
  return <span ref={ref}>{n}</span>
}
const R = ({ children, d = 0, className = '' }: { children: React.ReactNode; d?: number; className?: string }) => <div data-reveal style={{ transitionDelay: `${d}ms` }} className={className}>{children}</div>
const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

/* ───────────── content ───────────── */
const NAV = [['product', 'Product'], ['try', 'Live check'], ['how', 'How it works'], ['teams', 'Teams'], ['faq', 'FAQ']] as const
const NAV_IDS = NAV.map(n => n[0])
const ALL: Status[] = ['verified', 'conditional', 'conflict', 'unverified']
const STATUSES: { s: Status; d: string }[] = [
  { s: 'verified', d: 'The recorded permission matches the intended usage.' },
  { s: 'conditional', d: 'Allowed if conditions are met, such as a credit line or approval.' },
  { s: 'conflict', d: 'A recorded restriction clashes with channel, region, use or dates.' },
  { s: 'unverified', d: 'Information is missing. Never assumed allowed, never assumed blocked.' },
]
const STEPS = [
  { t: 'Create a project', d: 'Name the campaign, client and dates. Describe where and how the finished edit will be published.', i: FolderKanban },
  { t: 'Add assets', d: 'Place library assets on the timeline across video, image, audio and graphics tracks.', i: Library },
  { t: 'Define usage', d: 'Pick intended uses, channels, region and whether the work is commercial.', i: ClipboardCheck },
  { t: 'Check rights', d: 'Fixed rules compare each recorded permission with your usage and cite the record behind every finding.', i: ScanSearch },
  { t: 'Compare options', d: 'Get minimum-change recommendations: replace, remove, request permission, re-scope or add attribution.', i: GitCompare },
  { t: 'Review & recheck', d: 'Accepting an option re-runs the check. A reviewer verifies permissions, and nothing is marked compliant on its own.', i: UserCheck },
  { t: 'Export the report', d: 'Share a PDF or CSV with findings, evidence and decisions for the client file.', i: FileDown },
]
const FEATURES = [
  { i: Library, t: 'Asset library', d: 'One place for every image, clip, track, font and logo, each linked to its permission record.' },
  { i: Scale, t: 'Rights & permissions', d: 'Rights holder, license, permitted uses, channels, regions, expiry, attribution and documents.' },
  { i: ScanSearch, t: 'Rule-based checks', d: 'Expiry, use, channel, region, commercial use, attribution and approval, with the evidence quoted.' },
  { i: GitCompare, t: 'Recommendations', d: 'Compare the smallest change that resolves each conflict before you accept it.' },
  { i: ShieldCheck, t: 'Review center', d: 'Unclear cases are queued for a human reviewer with the missing information listed.' },
  { i: History, t: 'Audit trail & reports', d: 'Every decision is logged. Export PDF or CSV when the client asks what was cleared.' },
]
const ROLES = [
  { r: 'Admin', d: 'Sets up the workspace, manages the team and keeps the data under control.', pts: ['Invite and manage teammates', 'See every project and review', 'Restore workspace data'] },
  { r: 'Editor', d: 'Builds projects, runs checks and applies the recommendation that fits the edit.', pts: ['Create projects and place assets', 'Run and re-run rights checks', 'Accept, reject or escalate options'] },
  { r: 'Reviewer', d: 'Verifies permissions. Documentation alone never verifies; a person does.', pts: ['Work the review queue', 'Verify or reject permission records', 'Record notes with every decision'] },
  { r: 'Viewer', d: 'Clients and stakeholders who need the picture without the ability to change it.', pts: ['Read project status', 'Open reports', 'No edit access'] },
]
const PRINCIPLES = [
  { i: Lock, t: 'Missing is not permission', d: 'No record means Unverified. We never fill gaps with an assumption.' },
  { i: BellRing, t: 'Nothing auto-approves', d: 'Accepting an option re-runs the check. Only a reviewer can verify a permission.' },
  { i: Scale, t: 'Not legal advice', d: 'A summary of recorded permissions and review results, never a guarantee.' },
]
const FAQ = [
  ['Is EDITScope legal advice?', 'No. It compares recorded permissions with your intended usage using fixed rules. It is not a legal opinion or a guarantee of copyright compliance.'],
  ['Does it use AI to decide what is allowed?', 'No. Checks are rule-based and every finding cites the permission record it came from. Nothing is inferred or guessed.'],
  ['What happens when permission data is missing?', 'The asset is marked Unverified. Missing information is never treated as permission, and never treated as a block either. It goes to a human reviewer.'],
  ['Can it mark a project compliant by itself?', 'No. Accepting a recommendation changes the project and re-runs the check. A reviewer must verify permissions.'],
  ['Where is my data stored?', 'This MVP keeps demonstration data in your browser. Sign-in is simulated and there is no server yet, so do not enter real client data.'],
] as const

/* ───────────── hero preview card ───────────── */
const HERO_ROWS: { n: string; k: string; s: Status; l: string }[] = [
  { n: 'Urban Lifestyle Photo', k: 'Image · Instagram', s: 'verified', l: 'Verified' },
  { n: 'Soft Piano Loop', k: 'Audio · Paid ads', s: 'conditional', l: 'Credit line needed' },
  { n: 'City Drone Footage', k: 'Video · Television', s: 'conflict', l: 'Channel not covered' },
  { n: 'Vintage Illustration', k: 'Illustration · Website', s: 'unverified', l: 'Needs review' },
]
function HeroCard() {
  const [step, setStep] = useState(0)
  useEffect(() => { const t = setInterval(() => setStep(s => (s >= HERO_ROWS.length + 3 ? 0 : s + 1)), 900); return () => clearInterval(t) }, [])
  const done = Math.min(step, HERO_ROWS.length)
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2rem] bg-[#2F7BFF]/20 blur-3xl" aria-hidden />
      <div className="relative rounded-2xl border border-white/15 bg-white shadow-2xl text-navy overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-11 border-b border-line bg-bg/70">
          <span className="flex gap-1.5" aria-hidden>{['#F0B4B4', '#F1D9A8', '#B9DEC8'].map(c => <i key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
          <span className="ml-2 text-xs text-muted">Summer Campaign · Rights check</span>
          <span className="ml-auto text-[11px] font-mono text-muted">{done < HERO_ROWS.length ? 'checking…' : 'done'}</span>
        </div>
        <div className="p-4 space-y-2.5">
          {HERO_ROWS.map((r, i) => (
            <div key={r.n} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
              <span className="relative overflow-hidden h-9 w-9 rounded-lg shrink-0" style={{ background: `linear-gradient(135deg,${STATUS_COLOR[r.s]}22,#223653 140%)` }}><Photo src={demoPhoto(PHOTO[r.n])} /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{r.n}</p><p className="text-xs text-muted truncate">{r.k}</p></div>
              {i < done ? <span className="anim-pop"><StatusBadge s={r.s} label={r.l} /></span> : <span className="skeleton h-5 w-24" />}
            </div>))}
        </div>
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-navy text-white p-3 text-xs flex items-start gap-2.5 transition-opacity duration-500" style={{ opacity: done === HERO_ROWS.length ? 1 : 0.25 }}>
            <GitCompare size={15} className="mt-0.5 shrink-0 text-[#6EA3F0]" aria-hidden />
            <p><b className="font-medium">Smallest fix:</b> swap City Drone Footage for a clip licensed for Television, or drop the channel. Compare before you accept.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────── live checker (real engine) ───────────── */
const base = (id: string, over: Partial<Permission>): Permission => ({
  id, assetId: id, rightsHolder: 'Sample rights holder', licenseType: 'Standard', permittedUses: [], restrictedUses: [], permittedChannels: [], permittedRegions: ['Worldwide'],
  commercial: true, expiration: null, attribution: null, approvalRequired: false, restrictions: '', docs: `${id}.pdf`, verification: 'verified', reviewerId: 'u3', lastReviewed: '2026-05-20', history: [], ...over,
})
const USES = ['Organic social media', 'Paid advertising', 'Website']
const SAMPLE = [
  { id: 'S-01', name: 'Urban Lifestyle Photo', kind: 'Image', perm: base('S-01', { permittedUses: USES, permittedChannels: ['Instagram', 'YouTube', 'Website'] }) },
  { id: 'S-02', name: 'Summer Vibes Audio', kind: 'Audio', perm: base('S-02', { permittedUses: ['Organic social media', 'Website'], permittedChannels: ['Instagram', 'YouTube', 'Website'], permittedRegions: ['United States'], commercial: false, expiration: '2026-12-31', attribution: 'Music by Kai Rivers' }) },
  { id: 'S-03', name: 'Vintage Illustration', kind: 'Illustration', perm: base('S-03', { verification: 'unverified', docs: null }) },
]
interface Plan { use: string; ch: string; region: string; commercial: boolean; end: string; credit: boolean }
const DEFAULT: Plan = { use: 'Organic social media', ch: 'Instagram', region: 'United States', commercial: false, end: '2026-12-15', credit: false }
const PRESETS: [string, Plan][] = [
  ['Organic Instagram, US', DEFAULT],
  ['Paid TV campaign, worldwide', { use: 'Paid advertising', ch: 'Television', region: 'Worldwide', commercial: true, end: '2027-03-01', credit: false }],
]
const Seg = ({ label, value, opts, on }: { label: string; value: string; opts: string[]; on: (v: string) => void }) => (
  <div><p className="text-xs font-medium text-slate2 mb-1.5" id={`l-${label}`}>{label}</p>
    <div role="radiogroup" aria-labelledby={`l-${label}`} className="flex flex-wrap gap-1.5">
      {opts.map(o => <button key={o} role="radio" aria-checked={o === value} onClick={() => on(o)} className={`h-8 px-3 rounded-lg border text-[13px] transition-colors ${o === value ? 'bg-navy text-white border-navy' : 'bg-white border-line text-slate2 hover:border-[#B8C2D1]'}`}>{o}</button>)}
    </div></div>
)
function LiveCheck() {
  const [f, setF] = useState<Plan>(DEFAULT)
  const set = <K extends keyof Plan>(k: K, v: Plan[K]) => setF(x => ({ ...x, [k]: v }))
  const rows = useMemo(() => {
    const p = { id: 'demo', name: 'Demo', usages: [f.use], channels: [f.ch], region: f.region, commercial: f.commercial, start: '2026-06-01', end: f.end } as Project
    return SAMPLE.map(a => {
      const pa = { id: a.id, assetId: a.id, track: 'Video', start: 0, len: 5, context: 'Hero', attributionAdded: f.credit } as ProjectAsset
      const issues = checkAsset(p, pa, a.perm)
      return { ...a, issues, status: statusOf(issues) }
    })
  }, [f])
  const overall = statusOf(rows.flatMap(r => r.issues))
  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
      <div className="card p-5 space-y-4 lg:sticky lg:top-20">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Intended usage</h3>
          <button className="text-xs text-info inline-flex items-center gap-1 hover:underline" onClick={() => setF(DEFAULT)}><RotateCcw size={12} aria-hidden />Reset</button></div>
        <div className="flex flex-wrap gap-1.5">{PRESETS.map(([n, v]) => <button key={n} onClick={() => setF(v)} className="text-xs rounded-full border border-line bg-bg px-2.5 py-1 hover:border-info hover:text-info transition-colors">{n}</button>)}</div>
        <Seg label="Use" value={f.use} opts={USES} on={v => set('use', v)} />
        <Seg label="Channel" value={f.ch} opts={['Instagram', 'YouTube', 'Television']} on={v => set('ch', v)} />
        <Seg label="Region" value={f.region} opts={['United States', 'European Union', 'Worldwide']} on={v => set('region', v)} />
        <Seg label="Project ends" value={f.end} opts={['2026-12-15', '2027-03-01']} on={v => set('end', v)} />
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-[#17243A]" checked={f.commercial} onChange={e => set('commercial', e.target.checked)} />Commercial</label>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-[#17243A]" checked={f.credit} onChange={e => set('credit', e.target.checked)} />Credit line added</label>
        </div>
      </div>
      <div className="space-y-3" aria-live="polite">
        <div className="card p-4 flex flex-wrap items-center gap-3 transition-colors" style={{ borderColor: STATUS_COLOR[overall] + '66' }}>
          <StatusBadge s={overall} label={overall === 'verified' ? 'Ready' : overall === 'conditional' ? 'Conditional' : overall === 'conflict' ? 'Conflict detected' : 'Pending verification'} />
          <p className="text-sm text-slate2 flex-1 min-w-[200px]">Project result from the real rules engine. {overall === 'verified' ? 'Every recorded permission matches.' : 'Change the usage to see it respond.'}</p>
          <div className="flex gap-1" aria-hidden>{ALL.map(s => { const c = rows.filter(r => r.status === s).length; return <span key={s} className="h-2 rounded-full transition-all duration-500" style={{ width: 12 + c * 18, background: STATUS_COLOR[s], opacity: c ? 1 : 0.18 }} /> })}</div>
        </div>
        {rows.map(r => (
          <div key={r.id} className="card p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="relative overflow-hidden h-9 w-9 rounded-lg shrink-0 transition-colors duration-500" style={{ background: `linear-gradient(135deg,${STATUS_COLOR[r.status]}33,#223653 150%)` }}><Photo src={demoPhoto(PHOTO[r.name])} /></span>
              <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{r.name}</p><p className="text-xs text-muted">{r.kind} · {r.id}</p></div>
              <StatusBadge s={r.status} />
            </div>
            {r.issues.length === 0 ? <p className="mt-3 text-sm text-ok flex items-center gap-1.5"><Check size={15} aria-hidden />Recorded permission matches this usage.</p> : (
              <ul className="mt-3 space-y-2">{r.issues.map(i => (
                <li key={i.type + (i.value ?? '')} className="rounded-lg bg-bg px-3 py-2 text-sm anim-pop">
                  <p className="font-medium">{i.title}</p>
                  <p className="text-xs text-slate2 mt-0.5">{i.explanation}</p>
                  <p className="text-[11px] font-mono text-muted mt-1.5 truncate">{i.evidence}</p>
                  <p className="text-xs mt-1.5"><b className="font-medium text-info">Next:</b> {i.next}</p>
                </li>))}</ul>)}
          </div>))}
        <p className="text-xs text-muted">Sample licenses for illustration only. Not a legal opinion.</p>
      </div>
    </div>
  )
}

/* ───────────── page ───────────── */
const Eyebrow = ({ children }: { children: React.ReactNode }) => <p className="text-sm font-semibold text-info mb-3">{children}</p>
const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.12] max-w-2xl">{children}</h2>

export default function Landing() {
  useReveal()
  const active = useSpy(NAV_IDS)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [role, setRole] = useState(0)
  const [faq, setFaq] = useState<number | null>(0)
  useEffect(() => { const h = () => setScrolled(window.scrollY > 24); h(); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h) }, [])
  const S = STEPS[step]

  return (
    <div className="min-h-screen bg-bg text-navy">
      {/* nav */}
      <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled || open ? 'bg-navy/90 backdrop-blur border-b border-white/10 shadow-lg' : ''}`}>
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center gap-6 text-white">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5" aria-label="EDITScope home"><LogoMark size={30} tile /><span className="font-semibold tracking-tight text-lg">EDIT<span className="font-normal">Scope</span></span></button>
          <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Sections">
            {NAV.map(([id, l]) => <button key={id} onClick={() => go(id)} className={`h-9 px-3 rounded-lg text-sm transition-colors ${active === id && scrolled ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>{l}</button>)}
          </nav>
          <div className="ml-auto hidden md:flex items-center gap-2">
            <Link to="/login" className="h-9 px-3 inline-flex items-center rounded-lg text-sm text-white/80 hover:text-white">Sign in</Link>
            <Link to="/login" className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-white text-navy text-sm font-medium hover:bg-bg transition-colors">Open the demo<ArrowRight size={14} aria-hidden /></Link>
          </div>
          <button className="md:hidden ml-auto p-2" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(o => !o)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {open && <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1 anim-fade text-white">
          {NAV.map(([id, l]) => <button key={id} onClick={() => { setOpen(false); go(id) }} className="block w-full text-left h-10 px-3 rounded-lg text-white/80 hover:bg-white/5">{l}</button>)}
          <Link to="/login" className="h-10 mt-2 flex items-center justify-center rounded-lg bg-white text-navy font-medium">Open the demo</Link>
        </div>}
      </header>

      {/* hero */}
      <section className="relative overflow-hidden text-white pt-32 pb-24 md:pt-40 md:pb-32" style={{ background: 'linear-gradient(155deg,#17243A 0%,#223653 55%,#1C3F7A 100%)' }}>
        <div className="absolute inset-0 opacity-[.07]" aria-hidden style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '44px 44px', maskImage: 'radial-gradient(ellipse at 30% 30%,#000,transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at 30% 30%,#000,transparent 70%)' }} />
        <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-info/25 blur-3xl float" aria-hidden />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[#2F7BFF]/20 blur-3xl" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
          <div className="stagger">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80"><span className="h-1.5 w-1.5 rounded-full bg-[#4ADE9B] pulse" aria-hidden />Rights-aware editing workspace</span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.6rem] font-semibold tracking-tight leading-[1.05]">Create freely.<br /><span className="grad">Use responsibly.</span></h1>
            <p className="mt-5 text-lg text-white/70 max-w-xl leading-relaxed">EDITScope compares each asset&rsquo;s recorded permission with how your project will be used, then turns every conflict into the smallest edit that fixes it.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="h-11 px-5 inline-flex items-center gap-2 rounded-lg bg-white text-navy font-medium hover:-translate-y-0.5 hover:shadow-xl transition-all">Open the live demo<ArrowRight size={16} aria-hidden /></Link>
              <button onClick={() => go('try')} className="h-11 px-5 inline-flex items-center rounded-lg border border-white/25 text-white hover:bg-white/10 transition-colors">Try a rights check</button>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">{['Rule-based, not guesswork', 'Every finding cites its record', 'Humans stay in the loop'].map(t => <li key={t} className="flex items-center gap-1.5"><Check size={14} className="text-[#4ADE9B]" aria-hidden />{t}</li>)}</ul>
          </div>
          <HeroCard />
        </div>
      </section>

      {/* statuses */}
      <section id="product" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 scroll-mt-16">
        <R><Eyebrow>The problem</Eyebrow><H2>A license is only useful if someone reads it before the edit ships.</H2>
          <p className="mt-4 text-slate2 max-w-2xl leading-relaxed">Permissions live in emails, PDFs and memory. EDITScope keeps them as structured records and answers one question for every asset: does this license cover what we are about to publish?</p></R>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map((x, i) => (
            <R key={x.s} d={i * 70}><div className="card card-hover p-5 h-full relative overflow-hidden">
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: STATUS_COLOR[x.s] }} aria-hidden />
              <StatusBadge s={x.s} /><p className="mt-4 text-sm text-slate2 leading-relaxed">{x.d}</p></div></R>))}
        </div>
        <R className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden border border-line bg-line">
          {([[7, 'rule checks per asset'], [4, 'honest statuses'], [6, 'recommendation actions'], [0, 'guesses or AI verdicts']] as const).map(([n, l]) => (
            <div key={l} className="bg-white p-6"><p className="text-4xl font-semibold tracking-tight"><Count to={n} /></p><p className="text-sm text-muted mt-1">{l}</p></div>))}
        </R>
      </section>

      {/* live check */}
      <section id="try" className="bg-white border-y border-line scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <R><Eyebrow>Live check</Eyebrow><H2>Change the plan. Watch the verdict change.</H2>
            <p className="mt-4 text-slate2 max-w-2xl">This panel runs the same rules engine as the workspace on three sample licenses. Try paid television, or move the end date past the audio license.</p></R>
          <R className="mt-10"><LiveCheck /></R>
        </div>
      </section>

      {/* features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
        <R><Eyebrow>Inside the workspace</Eyebrow><H2>Everything between &ldquo;can we use this?&rdquo; and &ldquo;here is the report.&rdquo;</H2></R>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((x, i) => <R key={x.t} d={(i % 3) * 70}><div className="card card-hover p-6 h-full group">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-white transition-transform group-hover:scale-110 group-hover:-rotate-3"><x.i size={19} aria-hidden /></span>
            <h3 className="mt-4 font-semibold">{x.t}</h3><p className="mt-1.5 text-sm text-slate2 leading-relaxed">{x.d}</p></div></R>)}
        </div>
      </section>

      {/* how */}
      <section id="how" className="text-white scroll-mt-16" style={{ background: 'linear-gradient(155deg,#17243A 0%,#223653 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <R><p className="text-sm font-semibold text-[#6EA3F0] mb-3">How it works</p><h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.12] max-w-2xl">Seven steps from brief to client-ready report.</h2></R>
          <R className="mt-10 grid lg:grid-cols-[320px_1fr] gap-6">
            <ol className="space-y-1.5">{STEPS.map((x, i) => (
              <li key={x.t}><button onClick={() => setStep(i)} aria-current={i === step} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${i === step ? 'bg-white text-navy shadow-lg translate-x-1' : 'text-white/70 hover:bg-white/5'}`}>
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold shrink-0 ${i === step ? 'bg-navy text-white' : 'bg-white/10'}`}>{i < step ? <Check size={13} /> : i + 1}</span>{x.t}</button></li>))}</ol>
            <div key={step} className="anim-pop rounded-2xl border border-white/10 bg-white/[.06] p-7 md:p-10 flex flex-col justify-between min-h-[280px]">
              <div><span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#2F7BFF] to-[#1238A8]"><S.i size={22} aria-hidden /></span>
                <p className="mt-6 text-xs font-mono text-white/50">STEP {step + 1} / {STEPS.length}</p><h3 className="mt-1 text-2xl font-semibold">{S.t}</h3><p className="mt-3 text-white/70 leading-relaxed max-w-lg">{S.d}</p></div>
              <div className="mt-8 flex gap-2">
                <button disabled={step === 0} onClick={() => setStep(s => s - 1)} className="h-10 px-4 rounded-lg border border-white/20 text-sm disabled:opacity-30 hover:bg-white/10 transition-colors">Back</button>
                <button disabled={step === STEPS.length - 1} onClick={() => setStep(s => s + 1)} className="h-10 px-4 rounded-lg bg-white text-navy text-sm font-medium disabled:opacity-30 hover:bg-bg transition-colors">Next step</button>
              </div>
            </div>
          </R>
        </div>
      </section>

      {/* teams */}
      <section id="teams" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 scroll-mt-16">
        <R><Eyebrow>For the whole team</Eyebrow><H2>Four roles, one source of truth.</H2></R>
        <R className="mt-10 card overflow-hidden grid md:grid-cols-[220px_1fr]">
          <div role="tablist" aria-label="Roles" className="flex md:flex-col border-b md:border-b-0 md:border-r border-line bg-bg/60 overflow-x-auto">
            {ROLES.map((x, i) => <button key={x.r} role="tab" aria-selected={i === role} onClick={() => setRole(i)} className={`px-5 h-12 text-sm text-left whitespace-nowrap transition-colors ${i === role ? 'bg-white font-medium shadow-[inset_3px_0_0_#477DC4]' : 'text-slate2 hover:bg-white/60'}`}>{x.r}</button>)}
          </div>
          <div key={role} role="tabpanel" className="p-7 md:p-9 anim-fade">
            <h3 className="text-xl font-semibold">{ROLES[role].r}</h3><p className="mt-2 text-slate2 max-w-lg leading-relaxed">{ROLES[role].d}</p>
            <ul className="mt-5 space-y-2.5">{ROLES[role].pts.map(p => <li key={p} className="flex items-center gap-2.5 text-sm"><span className="grid h-5 w-5 place-items-center rounded-full bg-ok/10 text-ok"><Check size={12} aria-hidden /></span>{p}</li>)}</ul>
          </div>
        </R>
      </section>

      {/* principles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 md:pb-28">
        <R className="rounded-3xl bg-navy p-8 md:p-14 text-white grid md:grid-cols-3 gap-8">
          {PRINCIPLES.map(x => <div key={x.t}><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><x.i size={19} aria-hidden /></span><h3 className="mt-4 font-semibold">{x.t}</h3><p className="mt-1.5 text-sm text-white/65 leading-relaxed">{x.d}</p></div>)}
        </R>
      </section>

      {/* faq */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 md:pb-28 scroll-mt-16">
        <R><Eyebrow>FAQ</Eyebrow><H2>Straight answers.</H2></R>
        <R className="mt-8 card divide-y divide-line">
          {FAQ.map(([q, a], i) => (
            <div key={q}><button aria-expanded={faq === i} onClick={() => setFaq(faq === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium hover:bg-bg/60 transition-colors">{q}<ChevronDown size={18} className={`shrink-0 text-muted transition-transform duration-300 ${faq === i ? 'rotate-180' : ''}`} aria-hidden /></button>
              <div className="grid transition-all duration-300" style={{ gridTemplateRows: faq === i ? '1fr' : '0fr' }}><div className="overflow-hidden"><p className="px-5 pb-5 text-sm text-slate2 leading-relaxed">{a}</p></div></div></div>))}
        </R>
      </section>

      {/* cta + footer */}
      <section className="px-4 sm:px-6 pb-16">
        <R className="relative max-w-6xl mx-auto overflow-hidden rounded-3xl text-white text-center px-6 py-16 md:py-20">
          <div className="absolute inset-0" aria-hidden style={{ background: 'linear-gradient(155deg,#17243A 0%,#223653 55%,#1C3F7A 100%)' }} />
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-info/25 blur-3xl" aria-hidden />
          <div className="relative flex flex-col items-center"><LogoMark size={52} tile /><h2 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight">See your next edit through the license.</h2>
            <p className="mt-3 text-white/70 max-w-lg">The demo account is prefilled. Switch between Admin, Editor, Reviewer and Viewer from the avatar menu.</p>
            <Link to="/login" className="mt-8 h-12 px-6 inline-flex items-center gap-2 rounded-lg bg-white text-navy font-medium hover:-translate-y-0.5 hover:shadow-xl transition-all">Open the live demo<ArrowRight size={16} aria-hidden /></Link></div>
        </R>
      </section>
      <footer className="border-t border-line bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-2 text-navy font-semibold"><LogoMark size={22} tile />EDITScope</span>
          <span>Create freely. Use responsibly.</span>
          <span className="ml-auto">&copy; {new Date().getFullYear()} Vassel Goleyu. All rights reserved.</span>
          <p className="basis-full text-xs">EDITScope summarizes recorded permissions and review results. It is not a legal opinion or a guarantee of copyright compliance. This MVP stores demonstration data in your browser.</p>
        </div>
      </footer>
    </div>
  )
}
