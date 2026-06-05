'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Loader2, Target, FileText, MessageSquare,
  CheckCircle2, Clock, Circle, Calendar, Users,
  Download, Send, ChevronRight, AlertTriangle
} from 'lucide-react';

interface Milestone {
  _id?: string; title: string; description?: string;
  dueDate?: string; status: 'pending' | 'in_progress' | 'completed';
}
interface Document {
  _id?: string; name: string; url: string; size?: number;
  uploadedAt: string; visibleToClient: boolean;
}
interface Comment {
  _id: string; author: { name: string; role: string };
  text: string; internal: boolean; createdAt: string;
}
interface Project {
  _id: string; projectId: string; name: string; description?: string;
  shortDescription?: string; status: string; priority: string; progress: number;
  startDate?: string; endDate?: string; assignedTeam: string[];
  milestones: Milestone[]; documents: Document[]; comments: Comment[];
  tags: string[]; client: { name: string; company?: string };
  createdAt: string;
}

type Tab = 'overview' | 'milestones' | 'documents' | 'comments';

const STATUS_STYLES: Record<string,string> = {
  planning: 'text-slate-400 bg-slate-700/50 border-slate-700',
  in_progress: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  on_hold: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  completed: 'text-green-400 bg-green-500/10 border-green-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const MILESTONE_ICON = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  in_progress: <Clock className="h-4 w-4 text-cyan-400" />,
  pending: <Circle className="h-4 w-4 text-slate-600" />,
};

export default function PortalProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const accentColor = user?.dashboardConfig?.accentColor || '#0ea5e9';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchProject = async () => {
    try {
      const res = await api.get<{ data: { project: Project } }>(`/projects/${id}`);
      setProject(res.data.project);
    } catch { router.replace('/portal/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/projects/${id}/comments`, { text: comment });
      setComment('');
      showToast('Comment posted.');
      fetchProject();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to post comment.');
    } finally { setPosting(false); }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
    </div>
  );

  if (!project) return null;

  const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
  const visibleDocs = project.documents.filter(d => d.visibleToClient);

  const TABS: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Target },
    { key: 'milestones', label: 'Milestones', icon: CheckCircle2, count: project.milestones.length },
    { key: 'documents', label: 'Documents', icon: FileText, count: visibleDocs.length },
    { key: 'comments', label: 'Comments', icon: MessageSquare, count: project.comments.length },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}

      {/* Back */}
      <div className="flex items-center gap-3">
        <Link href="/portal/projects" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <nav className="flex items-center gap-1 text-sm text-slate-500">
          <Link href="/portal/projects" className="hover:text-slate-300 transition-colors">Projects</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-300">{project.name}</span>
        </nav>
      </div>

      {/* Hero card */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6"
        style={{ borderColor: `${accentColor}20` }}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-500">{project.projectId}</span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[project.status] || STATUS_STYLES.planning}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">{project.name}</h1>
            {project.shortDescription && <p className="text-sm text-slate-400">{project.shortDescription}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-white" style={{ color: accentColor }}>{project.progress}%</p>
            <p className="text-xs text-slate-500">Complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${project.progress}%`, background: `linear-gradient(to right, ${accentColor}, #6366f1)` }} />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Milestones', value: `${completedMilestones}/${project.milestones.length}`, icon: Target },
            { label: 'Documents', value: visibleDocs.length, icon: FileText },
            { label: 'Start Date', value: project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN') : '—', icon: Calendar },
            { label: 'End Date', value: project.endDate ? new Date(project.endDate).toLocaleDateString('en-IN') : '—', icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-slate-800/40 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
              </div>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        {project.assignedTeam.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-xs text-slate-500">Team:</p>
            <div className="flex flex-wrap gap-1.5">
              {project.assignedTeam.map(m => (
                <span key={m} className="px-2 py-0.5 rounded-full text-xs bg-slate-800 border border-slate-700 text-slate-300">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.key ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            style={tab === t.key ? { background: `${accentColor}20`, boxShadow: `0 0 12px ${accentColor}15` } : {}}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full font-bold" style={{ background: `${accentColor}30`, color: accentColor }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-3">Project Description</h3>
          {project.description ? (
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{project.description}</p>
          ) : (
            <p className="text-sm text-slate-600 italic">No detailed description provided.</p>
          )}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
              {project.tags.map(t => (
                <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-slate-800 border border-slate-700 text-slate-400">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Milestones Tab ────────────────────────────────────────────────────── */}
      {tab === 'milestones' && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">
            Project Milestones
            <span className="ml-2 text-slate-500 font-normal">— {completedMilestones} of {project.milestones.length} completed</span>
          </h3>
          {project.milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-600">
              <Target className="h-10 w-10 mb-2" />
              <p className="text-sm">No milestones defined yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-800" />
              <div className="space-y-4">
                {project.milestones.map((ms, idx) => (
                  <div key={ms._id || idx} className="flex gap-4">
                    <div className="relative z-10 shrink-0 mt-0.5">
                      {MILESTONE_ICON[ms.status]}
                    </div>
                    <div className={`flex-1 pb-4 ${idx < project.milestones.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`text-sm font-semibold ${ms.status === 'completed' ? 'text-green-400 line-through decoration-green-400/40' : ms.status === 'in_progress' ? 'text-white' : 'text-slate-400'}`}>
                          {ms.title}
                        </p>
                        <div className="flex items-center gap-2">
                          {ms.dueDate && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Calendar className="h-3 w-3" /> {new Date(ms.dueDate).toLocaleDateString('en-IN')}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${ms.status === 'completed' ? 'text-green-400 bg-green-500/10' : ms.status === 'in_progress' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 bg-slate-700/50'}`}>
                            {ms.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      {ms.description && <p className="text-xs text-slate-500 mt-1">{ms.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Documents Tab ─────────────────────────────────────────────────────── */}
      {tab === 'documents' && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Project Documents</h3>
          {visibleDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-600">
              <FileText className="h-10 w-10 mb-2" />
              <p className="text-sm">No documents shared yet</p>
              <p className="text-xs mt-1">Our team will upload documents here as the project progresses.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleDocs.map((doc, idx) => (
                <a key={doc._id || idx} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl hover:bg-slate-800/70 transition-all group border border-slate-700/30 hover:border-slate-600/50">
                  <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-all">
                    <FileText className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      {doc.size && <span>{formatSize(doc.size)}</span>}
                      <span>Added {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Comments Tab ──────────────────────────────────────────────────────── */}
      {tab === 'comments' && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Comment list */}
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {project.comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                <MessageSquare className="h-10 w-10 mb-2" />
                <p className="text-sm">No comments yet. Start the conversation.</p>
              </div>
            ) : project.comments.map(c => (
              <div key={c._id} className={`flex gap-3 ${c.author?.role === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${c.author?.role === 'admin' ? 'bg-gradient-to-br from-cyan-500 to-indigo-500' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
                  {c.author?.name?.charAt(0) || '?'}
                </div>
                <div className={`max-w-[80%] flex flex-col gap-1 ${c.author?.role === 'admin' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">{c.author?.name}</span>
                    <span className="text-[10px] text-slate-600">{new Date(c.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${c.author?.role === 'admin' ? 'bg-cyan-500/10 border border-cyan-500/15 text-slate-200' : 'bg-slate-800/60 border border-slate-700/50 text-slate-300'}`}>
                    {c.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply box */}
          <div className="p-4 border-t border-slate-800 flex gap-3">
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              rows={2} placeholder="Write a comment or question..."
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment(); }}
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none" />
            <button onClick={postComment} disabled={posting || !comment.trim()}
              className="self-end flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #6366f1)` }}>
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
