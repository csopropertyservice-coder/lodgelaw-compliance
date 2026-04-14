import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router'
import { Toaster } from '@blinkdotnew/ui'
import { useAuth } from './hooks/useAuth'
import { DashboardLayout } from './components/DashboardLayout'
import { Loader2 } from 'lucide-react'
import { Dashboard } from './pages/Dashboard'
import { Properties } from './pages/Properties'
import { Documents } from './pages/Documents'
import { TaxReports } from './pages/TaxReports'
import { Compliance } from './pages/Compliance'
import { Settings } from './pages/Settings'
import { ResolutionCenter } from './pages/ResolutionCenter'
import { NeighborReport } from './pages/NeighborReport'
import { TaxEstimator } from './pages/TaxEstimator'
import { LandingPage } from './pages/LandingPage'
import { GuestPacket } from './pages/GuestPacket'
import { AlertFeed } from './pages/AlertFeed'
import { ComplianceReport } from './pages/ComplianceReport'
import { useState } from 'react'
import { supabase } from './lib/supabaseClient'

function LoginScreen() {
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('login')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={ls.wrapper}>
      <div style={ls.card}>
        <div style={ls.logo}>⚖️ LodgeLaw</div>
        <h2 style={ls.title}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p style={ls.subtitle}>{mode === 'login' ? 'Sign in to manage your short-term rentals.' : 'Get started with LodgeLaw for free.'}</p>

        {/* Google login */}
        <button style={ls.googleBtn} onClick={() => login()}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
          Continue with Google
        </button>

        <div style={ls.divider}><span style={ls.dividerText}>or</span></div>

        {/* Email/password */}
        <div style={ls.field}>
          <label style={ls.label}>Email</label>
          <input
            style={ls.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div style={ls.field}>
          <label style={ls.label}>Password</label>
          <input
            style={ls.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {mode === 'login' && (
          <div style={ls.rememberRow}>
            <label style={ls.rememberLabel}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ marginRight: '6px' }}
              />
              Remember me
            </label>
            <button
              style={ls.forgotBtn}
              onClick={async () => {
                if (!email) { setError('Enter your email first.'); return }
                await supabase.auth.resetPasswordForEmail(email)
                setSuccess('Password reset email sent!')
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && <div style={ls.error}>{error}</div>}
        {success && <div style={ls.successMsg}>{success}</div>}

        <button style={ls.submitBtn} onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <p style={ls.switchText}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button style={ls.switchBtn} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>

        <p style={ls.disclaimer}>
          LodgeLaw is an operational assistant tool. Consult legal professionals for specific ordinance interpretations.
        </p>
      </div>
    </div>
  )
}

const ls: Record<string, any> = {
  wrapper: { minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' },
  card: { background: '#fff', borderRadius: '20px', padding: '40px', maxWidth: '420px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  logo: { fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', textAlign: 'center' },
  title: { fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', textAlign: 'center' },
  subtitle: { fontSize: '13px', color: '#64748b', margin: '0 0 24px 0', textAlign: 'center' },
  googleBtn: { width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  divider: { textAlign: 'center', position: 'relative', marginBottom: '20px', borderTop: '1px solid #e2e8f0' },
  dividerText: { position: 'relative', top: '-10px', background: '#fff', padding: '0 12px', fontSize: '12px', color: '#94a3b8', fontWeight: '600' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '14px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' },
  rememberRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  rememberLabel: { display: 'flex', alignItems: 'center', fontSize: '13px', color: '#374151', cursor: 'pointer' },
  forgotBtn: { background: 'none', border: 'none', fontSize: '13px', color: '#6366f1', cursor: 'pointer', fontWeight: '600' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px' },
  successMsg: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px' },
  submitBtn: { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '16px' },
  switchText: { textAlign: 'center', fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' },
  switchBtn: { background: 'none', border: 'none', color: '#6366f1', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
  disclaimer: { fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 0, lineHeight: '1.5' },
}

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage />
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  ),
})

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: AppShell,
})

const neighborReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/report/$propertyId',
  component: NeighborReport,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
})

const indexRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/', component: Dashboard })
const propertiesRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/properties', component: Properties })
const documentsRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/documents', component: Documents })
const taxReportsRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/tax-reports', component: TaxReports })
const taxEstimatorRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/tax-estimator', component: TaxEstimator })
const complianceRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/compliance', component: Compliance })
const settingsRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/settings', component: Settings })
const resolutionCenterRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/resolution-center', component: ResolutionCenter })
const guestPacketRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/guest-packet', component: GuestPacket })
const alertFeedRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/alert-feed', component: AlertFeed })
const complianceReportRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/compliance-report', component: ComplianceReport })

const routeTree = rootRoute.addChildren([
  neighborReportRoute,
  loginRoute,
  layoutRoute.addChildren([
    indexRoute, propertiesRoute, documentsRoute, taxReportsRoute,
    taxEstimatorRoute, complianceRoute, settingsRoute, resolutionCenterRoute,
    guestPacketRoute, alertFeedRoute, complianceReportRoute,
  ])
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

export default function App() {
  return <RouterProvider router={router} />
}
