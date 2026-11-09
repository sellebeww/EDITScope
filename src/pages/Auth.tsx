import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, FileCheck2, GitCompare, ShieldCheck } from 'lucide-react'
import { useApp } from '../store'
import { Field, LogoMark } from '../ui'

const Brand = ({ light }: { light?: boolean }) => <div className={`flex items-center gap-2.5 ${light ? '' : 'justify-center mb-6'}`}><LogoMark size={36} tile /><span className={`text-xl font-semibold tracking-tight ${light ? 'text-white' : ''}`}>EDIT<span className="font-normal">Scope</span></span></div>
const POINTS = [
  { i: ShieldCheck, t: 'Recorded permissions, not guesses', d: 'Every finding cites the license record it came from.' },
  { i: GitCompare, t: 'Minimum-change options', d: 'Replace, request, or re-scope. Compare before you accept.' },
  { i: FileCheck2, t: 'Humans stay in the loop', d: 'Unclear cases go to a reviewer, never auto-approved.' },
]
const Frame = ({ children, tag }: { children: React.ReactNode; tag?: string }) => (
  <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
    <aside className="hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white relative overflow-hidden" style={{ background: 'linear-gradient(155deg,#17243A 0%,#223653 55%,#1C3F7A 100%)' }}>
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-info/20 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#2F7BFF]/15 blur-3xl" aria-hidden />
      <Brand light />
      <div className="relative max-w-md">
        <h2 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight">Turn license fine print into clear editing decisions.</h2>
        <ul className="mt-10 space-y-6 stagger">{POINTS.map(p => <li key={p.t} className="flex gap-3"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10"><p.i size={18} aria-hidden /></span><div><p className="font-medium">{p.t}</p><p className="text-sm text-white/65">{p.d}</p></div></li>)}</ul>
      </div>
      <p className="relative text-sm text-white/60">Create freely. Use responsibly.</p>
    </aside>
    <main className="grid place-items-center p-4 sm:p-8"><div className="w-full max-w-md anim-page"><div className="lg:hidden"><Brand /></div><div className="card p-6 sm:p-8 shadow-lg">{children}</div><p className="text-center text-xs text-muted mt-4">{tag ?? 'Demo data. Not a legal opinion.'}</p></div></main>
  </div>
)
const emailOk = (e: string) => /^\S+@\S+\.\S+$/.test(e)

export function Login() {
  const { login, toast } = useApp()
  const [email, setEmail] = useState('dana@northstar.studio'), [pw, setPw] = useState('demo1234'), [show, setShow] = useState(false), [err, setErr] = useState<Record<string, string>>({})
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const x: Record<string, string> = {}
    if (!emailOk(email)) x.email = 'Enter a valid email address.'
    if (pw.length < 6) x.pw = 'Password must be at least 6 characters.'
    if (!Object.keys(x).length) { const r = login(email, pw); if (r) x.email = r }
    setErr(x)
  }
  return (
    <Frame>
      <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1><p className="text-sm text-muted mt-1 mb-6">Sign in to your workspace. Demo account is prefilled.</p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email address" error={err.email}><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password" error={err.pw}><div className="relative"><input className="input pr-9" type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} />
          <button type="button" className="absolute right-2.5 top-2.5 text-muted" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(s => !s)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>
        <div className="flex flex-wrap gap-2 justify-between text-sm"><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Remember me</label><button type="button" className="text-info font-medium hover:underline" onClick={() => toast('Demo only: no password reset email is sent.')}>Forgot password?</button></div>
        <button className="btn btn-primary w-full">Sign in</button>
        <button type="button" className="btn w-full" onClick={() => toast('Google sign-in is not connected in this demo.', 'err')}>Continue with Google</button>
      </form>
      <p className="text-sm text-center mt-6 text-muted">New here? <Link to="/register" className="text-info font-medium hover:underline">Create a workspace</Link></p>
    </Frame>
  )
}

