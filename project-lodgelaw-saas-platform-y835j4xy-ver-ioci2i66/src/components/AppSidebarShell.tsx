import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Home,
  FileText,
  Receipt,
  ShieldCheck,
  Settings,
  MessageSquareWarning,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/',                  label: 'Dashboard',          icon: LayoutDashboard },
  { path: '/properties',        label: 'Properties',         icon: Home },
  { path: '/documents',         label: 'Documents',          icon: FileText },
  { path: '/tax-reports',       label: 'Tax Reports',        icon: Receipt },
  { path: '/compliance',        label: 'Compliance',         icon: ShieldCheck },
  { path: '/resolution-center', label: 'Resolution Center',  icon: MessageSquareWarning },
  { path: '/settings',          label: 'Settings',           icon: Settings },
]

export function AppSidebarShell() {
  const location = useLocation()

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>LodgeLaw</div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <Icon size={16} style={styles.icon} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '220px',
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 12px',
    gap: '4px',
    flexShrink: 0,
  },
  logo: {
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6366f1',
    padding: '0 12px',
    marginBottom: '24px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#94a3b8',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  navItemActive: {
    background: '#1e293b',
    color: '#f8fafc',
  },
  icon: {
    flexShrink: 0,
  },
}
