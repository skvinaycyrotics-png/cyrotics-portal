'use client';

import { useEffect, useState, useCallback } from 'react';
import api, { ApiError } from '@/lib/api';
import {
  FolderKanban, Plus, Pencil, Trash2, Loader2, X, CheckCircle2,
  ChevronLeft, ChevronRight, Search, Users, Calendar, TrendingUp,
  Globe, Eye, EyeOff, Target, AlertTriangle
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface Client { _id: string; name: string; email: string; company?: string; }
interface Milestone {
  title: string; description?: string; dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
}
interface Project {
  _id: string; projectId: string; name: string; description?: string;
  shortDescription?: string; client: { _id: string; name: string; email: string; company?: string };
  status: string; priority: string; progress: number;
  startDate?: string; endDate?: string; assignedTeam: string[];
  milestones: (Milestone & { _id?: string })[];
  showOnWebsite: boolean; tags: string[]; category?: string;
  createdAt: string;
}

type FormData = {
  name: string; description: string; shortDescription: string;
  client: string; status: string; priority: string; progress: number;
  startDate: string; endDate: string; assignedTeam: string;
  tags: string; category: string; showOnWebsite: boolean;
};

const EMPTY_FORM: FormData = {
  name: '', description: '', shortDescription: '', client: '',
  status: 'planning', priority: 'medium', progress: 0,
  startDate: '', endDate: '', assignedTeam: '', tags: '', category: '',
  showOnWebsite: false,
};

const STATUS_STYLES: Record<string, string> = {
  planning: 'text-slate-400 bg-slate-700/50 border-slate-700',
  in_progress: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  on_hold: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  completed: 'text-green-400 bg-green-500/10 border-green-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
};
const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-green-400', medium: 'bg-amber-400', high: 'bg-orange-400', critical: 'bg-red-400',
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'milestones' | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editId, setEditId] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState<Milestone>({ title: '', description: '', dueDate: '', status: 'pending' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  // ── Fetch projects ─────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Project[]; pagination: { pages: number } }>(
        '/projects', { page, limit: 12, ...(statusFilter && { status: statusFilter }) }
      );
      setProjects(res.data);
      setTotalPages(res.pagination.pages);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, statusFilter]);

  // ── Fetch clients for dropdown ─────────────────────────────────────────────
  const fetchClients = async () => {
    try {
      const res = await api.get<{ data: Client[] }>('/admin/users', { role: 'client', status: 'active', limit: 100 });
      setClients(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { fetchClients(); }, []);

  // ── Open modals ────────────────────────────────────────────────────────────
  const openCreate = () => { setForm(EMPTY_FORM); setEditId(''); setModal('create'); };
  const openEdit = (p: Project) => {
    setEditId(p._id);
    setForm({
      name: p.name, description: p.description || '', shortDescription: p.shortDescription || '',
      client: p.client._id, status: p.status, priority: p.priority, progress: p.progress,
      startDate: p.startDate?.slice(0, 10) || '', endDate: p.endDate?.slice(0, 10) || '',
      assignedTeam: p.assignedTeam.join(', '), tags: p.tags.join(', '),
      category: p.category || '', showOnWebsite: p.showOnWebsite,
    });
    setModal('edit');
  };
  const openMilestones = (p: Project) => {
    setSelectedProject(p);
    setMilestones(p.milestones);
    setModal('milestones');
  };

  // ── Save project ───────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        assignedTeam: form.assignedTeam.split(',').map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (modal === 'create') await api.post('/projects', body);
      else await api.put(`/projects/${editId}`, body);
      showToast(`Project ${modal === 'create' ? 'created' : 'updated'} successfully.`);
      setModal(null);
      fetchProjects();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Save failed.');
    } finally { setSaving(false); }
  };

  // ── Save milestones ────────────────────────────────────────────────────────
  const handleSaveMilestones = async () => {
    if (!selectedProject) return;
    setSaving(true);
    try {
      await api.put(`/projects/${selectedProject._id}`, { milestones });
      showToast('Milestones saved.');
      setModal(null);
      fetchProjects();
    } catch { showToast('Save failed.'); } finally { setSaving(false); }
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) return;
    setMilestones(m => [...m, { ...newMilestone }]);
    setNewMilestone({ title: '', description: '', dueDate: '', status: 'pending' });
  };

  const updateMilestone = (idx: number, field: keyof Milestone, value: string) => {
    setMilestones(m => m.map((ms, i) => i === idx ? { ...ms, [field]: value } : ms));
  };

  const removeMilestone = (idx: number) => setMilestones(m => m.filter((_, i) => i !== idx));

  // ── Delete project ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      showToast('Project deleted.');
      fetchProjects();
    } catch { showToast('Delete failed.'); }
  };

  // ── Filtered projects (client-side search) ─────────────────────────────────
  const filtered = search
    ? projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.projectId.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-right-4">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all client projects and milestones</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20">
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or client..."
            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-300 text-sm focus:outline-none">
          <option value="">All Status</option>
          {['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'].map(s => (
            <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/60 border border-slate-700/50 rounded-2xl text-slate-500">
          <FolderKanban className="h-12 w-12 mb-3" />
          <p className="text-slate-400 text-lg font-medium">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p._id} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-600/60 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-500">{p.projectId}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.status] || STATUS_STYLES.planning}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                    {p.showOnWebsite && <Globe className="h-3 w-3 text-cyan-400" title="Shown on website" />}
                  </div>
                  <h3 className="text-base font-semibold text-white truncate">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {p.client?.name} {p.client?.company ? `— ${p.client.company}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p.priority] || 'bg-slate-500'}`} title={p.priority} />
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-cyan-400 font-semibold">{p.progress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all"
                    style={{ width: `${p.progress}%` }} />
                </div>
              </div>

              {/* Milestones summary */}
              {p.milestones.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Target className="h-3.5 w-3.5" />
                  <span>{p.milestones.filter(m => m.status === 'completed').length} / {p.milestones.length} milestones</span>
                </div>
              )}

              {/* Dates */}
              {(p.startDate || p.endDate) && (
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  {p.startDate && <span>{new Date(p.startDate).toLocaleDateString('en-IN')}</span>}
                  {p.startDate && p.endDate && <span>→</span>}
                  {p.endDate && <span>{new Date(p.endDate).toLocaleDateString('en-IN')}</span>}
                </div>
              )}

              {/* Tags */}
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 4).map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800/60 border border-slate-700 text-slate-400">{t}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button onClick={() => openMilestones(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
                  <Target className="h-3.5 w-3.5" /> Milestones
                </button>
                <button onClick={() => openEdit(p)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all ml-auto">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(p._id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"><ChevronLeft className="h-4 w-4"/></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"><ChevronRight className="h-4 w-4"/></button>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'New Project' : 'Edit Project'}</h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Project Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
              </div>

              {/* Client */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Assign to Client *</label>
                <select value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} required
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.name} — {c.email}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Status, Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none capitalize">
                    {['planning','in_progress','on_hold','completed','cancelled'].map(s => (
                      <option key={s} value={s} className="capitalize">{s.replace('_',' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none capitalize">
                    {['low','medium','high','critical'].map(p => (
                      <option key={p} value={p} className="capitalize">{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Progress: <span className="text-cyan-400 font-semibold">{form.progress}%</span></label>
                <input type="range" min={0} max={100} value={form.progress}
                  onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                  className="w-full accent-cyan-500" />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none" />
                </div>
              </div>

              {/* Short description */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Short Description (shown to client)</label>
                <input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
                  maxLength={300} placeholder="One-line summary..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
              </div>

              {/* Full description */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Full Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none" />
              </div>

              {/* Team, Tags, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Team Members</label>
                  <input value={form.assignedTeam} onChange={e => setForm(f => ({ ...f, assignedTeam: e.target.value }))}
                    placeholder="Rahul, Priya, Amit"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Tags</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="Networking, Cloud"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="Data Center"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
                </div>
              </div>

              {/* Show on website */}
              <label className="flex items-center justify-between cursor-pointer py-2">
                <div>
                  <p className="text-sm text-slate-300">Show on Website</p>
                  <p className="text-xs text-slate-500">Feature this project in the portfolio section of cyrotics.in</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, showOnWebsite: !f.showOnWebsite }))}
                  className={`w-11 h-6 rounded-full transition-all shrink-0 ${form.showOnWebsite ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${form.showOnWebsite ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : (modal === 'create' ? 'Create Project' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Milestones Modal ─────────────────────────────────────────────────── */}
      {modal === 'milestones' && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-white">Milestones</h2>
                <p className="text-sm text-slate-400">{selectedProject.name}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>

            {/* Existing milestones */}
            <div className="space-y-2 my-4">
              {milestones.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No milestones yet. Add your first one below.</p>
              )}
              {milestones.map((ms, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <div className={`mt-1 w-3 h-3 rounded-full shrink-0 border-2 ${ms.status === 'completed' ? 'bg-green-400 border-green-400' : ms.status === 'in_progress' ? 'bg-cyan-400 border-cyan-400' : 'bg-transparent border-slate-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{ms.title}</p>
                    {ms.description && <p className="text-xs text-slate-400 mt-0.5">{ms.description}</p>}
                    {ms.dueDate && <p className="text-[10px] text-slate-500 mt-1">Due: {new Date(ms.dueDate).toLocaleDateString('en-IN')}</p>}
                  </div>
                  <select value={ms.status} onChange={e => updateMilestone(idx, 'status', e.target.value)}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none capitalize">
                    {['pending','in_progress','completed'].map(s => <option key={s} value={s} className="capitalize">{s.replace('_',' ')}</option>)}
                  </select>
                  <button onClick={() => removeMilestone(idx)} className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-all">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new milestone */}
            <div className="border border-slate-700/50 rounded-xl p-4 space-y-3 bg-slate-800/20">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add Milestone</p>
              <input value={newMilestone.title} onChange={e => setNewMilestone(m => ({ ...m, title: e.target.value }))}
                placeholder="Milestone title *"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
              <input value={newMilestone.description || ''} onChange={e => setNewMilestone(m => ({ ...m, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
              <div className="flex gap-3">
                <input type="date" value={newMilestone.dueDate || ''} onChange={e => setNewMilestone(m => ({ ...m, dueDate: e.target.value }))}
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none" />
                <button type="button" onClick={addMilestone}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all hover:bg-slate-800">Cancel</button>
              <button onClick={handleSaveMilestones} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Milestones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