export function Register() {
  const { register } = useApp(), nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', pw: '', org: '', type: 'Creative Agency', size: '1–10' }), [err, setErr] = useState<Record<string, string>>({})
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const x: Record<string, string> = {}
    if (!f.name.trim()) x.name = 'Required.'; if (!emailOk(f.email)) x.email = 'Enter a valid work email.'
    if (f.pw.length < 8) x.pw = 'Use at least 8 characters.'; if (!f.org.trim()) x.org = 'Required.'
    setErr(x); if (!Object.keys(x).length) { register(f.name, f.email, f.org, f.type); nav('/') }
  }
  return (
    <Frame>
      <h1 className="text-xl font-semibold tracking-tight mb-6">Create your workspace</h1>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={err.name}><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Work email" error={err.email}><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Password" error={err.pw}><input className="input" type="password" value={f.pw} onChange={set('pw')} /></Field>
        <Field label="Company or organization" error={err.org}><input className="input" value={f.org} onChange={set('org')} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Organization type"><select className="input" value={f.type} onChange={set('type')}>{['Creative Agency', 'Marketing Team', 'Production House', 'Brand Management', 'Independent Creator', 'Other'].map(o => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Team size"><select className="input" value={f.size} onChange={set('size')}>{['1–10', '11–50', '51–200', '200+'].map(o => <option key={o}>{o}</option>)}</select></Field>
        </div>
        <button className="btn btn-primary w-full">Create workspace</button>
      </form>
      <p className="text-sm text-center mt-6 text-muted">Have an account? <Link to="/login" className="text-info font-medium hover:underline">Sign in</Link></p>
    </Frame>
  )
}

export function Onboarding() {
  const { s, finishOnboarding, setWorkspace, invite, createProject, toast } = useApp()
  const [step, setStep] = useState(0), [name, setName] = useState(s.workspace.name), [email, setEmail] = useState(''), [pn, setPn] = useState(''), [err, setErr] = useState('')
  const steps = ['Set up workspace', 'Organization type', 'Invite team', 'First project']
  const next = () => {
    setErr('')
    if (step === 0 && !name.trim()) return setErr('Workspace name is required.')
    if (step === 0) setWorkspace(name, s.workspace.orgType)
    if (step === 2 && email && !emailOk(email)) return setErr('Enter a valid email or leave blank.')
    if (step === 2 && email) invite(email, 'Editor')
    if (step === 3) {
      if (!pn.trim()) return setErr('Give the project a name, or choose Skip for now.')
      createProject({ name: pn, description: '', client: '', category: 'Other', usages: ['Organic social media'], channels: ['Instagram'], region: 'Worldwide', commercial: true, scope: 'Public', start: new Date().toISOString().slice(0, 10), end: new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10) })
      toast('Project created')
    }
    if (step === 3) finishOnboarding(); else setStep(step + 1)
  }
  return (
    <Frame tag={`Step ${step + 1} of 4`}>
      <div className="flex gap-1.5 mb-6" aria-label="Progress">{steps.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-navy' : 'bg-line'}`} />)}</div>
      <h1 className="text-xl font-semibold tracking-tight mb-5">{steps[step]}</h1>
      {step === 0 && <Field label="Workspace name" error={err}><input className="input" value={name} onChange={e => setName(e.target.value)} /></Field>}
      {step === 1 && <Field label="Organization type"><select className="input" value={s.workspace.orgType} onChange={e => setWorkspace(s.workspace.name, e.target.value)}>{['Creative Agency', 'Marketing Team', 'Production House', 'Brand Management', 'Independent Creator', 'Other'].map(o => <option key={o}>{o}</option>)}</select></Field>}
      {step === 2 && <Field label="Teammate email (optional)" error={err}><input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" /></Field>}
      {step === 3 && <Field label="Project name" error={err}><input className="input" value={pn} onChange={e => setPn(e.target.value)} /></Field>}
      <div className="flex flex-wrap gap-2 justify-between mt-7"><button className="btn btn-ghost" onClick={finishOnboarding}>Skip for now</button><div className="flex gap-2">{step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Back</button>}<button className="btn btn-primary" onClick={next}>{step === 3 ? 'Finish' : 'Continue'}</button></div></div>
    </Frame>
  )
}
