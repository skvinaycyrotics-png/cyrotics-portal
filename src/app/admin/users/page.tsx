'use client';

import { useEffect, useState } from 'react';
import api, { ApiError } from '@/lib/api';
import {
  Search, Filter, CheckCircle2, XCircle, Ban, Trash2,
  Settings, Loader2, ChevronLeft, ChevronRight, User,
  Shield, Eye, X
} from 'lucide-react';

interface UserData {
  _id: string; name: string; email: string; company?: string;
  role: string; status: string; createdAt: string; lastLogin?: string;
  mobile?: string; designation?: string; approvedBy?: { name: string };
}

interface DashboardConfigForm {
  showProjects: boolean; showTickets: boolean; showDocuments: boolean;
  showAnnouncements: boolean; customMessage: string; accentColor: string;
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  client: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  guest: 'text-slate-400 bg-slate-700/50 border-slate-700',
};
const STATUS_BADGE: Record<string, string> = {
  active: 'text-green-400 bg-green-500/10 border-green-500/20',
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  suspended: 'text-red-400 bg-red-500/10 border-red-500/20',
  rejected: 'text-slate-400 bg-slate-700/50 border-slate-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [dashConfig, setDashConfig] = useState<DashboardConfigForm>({
    showProjects: true, showTickets: true, showDocuments: true,
    showAnnouncements: true, customMessage: '', accentColor: '#0ea5e9',
  });
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: UserData[]; pagination: { pages: number } }>(
        '/admin/users', { page, limit: 15, ...(search && { search }), ...(roleFilter && { role: roleFilter }), ...(statusFilter && { status: statusFilter }) }
      );
      setUsers(res.data);
      setTotalPages(res.pagination.pages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter, statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const action = async (id: string, endpoint: string, body?: object) => {
    setActionLoading(id + endpoint);
    try {
      await api.put(`/admin/users/${id}/${endpoint}`, body);
      showToast('Action completed successfully.');
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Action failed.');
    }
    setActionLoading('');
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Permanently delete this user?')) return;
    setActionLoading(id + 'delete');
    try {
      await api.delete(`/admin/users/${id}`);
      showToast('User deleted.');
      fetchUsers();
    } catch { showToast('Delete failed.'); }
    setActionLoading('');
  };

  const saveDashConfig = async () => {
    if (!selectedUser) return;
    await action(selectedUser._id, 'dashboard-config', dashConfig);
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage portal accounts and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, company..."
            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
          <option value="guest">Guest</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <User className="h-8 w-8 mb-2" /><p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['User', 'Role', 'Status', 'Company', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg border ${ROLE_BADGE[user.role] || ROLE_BADGE.guest}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg border ${STATUS_BADGE[user.status] || STATUS_BADGE.pending}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{user.company || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {user.status === 'pending' && (
                          <button onClick={() => action(user._id, 'approve', { role: user.role })}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-all" title="Approve">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {user.status === 'pending' && (
                          <button onClick={() => action(user._id, 'reject')}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="Reject">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button onClick={() => action(user._id, 'suspend')}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-all" title="Suspend">
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => { setSelectedUser(user); }}
                          className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all" title="Dashboard Config">
                          <Settings className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteUser(user._id)}
                          disabled={!!actionLoading}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Config Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Dashboard Config</h2>
                <p className="text-sm text-slate-400">{selectedUser.name}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'showProjects', label: 'Show Projects' },
                { key: 'showTickets', label: 'Show Tickets' },
                { key: 'showDocuments', label: 'Show Documents' },
                { key: 'showAnnouncements', label: 'Show Announcements' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-300">{label}</span>
                  <button type="button"
                    onClick={() => setDashConfig(c => ({ ...c, [key]: !c[key as keyof DashboardConfigForm] as boolean }))}
                    className={`w-10 h-5 rounded-full transition-all ${dashConfig[key as keyof DashboardConfigForm] ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${dashConfig[key as keyof DashboardConfigForm] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </label>
              ))}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Custom Message</label>
                <input value={dashConfig.customMessage}
                  onChange={e => setDashConfig(c => ({ ...c, customMessage: e.target.value }))}
                  placeholder="Welcome message for this client..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={dashConfig.accentColor}
                    onChange={e => setDashConfig(c => ({ ...c, accentColor: e.target.value }))}
                    className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer" />
                  <span className="text-sm font-mono text-slate-400">{dashConfig.accentColor}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={saveDashConfig} disabled={!!actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50">
                {actionLoading ? 'Saving...' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
