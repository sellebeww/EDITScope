import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronsLeft, ChevronsRight, FileText, FolderKanban, Gauge, HelpCircle, Image, LifeBuoy, LogOut, Menu, Scale, Search, Settings, ShieldCheck } from 'lucide-react'
import { useApp } from './store'
import { Avatar, LogoMark, Modal } from './ui'
import { Login, Onboarding, Register } from './pages/Auth'
import Overview from './pages/Overview'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Library from './pages/Library'
import { PermissionDetail, Permissions } from './pages/Permissions'
import ReviewCenter from './pages/Review'
import Reports from './pages/Reports'
import Team from './pages/Team'
import Notifications from './pages/Notifications'
import Landing from './pages/Landing'

const NAV = [
  { to: '/', label: 'Overview', icon: Gauge }, { to: '/projects', label: 'Projects', icon: FolderKanban }, { to: '/library', label: 'Asset Library', icon: Image },
  { to: '/permissions', label: 'Rights & Permissions', icon: Scale }, { to: '/review', label: 'Review Center', icon: ShieldCheck }, { to: '/reports', label: 'Reports', icon: FileText }, { to: '/team', label: 'Team & Settings', icon: Settings },
]
const LABELS: Record<string, string> = { projects: 'Projects', library: 'Asset Library', permissions: 'Rights & Permissions', review: 'Review Center', reports: 'Reports', team: 'Team & Settings', notifications: 'Notifications' }

