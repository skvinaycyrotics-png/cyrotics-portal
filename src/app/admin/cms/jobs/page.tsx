'use client';

import { useEffect, useState } from 'react';
import api, { ApiError } from '@/lib/api';
import { Briefcase, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, CheckCircle2, MapPin, Clock } from 'lucide-react';

interface Job {
  _id: string; title: string; department?: string; location?: string;
  type: string; experience?: string; salary?: string;
  description: string; requirements: string[]; responsibilities: string[];
  published: boolean; closingDate?: string;
}

const EMPTY: Omit<Job, '_id'> = {
  title: '', department: '', location: '', type: 'full_time',
  experience: '', salary: '', description: '', requirements: [], responsibilities: [],
  published: false, closingDate: '',
};

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship'];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<Omit<Job, '_id'>>(EMPTY);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [reqInput, setReqInput] = useState('');
  const [respInput, setRespInput] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Job[] }>('/cms/jobs?limit=50');
      setJobs(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const openCreate = () => { setForm(EMPTY); setReqInput(''); setRespInput(''); setModal('create'); };
  const openEdit = (j: Job) => { const { _id, ...rest } = j; setForm(rest); setEditId(_id); setReqInput(''); setRespInput(''); setModal('edit'); };

  const addItem = (key: 'requirements' | 'responsibilities', val: string, setVal: (v: string) => void) => {
    if (!val.trim()) return;
    setForm(f => ({ ...f, [key]: [...(f[key] || []), val.trim()] }));
    setVal('');
  };
  const removeItem = (key: 'requirements' | 'responsibilities', idx: number) => {
    setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') await api.post('/cms/jobs', form);
      else await api.put(`/cms/jobs/${editId}`, form);
      showToast(`Job ${modal === 'create' ? 'created' : 'updated'}.`);
      setModal(null);
      fetchJobs();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job listing?')) return;
    try { await api.delete(`/cms/jobs/${id}`); showToast('Deleted.'); fetchJobs(); } catch { /* ignore */ }
  };

  const togglePublish = async (j: Job) => {
    try { await api.put(`/cms/jobs/${j._id}`, { published: !j.published }); fetchJobs(); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Listings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage career opportunities on the website</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
          <Plus className="h-4 w-4" /> Add Job
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
      ) : (
        <div className="space-y-3">
          {jobs.map(j => (
            <div key={j._id} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 shrink-0"><Briefcase className="h-5 w-5 text-indigo-400" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-white">{j.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${j.published ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-slate-500 bg-slate-700/50 border-slate-700'}`}>
                    {j.published ? 'Live' : 'Draft'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-700 text-slate-400 capitalize">{j.type.replace('_', ' ')}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {j.department && <span>{j.department}</span>}
                  {j.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
                  {j.experience && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{j.experience}</span>}
                  {j.salary && <span>{j.salary}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePublish(j)} title={j.published ? 'Unpublish' : 'Publish'}
                  className={`p-1.5 rounded-lg transition-all ${j.published ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'}`}>
                  {j.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(j)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(j._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-900/60 border border-slate-700/50 rounded-2xl">
              <Briefcase className="h-10 w-10 mb-3" />
              <p>No jobs yet. Add your first listing.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'New Job Listing' : 'Edit Job'}</h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1.5 block">Job Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                </div>
                {[
                  { label: 'Department', key: 'department' },
                  { label: 'Location', key: 'location' },
                  { label: 'Experience', key: 'experience', placeholder: 'e.g. 2–4 years' },
                  { label: 'Salary Range', key: 'salary', placeholder: 'e.g. ₹6–10 LPA' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                    <input value={(form as Record<string,unknown>)[key] as string || ''}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Job Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none capitalize">
                    {JOB_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Closing Date</label>
                  <input type="date" value={form.closingDate || ''} onChange={e => setForm(f => ({ ...f, closingDate: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Job Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none" />
              </div>

              {/* Requirements */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Requirements</label>
                <div className="flex gap-2 mb-2">
                  <input value={reqInput} onChange={e => setReqInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem('requirements', reqInput, setReqInput); }}}
                    placeholder="Add a requirement and press Enter"
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
                  <button type="button" onClick={() => addItem('requirements', reqInput, setReqInput)}
                    className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 hover:text-white text-sm transition-all">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.requirements.map((r, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-700/50 border border-slate-700 text-xs text-slate-300">
                      {r} <button type="button" onClick={() => removeItem('requirements', i)} className="text-slate-500 hover:text-red-400 transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-slate-300">Publish immediately</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                    className={`w-10 h-5 rounded-full transition-all ${form.published ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${form.published ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : (modal === 'create' ? 'Create Job' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
