import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleHelp, Inbox, LayoutGrid, List, Search, ShieldAlert, X } from 'lucide-react'
import type { Status, Verification } from './types'

const S = {
  verified: { l: 'Verified', c: 'text-ok bg-ok/10 border-ok/20', i: CheckCircle2 },
  conditional: { l: 'Conditional', c: 'text-[#9a6a12] bg-warn/15 border-warn/30', i: AlertTriangle },
  conflict: { l: 'Conflict', c: 'text-bad bg-bad/10 border-bad/20', i: ShieldAlert },
  unverified: { l: 'Unverified', c: 'text-slate2 bg-na/10 border-na/25', i: CircleHelp },
} as const
export const STATUS_COLOR: Record<Status, string> = { verified: '#23865B', conditional: '#D99A36', conflict: '#D95757', unverified: '#8A94A6' }
export function StatusBadge({ s, label }: { s: Status | 'empty'; label?: string }) {
  if (s === 'empty') return <span className="inline-flex items-center rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-medium text-muted">No assets</span>
  const { l, c, i: I } = S[s]
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${c}`}><I size={12} aria-hidden />{label ?? l}</span>
}
export const VerBadge = ({ v }: { v: Verification }) => <StatusBadge s={v === 'verified' ? 'verified' : v === 'rejected' ? 'conflict' : 'unverified'} label={v === 'verified' ? 'Verified' : v === 'pending' ? 'Pending' : v === 'rejected' ? 'Rejected' : 'Unverified'} />
export const OVERALL_LABEL: Record<Status | 'empty', string> = { verified: 'Verified', conditional: 'Conditional', conflict: 'Conflict detected', unverified: 'Pending verification', empty: 'No assets' }

export function Modal({ title, onClose, children, wide, footer }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [onClose])
  useEffect(() => { // move focus into the dialog, give it back on close
    const prev = document.activeElement as HTMLElement | null
    box.current?.querySelector<HTMLElement>('input:not([type=hidden]):not([disabled]), select, textarea')?.focus()
    return () => prev?.focus?.()
  }, [])
  return (
    <div className="anim-fade !m-0 fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-navy/45 backdrop-blur-[3px]" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal aria-label={title} className={`anim-pop card w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl rounded-b-none sm:rounded-b-2xl`}>
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-line">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2><button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-bg hover:text-navy transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-line bg-bg/50 rounded-b-2xl flex flex-col-reverse sm:flex-row sm:justify-end gap-2 [&>.btn]:w-full sm:[&>.btn]:w-auto">{footer}</div>}
      </div>
    </div>
  )
}
export function Confirm({ title, text, onYes, onNo, yes = 'Confirm' }: { title: string; text: string; onYes: () => void; onNo: () => void; yes?: string }) {
  return <Modal title={title} onClose={onNo} footer={<><button className="btn" onClick={onNo}>Cancel</button><button className="btn btn-primary" onClick={onYes}>{yes}</button></>}><p className="text-sm text-slate2">{text}</p></Modal>
}
export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return <label className="block"><span className="label">{label}</span><div className="mt-1.5">{children}</div>{hint && !error && <span className="meta mt-1.5 block">{hint}</span>}{error && <span role="alert" className="text-xs text-bad mt-1.5 block">{error}</span>}</label>
}
export const Chips = ({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) => (
  <div className="flex flex-wrap gap-2">{options.map(o => { const on = value.includes(o); return (
    <button type="button" key={o} aria-pressed={on} onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])}
      className={`px-3 h-8 rounded-full border text-xs font-medium transition-colors ${on ? 'bg-navy text-white border-navy' : 'bg-white border-line text-slate2 hover:bg-bg'}`}>{o}</button>) })}</div>
)
export const Empty = ({ title, text, action }: { title: string; text: string; action?: ReactNode }) => (
  <div className="text-center py-14 px-6 anim-fade"><span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-bg border border-line text-slate2"><Inbox size={20} aria-hidden /></span><p className="font-semibold">{title}</p><p className="text-sm text-muted mt-1.5 max-w-sm mx-auto">{text}</p>{action && <div className="mt-5">{action}</div>}</div>
)
/** Counts up to a number once on mount; non-numeric values render as-is. Respects reduced motion via CSS-less check. */
function useCountUp(target: number, ms = 600) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setV(target)
    let raf = 0; const t0 = performance.now()
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / ms); setV(Math.round(target * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}
export const Kpi = ({ label, value, sub, onClick }: { label: string; value: number | string; sub?: string; onClick?: () => void }) => {
  const str = String(value), n = useCountUp(Number(str))
  const shown = /^\d+$/.test(str) ? String(n).padStart(str.length, '0') : str
  const Tag = onClick ? 'button' : 'div' // a non-clickable KPI must not render as a dead button
  return (
    <Tag onClick={onClick} className={`card ${onClick ? 'card-hover ' : ''}p-5 text-left w-full group flex flex-col items-stretch justify-start`}><div className="flex justify-between items-start gap-2"><p className="text-[13px] font-medium text-slate2">{label}</p><ArrowUpRight size={14} className="text-muted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" aria-hidden /></div><p className="text-[1.75rem] leading-none font-semibold tracking-tight mt-3 tabular-nums">{shown}</p>{sub && <p className="meta mt-2">{sub}</p>}</Tag>
  )
}
export const Progress = ({ pct }: { pct: number }) => {
  const c = pct >= 80 ? 'bg-ok' : pct >= 40 ? 'bg-warn' : 'bg-bad'
  return <div className="flex items-center gap-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Verified assets"><div className="h-1.5 w-full min-w-16 max-w-24 rounded-full bg-line overflow-hidden"><div className={`h-full progress-fill ${c}`} style={{ width: `${pct}%` }} /></div><span className="text-xs text-slate2 font-medium tabular-nums w-9">{pct}%</span></div>
}
export const Tabs = ({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (t: string) => void }) => (
  <div role="tablist" className="flex gap-1 border-b border-line overflow-x-auto [scrollbar-width:none] max-md:pr-7 max-md:[mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)]">{tabs.map(t => <button role="tab" aria-selected={t === value} key={t} onClick={e => { onChange(t); e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }) }} className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${t === value ? 'border-navy font-semibold text-navy' : 'border-transparent text-muted hover:text-navy hover:border-line'}`}>{t}</button>)}</div>
)
export function Spinner({ text }: { text: string }) { return <div className="flex items-center gap-2 text-sm text-muted"><span className="h-4 w-4 rounded-full border-2 border-line border-t-navy animate-spin" />{text}</div> }
export const Avatar = ({ name, size = 28 }: { name: string; size?: number }) => <span style={{ width: size, height: size }} className="inline-flex items-center justify-center rounded-full bg-midnight text-white text-[11px] font-medium shrink-0">{name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>
export const Disclaimer = () => <p className="meta leading-relaxed">This report summarizes recorded asset permissions and review results. It is not a legal opinion or a guarantee of copyright compliance.</p>
export const fmtDate = (d: string | null) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')
export function useDebounced<T>(v: T, ms = 150) { const [x, setX] = useState(v); useEffect(() => { const t = setTimeout(() => setX(v), ms); return () => clearTimeout(t) }, [v, ms]); return x }
export const TYPE_TINT: Record<string, string> = { Image: '#477DC4', Video: '#7A5FC4', Audio: '#23865B', Illustration: '#D99A36', Font: '#526781', Logo: '#D95757', Other: '#8A94A6' }
// Cover photo over a placeholder: parent must be `relative overflow-hidden`. If the image fails to load it removes
// itself, so the placeholder underneath (icon, initials, type label) shows instead of a broken-image icon.
export const Photo = ({ src }: { src?: string }) => src ? <img src={src} alt="" loading="lazy" onError={e => e.currentTarget.remove()} className="absolute inset-0 h-full w-full object-cover" /> : null
export const ProjectThumb = ({ name, h = 96, src }: { name: string; h?: number; src?: string }) => {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 4
  const g = ['#223653,#526781', '#17243A,#477DC4', '#223653,#23865B', '#17243A,#526781'][hue].split(',')
  return <div style={{ height: h, background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }} className="relative overflow-hidden rounded-lg grid place-items-center text-white/90 text-xl font-semibold tracking-tight">{name.split(' ').map(x => x[0]).slice(0, 2).join('')}<Photo src={src} /></div>
}
export const LogoMark = ({ size = 28, tile = false }: { size?: number; tile?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2F7BFF" /><stop offset="1" stopColor="#1238A8" /></linearGradient></defs>
    {tile && <rect width="64" height="64" rx="14" fill="#17243A" />}
    <path d="M18 14.5c0-2.2 2.4-3.5 4.3-2.4l27 15.6c1.9 1.1 1.9 3.8 0 4.9l-27 15.6c-1.9 1.1-4.3-.2-4.3-2.4z" fill="url(#lg)" />
    <path d="M27 34l6 6 12-13" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Standard page heading: title, optional subtitle, optional actions on the right. */
export const PageHeader = ({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) => (
  <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div className="min-w-0"><h1 className="page-title">{title}</h1>{sub && <p className="page-sub">{sub}</p>}</div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </header>
)
/** Card with a titled header strip. Use for every dashboard section so headings line up. */
export const Section = ({ title, action, children, className = '', flush = false }: { title: string; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) => (
  <section className={`card overflow-hidden ${className}`}><div className="card-head"><h2 className="card-title">{title}</h2>{action}</div><div className={flush ? '' : 'p-5'}>{children}</div></section>
)
export const SearchBox = ({ value, onChange, placeholder, label, className = 'w-full sm:w-64' }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) => (
  <div className={`relative ${className}`}><Search size={16} className="absolute left-3.5 top-3 text-muted pointer-events-none" aria-hidden /><input className="input pl-10" placeholder={placeholder} aria-label={label} value={value} onChange={e => onChange(e.target.value)} /></div>
)
export const ViewToggle = ({ value, onChange }: { value: 'grid' | 'list'; onChange: (v: 'grid' | 'list') => void }) => (
  <div className="ml-auto inline-flex rounded-[10px] border border-line bg-white p-0.5 shadow-card" role="group" aria-label="View">
    {([['grid', LayoutGrid, 'Grid view'], ['list', List, 'List view']] as const).map(([k, I, l]) => (
      <button key={k} aria-label={l} aria-pressed={value === k} onClick={() => onChange(k)} className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${value === k ? 'bg-navy text-white' : 'text-slate2 hover:bg-bg'}`}><I size={16} /></button>))}
  </div>
)
/** Label/value pairs with consistent rhythm. */
export const DL = ({ rows }: { rows: readonly (readonly [string, ReactNode])[] }) => (
  <dl className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr] gap-x-4 gap-y-3 text-sm">{rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>)}</dl>
)
