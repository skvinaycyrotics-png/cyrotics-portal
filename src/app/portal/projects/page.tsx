// ═══════════════════════════════════════════════════════════
// FILE: src/app/portal/projects/page.tsx
// Client portal — list all assigned projects
// ═══════════════════════════════════════════════════════════
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { FolderKanban, Loader2, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';

interface Project {
  _id: string; name: string; projectId: string; status: string;
  progress: number; priority: string; startDate?: string; endDate?: string;
  shortDescription?: string; tags: string[];
}

const STATUS_STYLES: Record<string, string> = {
  planning: 'text-slate-400 bg-slate-700/50 border-slate-700',
  in_progress: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  on_hold: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  completed: 'text-green-400 bg-green-500/10 border-green-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function PortalProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const accentColor = user?.dashboardConfig?.accentColor || '#0ea5e9';

  useEffect(() => {
    api.get<{ data: Project[] }>('/projects?limit=50')
      .then(r => setProjects(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">My Projects</h1>
        <p className="text-slate-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/60 border border-slate-700/50 rounded-2xl">
          <FolderKanban className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium text-slate-400">No projects assigned yet</p>
          <p className="text-sm mt-1">Projects will appear here once assigned by our team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map(p => (
            <Link key={p._id} href={`/portal/projects/${p._id}`}
              className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/60 hover:shadow-xl transition-all group flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-500">{p.projectId}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.status] || STATUS_STYLES.planning}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-white truncate">{p.name}</h3>
                  {p.shortDescription && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.shortDescription}</p>}
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 shrink-0 mt-1 transition-colors" />
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progress</span>
                  <span style={{ color: accentColor }} className="font-semibold">{p.progress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${p.progress}%`, background: `linear-gradient(to right, ${accentColor}, #6366f1)` }} />
                </div>
              </div>

              {/* Dates & tags */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {p.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800/60 border border-slate-700 text-slate-400">{tag}</span>
                  ))}
                </div>
                {p.endDate && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                    <Calendar className="h-3 w-3" />
                    {new Date(p.endDate).toLocaleDateString('en-IN')}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
