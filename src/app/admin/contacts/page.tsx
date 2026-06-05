'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Search, Mail, Phone, Building2, Clock, MessageSquare,
  ChevronLeft, ChevronRight, Loader2, X, CheckCircle2
} from 'lucide-react';

interface Contact {
  _id: string; firstName: string; lastName?: string; email: string;
  phone?: string; countryCode?: string; company?: string; subject: string;
  message: string; status: string; priority: string; createdAt: string;
  nda: boolean; department?: string; adminNotes?: string;
}

const STATUS_OPTIONS = ['new', 'read', 'in_progress', 'resolved', 'spam'];
const STATUS_BADGE: Record<string, string> = {
  new: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  read: 'text-slate-400 bg-slate-700/50 border-slate-700',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  resolved: 'text-green-400 bg-green-500/10 border-green-500/20',
  spam: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('new');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Contact[]; pagination: { pages: number } }>(
        '/admin/contacts', { page, limit: 15, ...(statusFilter && { status: statusFilter }) }
      );
      setContacts(res.data);
      setTotalPages(res.pagination.pages);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchContacts(); }, [page, statusFilter]);

  const openContact = (c: Contact) => {
    setSelected(c);
    setAdminNotes(c.adminNotes || '');
    setNewStatus(c.status);
    // Mark as read automatically
    if (c.status === 'new') {
      api.put(`/admin/contacts/${c._id}`, { status: 'read' }).catch(() => {});
    }
  };

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/admin/contacts/${selected._id}`, { status: newStatus, adminNotes });
      showToast('Contact updated.');
      setSelected(null);
      fetchContacts();
    } catch { showToast('Save failed.'); } finally { setSaving(false); }
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
          <h1 className="text-2xl font-bold text-white">Contact Requests</h1>
          <p className="text-slate-400 text-sm mt-1">Manage website contact form submissions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['new', 'read', 'in_progress', 'resolved', ''].map(s => (
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
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p className="text-sm">No contacts found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {contacts.map(c => (
              <button key={c._id} onClick={() => openContact(c)}
                className="w-full flex items-start gap-4 p-5 hover:bg-slate-800/20 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {c.firstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{c.firstName} {c.lastName || ''}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[c.status] || STATUS_BADGE.new}`}>
                      {c.status}
                    </span>
                    {c.nda && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">NDA</span>}
                  </div>
                  <p className="text-sm text-slate-300 font-medium truncate">{c.subject}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                    {c.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{c.company}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block shrink-0">{c.priority}</p>
              </button>
            ))}
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

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.firstName} {selected.lastName || ''}</h2>
                <p className="text-sm text-slate-400">{selected.subject}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Email', value: selected.email, icon: Mail },
                { label: 'Phone', value: `${selected.countryCode || ''} ${selected.phone || '—'}`, icon: Phone },
                { label: 'Company', value: selected.company || '—', icon: Building2 },
                { label: 'Department', value: selected.department || '—', icon: MessageSquare },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Icon className="h-3 w-3" />{label}
                  </p>
                  <p className="text-sm text-slate-200 font-medium truncate">{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 mb-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Message</p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none capitalize">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Admin Notes</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3}
                  placeholder="Internal notes about this contact..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all hover:bg-slate-800">Cancel</button>
              <button onClick={saveChanges} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