function Shell() {
  const { s, me, logout, switchUser, toast } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  useEffect(() => { // "/" focuses global search, like most work tools
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) && !t.isContentEditable) { e.preventDefault(); document.querySelector<HTMLInputElement>('input[aria-label="Global search"]')?.focus() }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])
  const unread = s.notices.filter(n => !n.read).length
  const parts = loc.pathname.split('/').filter(Boolean)
  const crumbs = parts.map((p, i) => ({ label: i === 0 ? LABELS[p] ?? p : s.projects.find(x => x.id === p)?.name ?? p, to: '/' + parts.slice(0, i + 1).join('/') }))
  const w = collapsed ? 'md:w-16' : 'md:w-60'
  return (
    <div className="min-h-screen flex">
      {mobile && <div className="fixed inset-0 bg-navy/40 z-30 md:hidden" onClick={() => setMobile(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 ${w} bg-navy text-white flex flex-col transition-transform ${mobile ? '' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <LogoMark size={30} tile />
          {!collapsed && <span className="font-semibold tracking-tight text-[15px]">EDIT<span className="font-normal">Scope</span></span>}
        </div>
        {!collapsed && <div className="mx-3 mt-4 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3"><p className="text-xs text-white/50">Workspace</p><p className="text-sm font-medium truncate mt-0.5">{s.workspace.name}</p></div>}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setMobile(false)} title={n.label}
              className={({ isActive }) => `flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm transition-colors ${collapsed ? 'justify-center px-0' : ''} ${isActive ? 'bg-white/12 text-white font-medium shadow-[inset_3px_0_0_#6EA3F0]' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
              <n.icon size={18} className="shrink-0" />{!collapsed && n.label}
            </NavLink>))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <button onClick={() => setHelp(true)} title="Help Center" className={`flex w-full items-center gap-3 h-10 px-3 rounded-[10px] text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors ${collapsed ? 'justify-center px-0' : ''}`}><LifeBuoy size={18} />{!collapsed && 'Help Center'}</button>
          <button onClick={() => setCollapsed(c => !c)} className={`hidden md:flex w-full items-center gap-3 h-10 px-3 rounded-[10px] text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors ${collapsed ? 'justify-center px-0' : ''}`} aria-label="Toggle sidebar">{collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} />Collapse</>}</button>
          <div className={`flex items-center gap-3 px-3 pt-3 mt-1 border-t border-white/10 ${collapsed ? 'justify-center px-0' : ''}`}><Avatar name={me!.name} size={32} />{!collapsed && <div className="min-w-0"><p className="text-sm font-medium truncate">{me!.name}</p><p className="text-xs text-white/50">{me!.role}</p></div>}</div>
        </div>
      </aside>
      <div className={`flex-1 min-w-0 ${collapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        <header className="h-16 bg-white/85 backdrop-blur border-b border-line flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
          <button className="md:hidden grid h-10 w-10 -ml-2 place-items-center rounded-lg hover:bg-bg" aria-label="Menu" onClick={() => setMobile(true)}><Menu size={20} /></button>
          <nav aria-label="Breadcrumb" className="text-sm flex items-center gap-2 min-w-0 truncate">
            <Link to="/" className="text-muted hover:text-navy">Home</Link>
            {crumbs.map((c, i) => <span key={c.to} className="flex items-center gap-1.5 min-w-0"><span className="text-muted">/</span>{i === crumbs.length - 1 ? <span className="font-medium truncate">{c.label}</span> : <Link to={c.to} className="text-muted hover:text-navy">{c.label}</Link>}</span>)}
          </nav>
          <form className="ml-auto relative hidden sm:block" onSubmit={e => { e.preventDefault(); const q = new FormData(e.currentTarget).get('q') as string; nav(`/library?q=${encodeURIComponent(q)}`) }}>
            <Search size={16} className="absolute left-3.5 top-3 text-muted" /><input name="q" className="input pl-10 w-64 lg:w-72 bg-bg/60" placeholder="Search assets…  ( / )" aria-label="Global search" />
          </form>
          <Link to="/notifications" className="relative grid h-10 w-10 place-items-center rounded-lg text-slate2 hover:bg-bg hover:text-navy transition-colors ml-auto sm:ml-0" aria-label="Notifications"><Bell size={18} />{unread > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-bad text-white text-[10px] font-medium grid place-items-center ring-2 ring-white">{unread}</span>}</Link>
          <button className="hidden sm:grid h-10 w-10 place-items-center rounded-lg text-slate2 hover:bg-bg hover:text-navy transition-colors" aria-label="Help" onClick={() => setHelp(true)}><HelpCircle size={18} /></button>
          <div className="relative">
            <button onClick={() => setMenu(m => !m)} aria-label="Account menu"><Avatar name={me!.name} size={32} /></button>
            {menu && <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />}
            {menu && <div className="anim-pop absolute right-0 mt-2 w-72 card p-4 space-y-4 z-30 shadow-xl">
              <div><p className="text-sm font-medium">{me!.name}</p><p className="text-xs text-muted">{me!.email}</p></div>
              <label className="block label">View as (demo role switcher)
                <select className="input mt-1.5" value={me!.id} onChange={e => { switchUser(e.target.value); toast('Role switched for demo'); setMenu(false) }}>{s.users.map(u => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}</select></label>
              <button className="btn w-full" onClick={logout}><LogOut size={14} />Sign out</button>
            </div>}
          </div>
        </header>
        <main key={loc.pathname} className="anim-page p-4 sm:p-6 lg:p-8 max-w-[1360px] mx-auto"><Routes>
          <Route path="/" element={<Overview />} /><Route path="/projects" element={<Projects />} /><Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/library" element={<Library />} /><Route path="/permissions" element={<Permissions />} /><Route path="/permissions/:id" element={<PermissionDetail />} />
          <Route path="/review" element={<ReviewCenter />} /><Route path="/reports" element={<Reports />} /><Route path="/team" element={<Team />} /><Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes></main>
      </div>
      {help && <Modal title="Help Center" onClose={() => setHelp(false)}>
        <div className="space-y-4 text-sm text-slate2 leading-relaxed">
          <p><b className="text-navy">Workflow:</b> Create project → add assets → define usage → check rights → review findings → compare recommendations → apply changes → recheck → export report.</p>
          <p><b className="text-navy">Statuses:</b> Verified = recorded permission matches. Conditional = allowed if conditions are met. Conflict = a recorded restriction clashes with the usage. Unverified = information missing or awaiting a human.</p>
          <p>EDITScope compares recorded permissions with your intended usage using fixed rules. It is not legal advice and never treats missing information as permission.</p>
        </div></Modal>}
    </div>
  )
}

function Toaster() {
  const { toasts, dismiss } = useApp()
  return (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2 w-80 max-w-[calc(100vw-2rem)]" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`anim-toast card shadow-lg px-3.5 py-2.5 text-sm flex items-start gap-2 border-l-4 ${t.kind === 'ok' ? 'border-l-ok' : 'border-l-bad'}`}>
          <span className="flex-1"><b className="sr-only">{t.kind === 'ok' ? 'Success: ' : 'Error: '}</b>{t.text}</span>
          <button aria-label="Dismiss" className="text-muted hover:text-navy" onClick={() => dismiss(t.id)}>×</button>
        </div>))}
    </div>
  )
}

export default function App() {
  const { me, s } = useApp()
  const body = !me ? <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="*" element={<Navigate to="/" />} /></Routes> : !s.onboarded ? <Onboarding /> : <Shell />
  return <>{body}<Toaster /></>
}
