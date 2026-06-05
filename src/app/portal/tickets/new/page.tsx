'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Ticket, AlertCircle, ArrowLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['general', 'technical', 'billing', 'project', 'access'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const accentColor = user?.dashboardConfig?.accentColor || '#0ea5e9';

  const [form, setForm] = useState({
    subject: '', description: '', category: 'general', priority: 'medium',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/tickets', form);
      router.push('/portal/tickets');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/portal/tickets"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Raise a Ticket</h1>
          <p className="text-slate-400 text-sm">Describe your issue and we'll respond within 24 hours.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
              Subject *
            </label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              required placeholder="Brief description of the issue"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': `${accentColor}50` } as React.CSSProperties} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none capitalize">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none capitalize">
                {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
              Description *
            </label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required minLength={20} rows={6}
              placeholder="Please describe the issue in detail, including steps to reproduce if applicable..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none transition-all" />
            <p className="text-xs text-slate-600 mt-1 text-right">{form.description.length} chars</p>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #6366f1)` }}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              : <><Send className="h-4 w-4" /> Submit Ticket</>}
          </button>
        </form>
      </div>
    </div>
  );
}
