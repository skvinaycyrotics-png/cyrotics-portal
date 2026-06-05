'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ScrollText, Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Search } from 'lucide-react';

interface AuditLog {
  _id: string; action: string; resource?: string; resourceId?: string;
  details?: unknown; ipAddress?: string; success: boolean; createdAt: string;
  user?: { name: string; email: string; role: string };
}

const ACTION_STYLES: Record<string, string> = {
  LOGIN_SUCCESS: 'text-green-400 bg-green-500/10',
  LOGIN_FAILED: 'text-red-400 bg-red-500/10',
  LOGOUT: 'text-slate-400 bg-slate-700/30',
  USER_APPROVED: 'text-cyan-400 bg-cyan-500/10',
  USER_REJECTED: 'text-amber-400 bg-amber-500/10',
  USER_SUSPENDED: 'text-orange-400 bg-orange-500/10',
  USER_DELETED: 'text-red-400 bg-red-500/10',
  PROJECT_CREATED: 'text-indigo-400 bg-indigo-500/10',
  PROJECT_UPDATED: 'text-indigo-400 bg-indigo-500/10',
  PASSWORD_CHANGED: 'text-amber-400 bg-amber-500/10',
  '2FA_ENABLED': 'text-green-400 bg-green-500/10',
  REGISTRATION_APPROVED: 'text-cyan-400 bg-cyan-500/10',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: AuditLog[]; pagination: { pages: number } }>(
        '/admin/audit-logs', { page, limit: 50 }
      );
      setLogs(res.data);
      setTotalPages(res.pagination.pages);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-1">Security event history — all admin and user actions</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <ScrollText className="h-8 w-8 mb-2" /><p className="text-sm">No audit logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Time', 'User', 'Action', 'Resource', 'IP', 'Status'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3">
                      {log.user ? (
                        <div>
                          <p className="text-xs font-medium text-white">{log.user.name}</p>
                          <p className="text-[10px] text-slate-500">{log.user.role}</p>
                        </div>
                      ) : <span className="text-xs text-slate-600">System</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${ACTION_STYLES[log.action] || 'text-slate-400 bg-slate-700/30'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {log.resource ? `${log.resource}${log.resourceId ? ` #${log.resourceId.slice(-6)}` : ''}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-slate-500">{log.ipAddress || '—'}</td>
                    <td className="px-5 py-3">
                      {log.success
                        ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                        : <XCircle className="h-4 w-4 text-red-400" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
