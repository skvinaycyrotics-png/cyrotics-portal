'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  FolderKanban, Ticket, CheckCircle2, Clock, AlertTriangle,
  ArrowRight, Loader2, Plus, TrendingUp, Activity
} from 'lucide-react';

interface ProjectSummary {
  _id: string; name: string; projectId: string; status: string;
  progress: number; endDate?: string; priority: string;
}
interface TicketSummary {
  _id: string; ticketId: string; subject: string; status: string;
  priority: string; createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  planning: 'text-slate-400', in_progress: 'text-cyan-400',
  completed: 'text-green-400', on_hold: 'text-amber-400', cancelled: 'text-red-400',
};
const TICKET_STATUS_COLOR: Record<string, string> = {
  open: 'text-red-400 bg-red-500/10 border-red-500/20',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  resolved: 'text-green-400 bg-green-500/10 border-green-500/20',
  waiting_client: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: ProjectSummary[] }>('/projects?limit=6'),
      api.get<{ data: TicketSummary[] }>('/tickets?limit=5'),
    ]).then(([p, t]) => {
      setProjects(p.data);
      setTickets(t.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cfg = user?.dashboardConfig;
  const accentColor = cfg?.accentColor || '#0ea5e9';
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6"
        style={{ borderColor: `${accentColor}30`, background: `${accentColor}08` }}>
        <h1 className="text-xl font-bold text-white mb-1">
          Welcome back, {user?.name.split(' ')[0]}!
        </h1>
        <p className="text-slate-400 text-sm">
          {cfg?.customMessage || "Here's an overview of your projects and support tickets."}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: accentColor },
          { label: 'Active Projects', value: activeProjects, icon: Activity, color: '#22c55e' },
          { label: 'Open Tickets', value: openTickets, icon: AlertTriangle, color: openTickets > 0 ? '#f59e0b' : '#22c55e' },
          { label: 'Completed', value: completedProjects, icon: CheckCircle2, color: '#22c55e' },
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl" style={{ background: `${kpi.color}18` }}>
                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        {cfg?.showProjects !== false && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-white">My Projects</h2>
                <p className="text-xs text-slate-500 mt-0.5">{projects.length} total</p>
              </div>
              <Link href="/portal/projects" className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: accentColor }}>
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                  <FolderKanban className="h-8 w-8 mb-2" />
                  <p className="text-sm">No projects assigned yet</p>
                </div>
              ) : projects.slice(0, 4).map(p => (
                <Link key={p._id} href={`/portal/projects/${p._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-all group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white group-hover:text-white truncate">{p.name}</p>
                      <span className="text-[10px] font-mono text-slate-600 shrink-0">{p.projectId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${p.progress}%`, background: accentColor }} />
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{p.progress}%</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium shrink-0 ${STATUS_COLOR[p.status] || 'text-slate-400'}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tickets */}
        {cfg?.showTickets !== false && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-white">Support Tickets</h2>
                <p className="text-xs text-slate-500 mt-0.5">{openTickets} open</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/portal/tickets/new"
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium text-white transition-all"
                  style={{ background: `${accentColor}25`, border: `1px solid ${accentColor}40` }}>
                  <Plus className="h-3 w-3" /> New
                </Link>
                <Link href="/portal/tickets" className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: accentColor }}>
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                  <Ticket className="h-8 w-8 mb-2" />
                  <p className="text-sm">No tickets yet</p>
                </div>
              ) : tickets.map(t => (
                <Link key={t._id} href={`/portal/tickets/${t._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-slate-500">{t.ticketId}</span>
                    </div>
                    <p className="text-sm text-slate-200 truncate">{t.subject}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border whitespace-nowrap ${TICKET_STATUS_COLOR[t.status] || 'text-slate-400 bg-slate-700/50 border-slate-700'}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
