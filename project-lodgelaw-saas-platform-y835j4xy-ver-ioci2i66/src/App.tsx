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
  layoutRoute.addChildren([
    indexRoute,
    propertiesRoute,
    documentsRoute,
    taxReportsRoute,
    taxEstimatorRoute,
    complianceRoute,
    settingsRoute,
    resolutionCenterRoute,
    guestPacketRoute,
    alertFeedRoute,
    complianceReportRoute,
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
