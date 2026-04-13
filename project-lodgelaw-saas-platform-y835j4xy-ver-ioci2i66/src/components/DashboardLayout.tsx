import React from 'react'
import { AppShell, AppShellSidebar, AppShellMain, MobileSidebarTrigger, SidebarItem, Button, Avatar, AvatarImage, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@blinkdotnew/ui'
import { LayoutDashboard, Home, FileText, CreditCard, AlertTriangle, Settings, LogOut, ShieldCheck } from 'lucide-react'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { Link, useLocation } from '@tanstack/react-router'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const pathname = location.pathname

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <AppShell>
      <AppShellSidebar className="shrink-0">
        <div className="flex flex-col h-full w-[15rem] bg-sidebar border-r border-sidebar-border overflow-hidden">
          <div className="shrink-0 border-b border-sidebar-border px-5 py-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">LodgeLaw</span>
          </div>
          
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
            <SidebarItem 
              icon={<LayoutDashboard size={18} />} 
              label="Dashboard" 
              href="/" 
              active={pathname === '/'} 
            />
            <SidebarItem 
              icon={<Home size={18} />} 
              label="Properties" 
              href="/properties" 
              active={pathname === '/properties'} 
            />
            <SidebarItem 
              icon={<FileText size={18} />} 
              label="Documents" 
              href="/documents" 
              active={pathname === '/documents'} 
            />
            <SidebarItem 
              icon={<CreditCard size={18} />} 
              label="Tax Reports" 
              href="/tax-reports" 
              active={pathname === '/tax-reports'} 
            />
            <SidebarItem 
              icon={<AlertTriangle size={18} />} 
              label="Compliance" 
              href="/compliance" 
              active={pathname === '/compliance'} 
            />
          </div>
          
          <div className="shrink-0 border-t border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group">
                  <Avatar className="w-8 h-8 border border-sidebar-border group-hover:border-sidebar-primary">
                    <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium truncate w-full">{user?.displayName || 'STR Operator'}</span>
                    <span className="text-xs text-sidebar-foreground/60 truncate w-full">{user?.email}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AppShellSidebar>
      
      <AppShellMain className="bg-background flex flex-col h-full">
        <header className="md:hidden flex items-center justify-between px-4 h-16 border-b border-border bg-card sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <MobileSidebarTrigger />
            <span className="font-bold text-lg">LodgeLaw</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </AppShellMain>
    </AppShell>
  )
}
