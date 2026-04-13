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
import { blink } from './blink/client'

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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-primary">LodgeLaw</h1>
            <p className="text-muted-foreground text-lg">The turnkey STR compliance solution for Texas 2026.</p>
          </div>
          <div className="grid gap-4 bg-card p-8 rounded-2xl border border-border shadow-lg">
            <div className="space-y-2 mb-4 text-left">
              <h3 className="font-bold text-lg">Welcome back</h3>
              <p className="text-sm text-muted-foreground">Sign in to manage your short-term rentals.</p>
            </div>
            <button
              onClick={() => blink.auth.login()}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
            >
              Access Command Center
            </button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 justify-center">
              <ShieldCheck className="w-3 h-3 text-accent" />
              <span>Compliant with 2026 Austin & Houston Regulations</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground px-8">
            LodgeLaw is an operational assistant tool. Consult legal professionals for specific ordinance interpretations in your municipality.
          </p>
        </div>
      </div>
    )
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

// Public route — no auth needed
const neighborReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/report/$propertyId',
  component: NeighborReport,
})

// Private routes
const indexRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/', component: Dashboard })
const propertiesRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/properties', component: Properties })
const documentsRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/documents', component: Documents })
const taxReportsRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/tax-reports', component: TaxReports })
const complianceRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/compliance', component: Compliance })
const settingsRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/settings', component: Settings })
const resolutionCenterRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/resolution-center', component: ResolutionCenter })

const routeTree = rootRoute.addChildren([
  neighborReportRoute,
  layoutRoute.addChildren([
    indexRoute,
    propertiesRoute,
    documentsRoute,
    taxReportsRoute,
    complianceRoute,
    settingsRoute,
    resolutionCenterRoute,
  ])
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
