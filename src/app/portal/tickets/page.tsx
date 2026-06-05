'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Ticket, Plus, Loader2, ArrowRight } from 'lucide-react';

interface TicketItem {
  _id: string; ticketId: string; subject: string; status: string;
  priority: string; category: string; createdAt: string; updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'text-red-400 bg-red-500/10 border-red-500/20',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  waiting_client: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  resolved: 'text-green-400 bg-green-500/10 border-green-500/20',
  closed: 'text-slate-400 bg-slate-700/50 border-slate-700',
};

export default function PortalTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const accentColor = user?.dashboardConfig?.accentColor || '#0ea5e9';

  useEffect(() => {
    api.get<{ data: TicketItem[] }>('/tickets', { limit: 50, ...(statusFilter && { status: statusFilter }) })
      .then(r => setTickets(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter]);

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-slate-400 text-sm mt-1">{openCount} open</p>
        </div>
        <Link href="/portal/tickets/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
          style={{ background: `linear-gradient(135deg, ${accentColor}, #6366f1)` }}>
          <Plus className="h-4 w-4" /> New Ticket
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {[{label:'All',value:''},{label:'Open',value:'open'},{label:'In Progress',value:'in_progress'},{label:'Resolved',value:'resolved'}].map(f=>(
          <button key={f.value} onClick={()=>setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter===f.value?'text-white border-transparent':'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-white'}`}
            style={statusFilter===f.value?{background:`${accentColor}25`,borderColor:`${accentColor}40`,color:accentColor}:{}}>
            {f.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-cyan-400"/></div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/60 border border-slate-700/50 rounded-2xl">
          <Ticket className="h-12 w-12 mb-3"/><p className="text-slate-400">No tickets yet</p>
          <Link href="/portal/tickets/new" className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{background:`linear-gradient(135deg,${accentColor},#6366f1)`}}>Create First Ticket</Link>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-800/60">
            {tickets.map(t=>(
              <Link key={t._id} href={`/portal/tickets/${t._id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-800/20 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-slate-500">{t.ticketId}</span>
                    <span className="text-[10px] text-slate-600 capitalize">{t.category}</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Updated {new Date(t.updatedAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border whitespace-nowrap ${STATUS_STYLES[t.status]||STATUS_STYLES.closed}`}>
                    {t.status.replace('_',' ')}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors"/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
