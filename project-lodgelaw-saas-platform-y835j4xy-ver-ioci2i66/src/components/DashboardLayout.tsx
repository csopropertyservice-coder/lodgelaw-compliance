import React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard, Home, FileText, Receipt, ShieldCheck,
  Settings, MessageSquareWarning, Calculator, Bell,
  BookOpen, FileBarChart2,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { path: '/',             label: 'Dashboard',      icon: LayoutDashboard },
      { path: '/alert-feed',   label: 'Alert Feed',     icon: Bell },
    ]
  },
  {
    label: 'Portfolio',
    items: [
      { path: '/properties',   label: 'Properties',     icon: Home },
      { path: '/documents',    label: 'Documents',      icon: FileText },
      { path: '/guest-packet', label: 'Guest Packets',  icon: BookOpen },
    ]
  },
  {
    label: 'Finance',
    items: [
      { path: '/tax-reports',  label: 'Tax Reports',    icon: Receipt },
      { path: '/tax-estimator',label: 'Tax Estimator',  icon: Calculator },
    ]
  },
  {
    label: 'Compliance',
    items: [
      { path: '/compliance',         label: 'Ordinances',       icon: ShieldCheck },
      { path: '/resolution-center',  label: 'Resolution Center',icon: MessageSquareWarning },
      { path: '/compliance-report',  label: 'Reports',          icon: FileBarChart2 },
    ]
  },
  {
    label: 'Account',
    items: [
      { path: '/settings', label: 'Settings', icon: Settings },
    ]
  },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <aside style={{
        width: '220px',
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        flexShrink: 0,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        overflowY: 'auto',
      }}>
        <div style={{
          fontSize: '14px', fontWeight: '800', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#f59e0b',
          padding: '0 12px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '18px' }}>⚖️</span> LodgeLaw
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '9px', fontWeight: '700', color: '#475569',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '0 12px', marginBottom: '4px',
              }}>
                {section.label}
              </div>
              {section.items.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '9px',
                      padding: '8px 12px', borderRadius: '8px',
                      fontSize: '13px', fontWeight: '500',
                      color: isActive ? '#f8fafc' : '#94a3b8',
                      textDecoration: 'none',
                      background: isActive ? '#1e293b' : 'transparent',
                    }}
                  >
                    <Icon size={15} />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {user && (
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', color: 'white', fontWeight: '700', flexShrink: 0,
              }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              style={{
                width: '100%', padding: '7px 12px', borderRadius: '8px',
                border: 'none', background: 'transparent', color: '#ef4444',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
