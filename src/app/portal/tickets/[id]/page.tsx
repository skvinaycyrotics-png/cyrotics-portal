'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Loader2, Send, CheckCircle2, Clock,
  ChevronRight, AlertTriangle, User, Tag, Calendar,
  ThumbsUp, Star, Lock
} from 'lucide-react';

interface TicketAuthor { _id: string; name: string; role: string; email: string; }
interface Response {
  _id: string; author: TicketAuthor; message: string;
  internal: boolean; createdAt: string;
}
interface TicketDetail {
  _id: string; ticketId: string; subject: string; description: string;
  raisedBy: TicketAuthor; assignedTo?: TicketAuthor;
  category: string; priority: string; status: string;
  responses: Response[]; createdAt: string; updatedAt: string;
  resolvedAt?: string; rating?: number; ratingComment?: string;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'text-red-400 bg-red-500/10 border-red-500/20',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  waiting_client: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  resolved: 'text-green-400 bg-green-500/10 border-green-500/20',
  closed: 'text-slate-400 bg-slate-700/50 border-slate-700',
};
const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-400', high: 'text-orange-400',
  medium: 'text-amber-400', low: 'text-green-400',
};

export default function PortalTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const accentColor = user?.dashboardConfig?.accentColor || '#0ea5e9';

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchTicket = async () => {
    try {
      const res = await api.get<{ data: { ticket: TicketDetail } }>(`/tickets/${id}`);
      setTicket(res.data.ticket);
      if (res.data.ticket.rating) setRating(res.data.ticket.rating);
    } catch { router.replace('/portal/tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/responses`, { message: reply });
      setReply('');
      showToast('Reply sent successfully.');
      fetchTicket();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to send reply.');
    } finally { setSending(false); }
  };

  const submitRating = async () => {
    if (!rating) return;
    setSubmittingRating(true);
    try {
      await api.put(`/tickets/${id}`, { rating, ratingComment });
      showToast('Thank you for your feedback!');
      fetchTicket();
    } catch { showToast('Failed to submit rating.'); }
    finally { setSubmittingRating(false); }
  };

  const timeStr = (date: string) =>
    new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
  );

  if (!ticket) return null;

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
  const waitingForClient = ticket.status === 'waiting_client';

  return (
    <div className="max-w-3xl space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}

      {/* Back */}
      <div className="flex items-center gap-3">
        <Link href="/portal/tickets" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <nav className="flex items-center gap-1 text-sm text-slate-500">
          <Link href="/portal/tickets" className="hover:text-slate-300 transition-colors">Tickets</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-300 font-mono">{ticket.ticketId}</span>
        </nav>
      </div>

      {/* Ticket header */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-500">{ticket.ticketId}</span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[ticket.status] || STATUS_STYLES.open}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`text-[11px] font-bold uppercase ${PRIORITY_COLOR[ticket.priority]}`}>{ticket.priority}</span>
              <span className="text-[11px] text-slate-500 capitalize bg-slate-800/60 px-2 py-0.5 rounded-full">{ticket.category}</span>
            </div>
            <h1 className="text-lg font-bold text-white">{ticket.subject}</h1>
          </div>
          {ticket.assignedTo && (
            <div className="flex items-center gap-2 bg-slate-800/40 rounded-xl px-3 py-2">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <div>
                <p className="text-[10px] text-slate-500">Assigned to</p>
                <p className="text-xs text-slate-300 font-medium">{ticket.assignedTo.name}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Opened {timeStr(ticket.createdAt)}</span>
          {ticket.resolvedAt && <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Resolved {timeStr(ticket.resolvedAt)}</span>}
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Updated {timeStr(ticket.updatedAt)}</span>
        </div>
      </div>

      {/* Waiting for client notice */}
      {waitingForClient && (
        <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
          <AlertTriangle className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-300">
            Our team is waiting for your response. Please reply below to continue.
          </p>
        </div>
      )}

      {/* Conversation */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-5 space-y-5">
          {/* Original issue */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {ticket.raisedBy?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold text-white">{ticket.raisedBy?.name}</span>
                <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">You</span>
                <span className="text-[10px] text-slate-600">{timeStr(ticket.createdAt)}</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>
          </div>

          {/* Responses */}
          {ticket.responses.map(r => {
            const isAdmin = r.author?.role === 'admin';
            return (
              <div key={r._id} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isAdmin ? 'bg-gradient-to-br from-cyan-500 to-indigo-500' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
                  {r.author?.name?.charAt(0) || '?'}
                </div>
                <div className={`flex-1 flex flex-col gap-1.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{r.author?.name}</span>
                    {isAdmin && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${accentColor}20`, color: accentColor }}>
                        Cyrotics Team
                      </span>
                    )}
                    <span className="text-[10px] text-slate-600">{timeStr(r.createdAt)}</span>
                  </div>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isAdmin
                      ? 'rounded-tr-sm bg-cyan-500/10 border border-cyan-500/20 text-slate-200'
                      : 'rounded-tl-sm bg-slate-800/60 border border-slate-700/50 text-slate-300'
                  }`}>
                    {r.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply box — hide if closed */}
        {!isResolved && (
          <div className="p-4 border-t border-slate-800 space-y-3">
            <textarea value={reply} onChange={e => setReply(e.target.value)}
              rows={3} placeholder="Write your reply..."
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(); }}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none" />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-600">Cmd/Ctrl + Enter to send</p>
              <button onClick={sendReply} disabled={sending || !reply.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #6366f1)` }}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Reply
              </button>
            </div>
          </div>
        )}

        {/* Resolved banner */}
        {isResolved && (
          <div className="flex items-center gap-3 p-4 border-t border-slate-800 bg-green-500/5">
            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-400">This ticket has been resolved</p>
              <p className="text-xs text-slate-500">If the issue persists, you can raise a new ticket.</p>
            </div>
            <Link href="/portal/tickets/new"
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all">
              New Ticket
            </Link>
          </div>
        )}
      </div>

      {/* Rating section — shown when resolved and not yet rated */}
      {isResolved && !ticket.rating && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Rate this Support Experience</h3>
          <p className="text-xs text-slate-500 mb-4">Your feedback helps us improve our support quality.</p>
          <div className="flex gap-2 mb-4">
            {[1,2,3,4,5].map(r => (
              <button key={r} type="button" onClick={() => setRating(r)}
                className="transition-transform hover:scale-110">
                <Star className={`h-7 w-7 transition-all ${r <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div className="space-y-3">
              <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                rows={2} placeholder="Any additional comments? (optional)"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none" />
              <button onClick={submitRating} disabled={submittingRating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #6366f1)` }}>
                {submittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                Submit Rating
              </button>
            </div>
          )}
        </div>
      )}

      {/* Show existing rating */}
      {ticket.rating && (
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(r => (
              <Star key={r} className={`h-4 w-4 ${r <= ticket.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
            ))}
          </div>
          <p className="text-sm text-slate-400">You rated this {ticket.rating}/5</p>
          {ticket.ratingComment && <p className="text-xs text-slate-500 italic">"{ticket.ratingComment}"</p>}
        </div>
      )}
    </div>
  );
}
