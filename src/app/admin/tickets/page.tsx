'use client';

import { useEffect, useState, useCallback } from 'react';
import api, { ApiError } from '@/lib/api';
import {
  Ticket, Search, Loader2, X, CheckCircle2, ChevronLeft, ChevronRight,
  Send, Lock, AlertTriangle, Clock, User, Tag, MessageSquare, RefreshCw
} from 'lucide-react';

interface TicketUser { _id: string; name: string; email: string; role: string; }
interface Response {
  _id: string; author: TicketUser; message: string;
  internal: boolean; createdAt: string;
}
interface TicketItem {
  _id: string; ticketId: string; subject: string; description: string;
  raisedBy: TicketUser; assignedTo?: TicketUser;
  category: string; priority: string; status: string;
  responses: Response[]; createdAt: string; updatedAt: string;
  resolvedAt?: string;
}

const STATUS_OPTS = ['open','in_progress','waiting_client','resolved','closed'];
const PRIORITY_OPTS = ['low','medium','high','critical'];

const STATUS_STYLES: Record<string,string> = {
  open: 'text-red-400 bg-red-500/10 border-red-500/20',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  waiting_client: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  resolved: 'text-green-400 bg-green-500/10 border-green-500/20',
  closed: 'text-slate-400 bg-slate-700/50 border-slate-700',
};
const PRIORITY_COLOR: Record<string,string> = {
  critical:'text-red-400', high:'text-orange-400', medium:'text-amber-400', low:'text-green-400'
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selected, setSelected] = useState<TicketItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [response, setResponse] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: TicketItem[]; pagination: { pages: number } }>(
        '/tickets', {
          page, limit: 15,
          ...(statusFilter && { status: statusFilter }),
          ...(priorityFilter && { priority: priorityFilter }),
        }
      );
      setTickets(res.data);
      setTotalPages(res.pagination.pages);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openTicket = async (t: TicketItem) => {
    setDetailLoading(true);
    setSelected(t);
    setNewStatus(t.status);
    setResponse('');
    setIsInternal(false);
    try {
      const res = await api.get<{ data: { ticket: TicketItem } }>(`/tickets/${t._id}`);
      setSelected(res.data.ticket);
    } catch { /* ignore */ } finally { setDetailLoading(false); }
  };

  const sendResponse = async () => {
    if (!selected || !response.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${selected._id}/responses`, {
        message: response,
        internal: isInternal,
        status: newStatus !== selected.status ? newStatus : undefined,
      });
      showToast(isInternal ? 'Internal note added.' : 'Response sent to client.');
      setResponse('');
      // Refresh detail
      const res = await api.get<{ data: { ticket: TicketItem } }>(`/tickets/${selected._id}`);
      setSelected(res.data.ticket);
      fetchTickets();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send response.');
    } finally { setSending(false); }
  };

  const filtered = search
    ? tickets.filter(t =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
        t.raisedBy?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-7rem)]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" /> {toast}
        </div>
      )}

      {/* ── Left panel: ticket list ──────────────────────────────────────────── */}
      <div className={`flex flex-col bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden transition-all ${selected ? 'hidden lg:flex lg:w-96 xl:w-[420px] shrink-0' : 'flex flex-1'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">Support Tickets</h1>
            <button onClick={fetchTickets} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-8 pr-4 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-1.5 text-slate-300 text-xs focus:outline-none">
              <option value="">All Status</option>
              {STATUS_OPTS.map(s => <option key={s} value={s} className="capitalize">{s.replace('_',' ')}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-1.5 text-slate-300 text-xs focus:outline-none">
              <option value="">All Priority</option>
              {PRIORITY_OPTS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-cyan-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <Ticket className="h-8 w-8 mb-2" /><p className="text-sm">No tickets found</p>
            </div>
          ) : filtered.map(t => (
            <button key={t._id} onClick={() => openTicket(t)}
              className={`w-full text-left p-4 hover:bg-slate-800/30 transition-colors ${selected?._id === t._id ? 'bg-slate-800/50 border-r-2 border-cyan-500' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{t.ticketId}</span>
                  <span className={`text-[10px] font-bold uppercase shrink-0 ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                </div>
                <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(t.updatedAt)}</span>
              </div>
              <p className="text-sm font-medium text-white truncate mb-1">{t.subject}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500 truncate">{t.raisedBy?.name}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border whitespace-nowrap shrink-0 ${STATUS_STYLES[t.status] || STATUS_STYLES.open}`}>
                  {t.status.replace('_',' ')}
                </span>
              </div>
              {t.responses.length > 0 && (
                <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {t.responses.length} response{t.responses.length !== 1 ? 's' : ''}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800">
            <p className="text-[10px] text-slate-500">Page {page}/{totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5"/></button>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5"/></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel: ticket detail ───────────────────────────────────────── */}
      {selected && (
        <div className="flex-1 flex flex-col bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden min-w-0">
          {/* Detail header */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono text-slate-500">{selected.ticketId}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${STATUS_STYLES[selected.status]}`}>
                    {selected.status.replace('_',' ')}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${PRIORITY_COLOR[selected.priority]}`}>{selected.priority}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{selected.category}</span>
                </div>
                <h2 className="text-base font-bold text-white">{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all lg:hidden">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {selected.raisedBy?.name} ({selected.raisedBy?.email})
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {new Date(selected.createdAt).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Original description */}
            <div className="mt-3 bg-slate-800/40 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Original Issue</p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            </div>
          </div>

          {/* Response thread */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {detailLoading ? (
              <div className="flex items-center justify-center h-20"><Loader2 className="h-5 w-5 animate-spin text-cyan-400" /></div>
            ) : selected.responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p className="text-sm">No responses yet. Reply below.</p>
              </div>
            ) : (
              selected.responses.map((r) => (
                <div key={r._id}
                  className={`flex gap-3 ${r.author?.role === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    r.author?.role === 'admin' ? 'bg-gradient-to-br from-cyan-500 to-indigo-500' : 'bg-gradient-to-br from-slate-600 to-slate-700'
                  }`}>
                    {r.author?.name?.charAt(0) || '?'}
                  </div>
                  <div className={`max-w-[75%] ${r.author?.role === 'admin' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-300">{r.author?.name}</span>
                      {r.internal && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                          <Lock className="h-2.5 w-2.5" /> Internal
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">{timeAgo(r.createdAt)}</span>
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      r.internal
                        ? 'bg-amber-500/5 border border-amber-500/15 text-amber-200/80'
                        : r.author?.role === 'admin'
                          ? 'bg-cyan-500/10 border border-cyan-500/20 text-slate-200'
                          : 'bg-slate-800/60 border border-slate-700/50 text-slate-300'
                    }`}>
                      {r.message}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply box */}
          <div className="p-4 border-t border-slate-800 space-y-3">
            {/* Status changer */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-500">Change status to:</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTS.map(s => (
                  <button key={s} type="button" onClick={() => setNewStatus(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all capitalize ${
                      newStatus === s ? STATUS_STYLES[s] : 'text-slate-500 bg-slate-800/40 border-slate-700/50 hover:text-slate-300'
                    }`}>
                    {s.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Internal note toggle */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setIsInternal(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isInternal
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:text-slate-300'
                }`}>
                <Lock className="h-3 w-3" />
                {isInternal ? 'Internal Note (not visible to client)' : 'Make internal note'}
              </button>
            </div>

            {/* Textarea + send */}
            <div className="flex gap-3">
              <textarea value={response} onChange={e => setResponse(e.target.value)}
                rows={3} placeholder={isInternal ? 'Write an internal note (only admins can see this)...' : 'Write a response to the client...'}
                className={`flex-1 bg-slate-800/50 border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none transition-all ${
                  isInternal ? 'border-amber-500/30 focus:ring-2 focus:ring-amber-500/30' : 'border-slate-700/50 focus:ring-2 focus:ring-cyan-500/40'
                }`}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendResponse(); }}
              />
              <button onClick={sendResponse} disabled={sending || !response.trim()}
                className={`self-end flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isInternal
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                }`}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isInternal ? 'Note' : 'Send'}
              </button>
            </div>
            <p className="text-[10px] text-slate-600">Cmd/Ctrl + Enter to send quickly</p>
          </div>
        </div>
      )}

      {/* Empty state when no ticket selected */}
      {!selected && !loading && (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-900/30 border border-slate-800/50 rounded-2xl text-slate-600">
          <div className="text-center">
            <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a ticket to view the conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}
