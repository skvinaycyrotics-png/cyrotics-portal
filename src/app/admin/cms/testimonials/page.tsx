'use client';

import { useEffect, useState } from 'react';
import api, { ApiError } from '@/lib/api';
import { Star, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, CheckCircle2 } from 'lucide-react';

interface Testimonial {
  _id: string; name: string; company?: string; designation?: string;
  message: string; rating: number; published: boolean; order: number;
}

const EMPTY: Omit<Testimonial, '_id'> = { name: '', company: '', designation: '', message: '', rating: 5, published: false, order: 0 };

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<Omit<Testimonial, '_id'>>(EMPTY);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: { testimonials: Testimonial[] } }>('/cms/testimonials');
      setItems(res.data.testimonials);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit = (t: Testimonial) => { const { _id, ...rest } = t; setForm(rest); setEditId(_id); setModal('edit'); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') await api.post('/cms/testimonials', form);
      else await api.put(`/cms/testimonials/${editId}`, form);
      showToast(`Testimonial ${modal === 'create' ? 'created' : 'updated'}.`);
      setModal(null);
      fetchItems();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      await api.delete(`/cms/testimonials/${id}`);
      showToast('Deleted.');
      fetchItems();
    } catch { showToast('Delete failed.'); }
  };

  const togglePublish = async (t: Testimonial) => {
    try {
      await api.put(`/cms/testimonials/${t._id}`, { published: !t.published });
      fetchItems();
    } catch { /* ignore */ }
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
          <h1 className="text-2xl font-bold text-white">Testimonials</h1>
          <p className="text-slate-400 text-sm mt-1">Manage client testimonials shown on the website</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
          <Plus className="h-4 w-4" /> Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(t => (
            <div key={t._id} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  {t.designation && <p className="text-xs text-slate-400">{t.designation}{t.company ? `, ${t.company}` : ''}</p>}
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.published ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-slate-500 bg-slate-700/50 border-slate-700'}`}>
                  {t.published ? 'Published' : 'Draft'}
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                ))}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 flex-1">{t.message}</p>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button onClick={() => togglePublish(t)} title={t.published ? 'Unpublish' : 'Publish'}
                  className={`p-1.5 rounded-lg transition-all ${t.published ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'}`}>
                  {t.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all ml-auto">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
              <Star className="h-10 w-10 mb-3" />
              <p>No testimonials yet. Add your first one.</p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'New Testimonial' : 'Edit Testimonial'}</h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: 'Full Name *', key: 'name', required: true },
                { label: 'Designation', key: 'designation' },
                { label: 'Company', key: 'company' },
              ].map(({ label, key, required }) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                  <input value={(form as Record<string, unknown>)[key] as string || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required={required}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(r => (
                    <button key={r} type="button" onClick={() => setForm(f => ({ ...f, rating: r }))}
                      className="p-1 transition-all">
                      <Star className={`h-6 w-6 ${r <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Testimonial Message *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  required rows={4} placeholder="What the client said..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-slate-300">Publish immediately</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                    className={`w-10 h-5 rounded-full transition-all ${form.published ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${form.published ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                    className="w-16 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none text-center" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : (modal === 'create' ? 'Create' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
