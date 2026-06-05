'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, FolderKanban, Ticket, MessageSquare,
  UserPlus, FileText, Briefcase, Star, Share2, Shield,
  ScrollText, LogOut, Menu, X, Bell, ChevronDown,
  Settings, Loader2
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Users',
    items: [
      { href: '/admin/users', icon: Users, label: 'All Users' },
      { href: '/admin/registrations', icon: UserPlus, label: 'Access Requests', badge: 'pending' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/projects', icon: FolderKanban, label: 'Projects' },
      { href: '/admin/tickets', icon: Ticket, label: 'Support Tickets' },
      { href: '/admin/contacts', icon: MessageSquare, label: 'Contact Requests' },
    ],
  },
  {
    label: 'Content (CMS)',
    items: [
      { href: '/admin/cms/testimonials', icon: Star, label: 'Testimonials' },
      { href: '/admin/cms/blogs', icon: FileText, label: 'Blog Posts' },
      { href: '/admin/cms/jobs', icon: Briefcase, label: 'Job Listings' },
      { href: '/admin/cms/social', icon: Share2, label: 'Social Links' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace('/login');
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    // Fetch pending registration count
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/registrations?status=pending&limit=1`, {
      credentials: 'include',
    }).then(r => r.json()).then(d => setPendingCount(d.pagination?.total || 0)).catch(() => {});
  }, []);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-700/50 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wider">CYROTICS</p>
            <p className="text-[10px] text-cyan-400 font-medium tracking-widest uppercase">Admin Console</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                          active
                            ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/10 text-cyan-300 border border-cyan-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}>
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {'badge' in item && item.badge === 'pending' && pendingCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                            {pendingCount}
                          </span>
                        )}
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">Administrator</p>
            </div>
            <button onClick={logout} title="Sign out"
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
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

          {/* Breadcrumb */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 truncate">
              Admin Console <span className="text-slate-600 mx-1">/</span>
              <span className="text-slate-200">
                {NAV_GROUPS.flatMap(g => g.items).find(i => pathname === i.href || pathname.startsWith(i.href + '/'))?.label || 'Overview'}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              <Bell className="h-4 w-4" />
              {pendingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <Link href="https://www.cyrotics.in" target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white text-xs font-medium transition-all">
              <Shield className="h-3 w-3" /> View Site
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
