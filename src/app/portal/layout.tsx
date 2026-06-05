'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, FolderKanban, Ticket, User,
  Shield, LogOut, Menu, X, Bell, Loader2,
  ChevronRight
} from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
    if (!loading && isAuthenticated && user?.role === 'admin') router.replace('/admin/dashboard');
  }, [loading, isAuthenticated, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const cfg = user.dashboardConfig;
  const accentColor = cfg?.accentColor || '#0ea5e9';

  const NAV_ITEMS = [
    { href: '/portal/dashboard', icon: LayoutDashboard, label: 'Dashboard', always: true },
    ...(cfg?.showProjects !== false ? [{ href: '/portal/projects', icon: FolderKanban, label: 'My Projects' }] : []),
    ...(cfg?.showTickets !== false ? [{ href: '/portal/tickets', icon: Ticket, label: 'Support Tickets' }] : []),
    { href: '/portal/profile', icon: User, label: 'My Profile', always: true },
  ];

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-700/50 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #6366f1)` }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wider">CYROTICS</p>
            <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: accentColor }}>
              {user.role === 'guest' ? 'Guest Portal' : 'Client Portal'}
            </p>
          </div>
        </div>

        {/* Custom message */}
        {cfg?.customMessage && (
          <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl border text-xs text-slate-300 leading-relaxed"
            style={{ background: `${accentColor}10`, borderColor: `${accentColor}30` }}>
            {cfg.customMessage}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                style={active ? { background: `${accentColor}18`, borderColor: `${accentColor}30`, border: `1px solid ${accentColor}30` } : {}}>
                <item.icon className="h-4 w-4 shrink-0" style={active ? { color: accentColor } : {}} />
                <span className="flex-1">{item.label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColor }} />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #6366f1)` }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider capitalize" style={{ color: accentColor }}>
                {user.role}
              </p>
            </div>
            <button onClick={logout} title="Sign out"
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          {user.company && (
            <p className="text-[10px] text-slate-600 text-center mt-2 truncate">{user.company}</p>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(s => !s)} className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-all">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-slate-500">Portal</span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-slate-300">
                {NAV_ITEMS.find(i => pathname === i.href || pathname.startsWith(i.href + '/'))?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <Bell className="h-4 w-4" />
            </button>
            <Link href="https://www.cyrotics.in" target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white text-xs font-medium transition-all">
              <Shield className="h-3 w-3" /> cyrotics.in
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
