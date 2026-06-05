'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Users, FolderKanban, Ticket, MessageSquare, UserPlus,
  TrendingUp, Clock, CheckCircle2, AlertTriangle,
  ArrowUpRight, RefreshCw, Loader2
} from 'lucide-react';

interface DashboardData {
  kpis: {
    totalUsers: number; activeClients: number; pendingApprovals: number;
    totalProjects: number; activeProjects: number; openTickets: number;
    totalContacts: number; pendingRegistrations: number;
  };
  recentContacts: Array<{ _id: string; firstName: string; lastName: string; email: string; subject: string; status: string; createdAt: string }>;
  recentTickets: Array<{ _id: string; ticketId: string; subject: string; status: string; priority: string; createdAt: string; raisedBy: { name: string } }>;
  recentUsers: Array<{ _id: string; name: string; email: string; role: string; status: string; createdAt: string }>;
  monthlyData: Array<{ _id: string; count: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'text-red-400 bg-red-500/10 border-red-500/20',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  resolved: 'text-green-400 bg-green-500/10 border-green-500/20',
  new: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  active: 'text-green-400 bg-green-500/10 border-green-500/20',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-400', high: 'text-orange-400', medium: 'text-amber-400', low: 'text-green-400',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: DashboardData }>('/admin/dashboard');
      setData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
  );

  const kpis = data?.kpis;

  const KPI_CARDS = [
    { label: 'Active Clients', value: kpis?.activeClients, icon: Users, color: 'from-cyan-500 to-cyan-600', change: '+' },
    { label: 'Active Projects', value: kpis?.activeProjects, icon: FolderKanban, color: 'from-indigo-500 to-indigo-600', change: '' },
    { label: 'Open Tickets', value: kpis?.openTickets, icon: Ticket, color: 'from-amber-500 to-orange-500', alert: (kpis?.openTickets || 0) > 5 },
    { label: 'Pending Approvals', value: kpis?.pendingApprovals, icon: UserPlus, color: 'from-purple-500 to-purple-600', alert: (kpis?.pendingApprovals || 0) > 0 },
    { label: 'Total Users', value: kpis?.totalUsers, icon: Users, color: 'from-teal-500 to-teal-600' },
    { label: 'Total Projects', value: kpis?.totalProjects, icon: FolderKanban, color: 'from-blue-500 to-blue-600' },
    { label: 'Contact Requests', value: kpis?.totalContacts, icon: MessageSquare, color: 'from-pink-500 to-pink-600' },
    { label: 'Reg. Requests', value: kpis?.pendingRegistrations, icon: UserPlus, color: 'from-rose-500 to-rose-600' },
  ];

  // Simple bar chart for monthly data
  const monthlyData = data?.monthlyData || [];
  const maxCount = Math.max(...monthlyData.map(m => m.count), 1);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all hover:bg-slate-700 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card, i) => (
          <div key={i} className={`bg-slate-900/60 border rounded-2xl p-5 transition-all hover:scale-[1.02] ${
            card.alert ? 'border-amber-500/30 shadow-amber-500/5 shadow-lg' : 'border-slate-700/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
              {card.alert && <AlertTriangle className="h-4 w-4 text-amber-400" />}
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {card.value ?? <span className="text-slate-600">—</span>}
            </p>
            <p className="text-xs text-slate-400 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly registrations chart */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Registrations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 6 months</p>
            </div>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm">No data yet</div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {monthlyData.map(m => (
                <div key={m._id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-medium">{m.count}</span>
                  <div className="w-full rounded-t-sm bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all"
                    style={{ height: `${(m.count / maxCount) * 100}%`, minHeight: '4px' }} />
                  <span className="text-[10px] text-slate-600 truncate w-full text-center">
                    {m._id.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tickets */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Tickets</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest support requests</p>
            </div>
            <a href="/admin/tickets" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              View all <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="space-y-2">
            {data?.recentTickets.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-6">No tickets yet</p>
            )}
            {data?.recentTickets.map(t => (
              <a key={t._id} href={`/admin/tickets/${t._id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-slate-500">{t.ticketId}</span>
                    <span className={`text-[10px] font-bold uppercase ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  </div>
                  <p className="text-sm text-slate-200 truncate group-hover:text-white transition-colors">{t.subject}</p>
                  <p className="text-xs text-slate-500">{t.raisedBy?.name}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border whitespace-nowrap ${STATUS_COLORS[t.status] || 'text-slate-400 bg-slate-700/50 border-slate-700'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contact Requests */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Contacts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Website form submissions</p>
            </div>
            <a href="/admin/contacts" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              View all <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="space-y-2">
            {data?.recentContacts.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-6">No contacts yet</p>
            )}
            {data?.recentContacts.map(c => (
              <a key={c._id} href={`/admin/contacts`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {c.firstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{c.subject}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border whitespace-nowrap ${STATUS_COLORS[c.status] || 'text-slate-400 bg-slate-700/50 border-slate-700'}`}>
                  {c.status}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Users</h3>
              <p className="text-xs text-slate-500 mt-0.5">Newly registered accounts</p>
            </div>
            <a href="/admin/users" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              View all <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="space-y-2">
            {data?.recentUsers.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-6">No users yet</p>
            )}
            {data?.recentUsers.map(u => (
              <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    u.role === 'admin' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                    u.role === 'client' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                    'text-slate-400 bg-slate-700/50 border-slate-700'
                  }`}>{u.role}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[u.status] || 'text-slate-400 bg-slate-700/50 border-slate-700'}`}>
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
