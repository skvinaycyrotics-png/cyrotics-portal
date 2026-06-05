'use client';

import { useEffect, useState } from 'react';
import api, { ApiError } from '@/lib/api';
import {
  CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Loader2, UserPlus, Building2, Mail, Phone, Clock, X
} from 'lucide-react';

interface RegRequest {
  _id: string; name: string; email: string; mobile?: string;
  company?: string; designation?: string; purpose: string;
  roleRequested: string; status: string; createdAt: string;
  projectReference?: string; ipAddress?: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  approved: 'text-green-400 bg-green-500/10 border-green-500/20',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function AdminRegistrationsPage() {
  const [requests, setRequests] = useState<RegRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState<RegRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: RegRequest[]; pagination: { pages: number } }>(
        '/admin/registrations', { page, limit: 15, ...(statusFilter && { status: statusFilter }) }
      );
      setRequests(res.data);
      setTotalPages(res.pagination.pages);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, [page, statusFilter]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + 'approve');
    try {
      await api.put(`/admin/registrations/${id}/approve`, {});
      showToast('Registration approved. Login credentials sent to applicant.');
      setSelected(null);
      fetchRequests();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Action failed.');
    } finally { setActionLoading(''); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + 'reject');
    try {
      await api.put(`/admin/registrations/${id}/reject`, { reason: rejectReason });
      showToast('Registration rejected. Applicant notified.');
      setSelected(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Action failed.');
    } finally { setActionLoading(''); }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Access Requests</h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve portal access requests</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', ''].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-white'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <UserPlus className="h-8 w-8 mb-2" />
            <p className="text-sm">No {statusFilter || ''} requests</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {requests.map(req => (
              <div key={req._id} className="flex items-start gap-4 p-5 hover:bg-slate-800/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {req.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{req.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[req.status]}`}>
                      {req.status}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 capitalize">
                      {req.roleRequested}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.email}</span>
                    {req.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{req.company}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{req.purpose}</p>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setSelected(req)}
                      className="px-3 py-1.5 rounded-xl bg-slate-700/50 border border-slate-600 text-slate-300 text-xs hover:bg-slate-700 transition-all">
                      Review
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4"/>
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30">
                <ChevronRight className="h-4 w-4"/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Review Request</h2>
              <button onClick={() => { setSelected(null); setRejectReason(''); }} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 mb-5 space-y-2">
              {[
                { label: 'Name', value: selected.name },
                { label: 'Email', value: selected.email },
                { label: 'Mobile', value: selected.mobile || '—' },
                { label: 'Company', value: selected.company || '—' },
                { label: 'Designation', value: selected.designation || '—' },
                { label: 'Role Requested', value: selected.roleRequested },
                { label: 'Project Ref', value: selected.projectReference || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-200 font-medium text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
            <div className="mb-5">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Purpose</p>
              <p className="text-sm text-slate-300 bg-slate-800/40 rounded-xl p-3 leading-relaxed">{selected.purpose}</p>
            </div>
            <div className="mb-5">
              <label className="text-xs text-slate-400 mb-1.5 block">Rejection reason (if rejecting)</label>
              <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Optional: explain why access is denied"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleReject(selected._id)} disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50">
                {actionLoading === selected._id + 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </button>
              <button onClick={() => handleApprove(selected._id)} disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
                {actionLoading === selected._id + 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve & Send Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
