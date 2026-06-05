'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import api, { ApiError } from '@/lib/api';
import {
  FileText, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X,
  CheckCircle2, ChevronLeft, ChevronRight, Search, Globe,
  Tag, Calendar, TrendingUp, Bold, Italic, List,
  Heading1, Heading2, Link as LinkIcon, Image, Code, Quote
} from 'lucide-react';

interface Blog {
  _id: string; title: string; slug: string; excerpt?: string;
  content: string; coverImage?: string; tags: string[];
  category?: string; published: boolean; publishedAt?: string;
  metaTitle?: string; metaDescription?: string;
  views: number; createdAt: string;
  author: { name: string };
}

type FormData = {
  title: string; excerpt: string; content: string; coverImage: string;
  tags: string; category: string; published: boolean;
  metaTitle: string; metaDescription: string;
};

const EMPTY_FORM: FormData = {
  title: '', excerpt: '', content: '', coverImage: '',
  tags: '', category: '', published: false,
  metaTitle: '', metaDescription: '',
};

const CATEGORIES = [
  'Technology', 'Cybersecurity', 'Cloud Computing', 'Networking',
  'Data Center', 'AI & ML', 'Smart Buildings', 'Case Studies', 'News'
];

// ── Minimal toolbar button ────────────────────────────────────────────────────
function ToolbarBtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label}
      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all">
      <Icon className="h-4 w-4" />
    </button>
  );
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'seo'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Blog[]; pagination: { pages: number } }>(
        '/cms/blogs', {
          page, limit: 12,
          ...(publishedFilter !== '' && { published: publishedFilter }),
        }
      );
      setBlogs(res.data);
      setTotalPages(res.pagination.pages);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, publishedFilter]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId('');
    setActiveTab('write');
    setModal('create');
  };

  const openEdit = (b: Blog) => {
    setEditId(b._id);
    setForm({
      title: b.title, excerpt: b.excerpt || '', content: b.content,
      coverImage: b.coverImage || '', tags: b.tags.join(', '),
      category: b.category || '', published: b.published,
      metaTitle: b.metaTitle || '', metaDescription: b.metaDescription || '',
    });
    setActiveTab('write');
    setModal('edit');
  };

  // ── Toolbar insert helpers ──────────────────────────────────────────────────
  const insertAtCursor = (before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = form.content.substring(start, end);
    const newContent =
      form.content.substring(0, start) + before + selected + after + form.content.substring(end);
    setForm(f => ({ ...f, content: newContent }));
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  const TOOLBAR = [
    { icon: Heading1, label: 'Heading 1', action: () => insertAtCursor('# ') },
    { icon: Heading2, label: 'Heading 2', action: () => insertAtCursor('## ') },
    { icon: Bold, label: 'Bold', action: () => insertAtCursor('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertAtCursor('_', '_') },
    { icon: List, label: 'Bullet list', action: () => insertAtCursor('\n- ') },
    { icon: Quote, label: 'Blockquote', action: () => insertAtCursor('\n> ') },
    { icon: Code, label: 'Inline code', action: () => insertAtCursor('`', '`') },
    { icon: LinkIcon, label: 'Link', action: () => insertAtCursor('[', '](https://)') },
    { icon: Image, label: 'Image', action: () => insertAtCursor('![alt](', ')') },
  ];

  // ── Simple markdown → HTML preview ─────────────────────────────────────────
  const markdownToHtml = (md: string) => {
    return md
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-3">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-5 mb-2">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-slate-200 mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/_(.*?)_/g, '<em class="italic text-slate-300">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-700 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-cyan-500 pl-4 text-slate-400 italic my-3">$1</blockquote>')
      .replace(/^- (.*$)/gm, '<li class="text-slate-300 ml-4 list-disc">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-cyan-400 underline">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl max-w-full my-4"/>')
      .replace(/\n\n/g, '</p><p class="text-slate-300 leading-relaxed my-3">')
      .replace(/^(?!<[hblcipeq])(.+)$/gm, '<p class="text-slate-300 leading-relaxed">$1</p>');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (modal === 'create') await api.post('/cms/blogs', body);
      else await api.put(`/cms/blogs/${editId}`, body);
      showToast(`Blog post ${modal === 'create' ? 'created' : 'updated'}.`);
      setModal(null);
      fetchBlogs();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post permanently?')) return;
    try {
      await api.delete(`/cms/blogs/${id}`);
      showToast('Blog post deleted.');
      fetchBlogs();
    } catch { showToast('Delete failed.'); }
  };

  const togglePublish = async (b: Blog) => {
    try {
      await api.put(`/cms/blogs/${b._id}`, { published: !b.published });
      fetchBlogs();
    } catch { /* ignore */ }
  };

  const filtered = search
    ? blogs.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.category?.toLowerCase().includes(search.toLowerCase())
      )
    : blogs;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
          <p className="text-slate-400 text-sm mt-1">Create and manage SEO-optimised articles</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20">
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
        </div>
        <div className="flex gap-2">
          {[{ label: 'All', value: '' }, { label: 'Published', value: 'true' }, { label: 'Drafts', value: 'false' }].map(f => (
            <button key={f.value} onClick={() => { setPublishedFilter(f.value); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${publishedFilter === f.value ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Blog grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div key={b._id} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/60 transition-all flex flex-col">
              {/* Cover image */}
              {b.coverImage ? (
                <div className="h-36 bg-slate-800 overflow-hidden">
                  <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-slate-700" />
                </div>
              )}

              <div className="p-4 flex flex-col flex-1 gap-3">
                {/* Status & category */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.published ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-slate-500 bg-slate-700/50 border-slate-700'}`}>
                    {b.published ? 'Published' : 'Draft'}
                  </span>
                  {b.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">{b.category}</span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-1">{b.title}</h3>
                  {b.excerpt && <p className="text-xs text-slate-400 line-clamp-2">{b.excerpt}</p>}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-[10px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString('en-IN') : 'Not published'}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {b.views} views
                  </span>
                </div>

                {/* Tags */}
                {b.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {b.tags.slice(0, 3).map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-500">{t}</span>
                    ))}
                    {b.tags.length > 3 && <span className="text-[10px] text-slate-600">+{b.tags.length - 3}</span>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                  <button onClick={() => togglePublish(b)} title={b.published ? 'Unpublish' : 'Publish'}
                    className={`p-1.5 rounded-lg transition-all ${b.published ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'}`}>
                    {b.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <a href={`https://www.cyrotics.in/blog/${b.slug}`} target="_blank" rel="noreferrer"
                    className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-all" title="View on website">
                    <Globe className="h-4 w-4" />
                  </a>
                  <button onClick={() => handleDelete(b._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all ml-auto">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/60 border border-slate-700/50 rounded-2xl">
              <FileText className="h-12 w-12 mb-3" />
              <p className="text-slate-400 text-lg font-medium">No blog posts yet</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"><ChevronLeft className="h-4 w-4"/></button>
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"><ChevronRight className="h-4 w-4"/></button>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[94vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'New Blog Post' : 'Edit Blog Post'}</h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
              {/* Tabs */}
              <div className="flex gap-1 px-6 pt-4 shrink-0">
                {(['write', 'preview', 'seo'] as const).map(tab => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                    {tab === 'seo' ? 'SEO & Meta' : tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Title (always visible) */}
                <div className="mb-4">
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required placeholder="Post title..."
                    className="w-full bg-transparent border-0 border-b border-slate-700/50 pb-2 text-2xl font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
                </div>

                {/* ── Write tab ──────────────────────────────────────────────── */}
                {activeTab === 'write' && (
                  <div className="space-y-4">
                    {/* Excerpt */}
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Excerpt (shown in blog listing)</label>
                      <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                        rows={2} maxLength={400} placeholder="A short summary of the post..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none" />
                    </div>

                    {/* Cover image URL */}
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Cover Image URL</label>
                      <input value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
                      {form.coverImage && <img src={form.coverImage} alt="cover preview" className="mt-2 h-24 w-full object-cover rounded-xl" />}
                    </div>

                    {/* Category & Tags */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">Category</label>
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">
                          <option value="">Select category...</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">Tags (comma-separated)</label>
                        <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                          placeholder="cloud, security, networking"
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
                      </div>
                    </div>

                    {/* Toolbar */}
                    <div>
                      <div className="flex items-center gap-0.5 flex-wrap bg-slate-800/60 border border-slate-700/50 rounded-t-xl px-3 py-2 border-b-0">
                        {TOOLBAR.map(t => <ToolbarBtn key={t.label} icon={t.icon} label={t.label} onClick={t.action} />)}
                      </div>
                      {/* Markdown editor */}
                      <textarea ref={textareaRef} value={form.content}
                        onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                        required rows={16} placeholder="Write your post in Markdown...&#10;&#10;# Heading&#10;## Sub-heading&#10;**bold** _italic_ `code`&#10;- list item"
                        className="w-full bg-slate-800/30 border border-slate-700/50 rounded-b-xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm font-mono leading-relaxed focus:outline-none resize-none" />
                    </div>
                  </div>
                )}

                {/* ── Preview tab ─────────────────────────────────────────────── */}
                {activeTab === 'preview' && (
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 min-h-64">
                    <h1 className="text-2xl font-bold text-white mb-4">{form.title || 'Post title'}</h1>
                    {form.coverImage && <img src={form.coverImage} alt="cover" className="rounded-xl w-full h-48 object-cover mb-5" />}
                    <div className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(form.content || '*Start writing to see preview...*') }} />
                  </div>
                )}

                {/* ── SEO tab ─────────────────────────────────────────────────── */}
                {activeTab === 'seo' && (
                  <div className="space-y-5">
                    <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5" /> Google Search Preview
                      </p>
                      <div className="space-y-1 bg-white rounded-lg p-3">
                        <p className="text-blue-600 text-sm font-medium truncate">
                          {form.metaTitle || form.title || 'Post title | Cyrotics'}
                        </p>
                        <p className="text-green-700 text-xs">https://www.cyrotics.in/blog/slug</p>
                        <p className="text-slate-600 text-xs line-clamp-2">
                          {form.metaDescription || form.excerpt || 'No meta description set. Write one below for better SEO.'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">
                        Meta Title <span className="text-slate-600">(leave blank to use post title)</span>
                      </label>
                      <input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                        maxLength={70} placeholder="Custom SEO title..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none" />
                      <p className="text-xs text-slate-600 mt-1 text-right">{form.metaTitle.length}/70</p>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">
                        Meta Description <span className="text-slate-600">(150–160 chars ideal)</span>
                      </label>
                      <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                        maxLength={160} rows={3} placeholder="Brief description for search engines..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none" />
                      <p className={`text-xs mt-1 text-right ${form.metaDescription.length > 160 ? 'text-red-400' : form.metaDescription.length > 130 ? 'text-green-400' : 'text-slate-600'}`}>
                        {form.metaDescription.length}/160
                      </p>
                    </div>

                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SEO Checklist</p>
                      {[
                        { label: 'Title is set', pass: form.title.length > 0 },
                        { label: 'Title is 30–70 characters', pass: form.title.length >= 30 && form.title.length <= 70 },
                        { label: 'Excerpt/Meta description is set', pass: (form.excerpt || form.metaDescription).length > 0 },
                        { label: 'Meta description is 130–160 chars', pass: form.metaDescription.length >= 130 && form.metaDescription.length <= 160 },
                        { label: 'Category is selected', pass: form.category.length > 0 },
                        { label: 'Tags are added', pass: form.tags.length > 0 },
                        { label: 'Cover image is set', pass: form.coverImage.length > 0 },
                        { label: 'Content is at least 300 characters', pass: form.content.length >= 300 },
                      ].map(({ label, pass }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${pass ? 'bg-green-500' : 'bg-slate-700'}`}>
                            {pass && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className={pass ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-slate-800 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button type="button" onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                    className={`w-10 h-5 rounded-full transition-all ${form.published ? 'bg-green-500' : 'bg-slate-700'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform mx-0.5 ${form.published ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-slate-300">{form.published ? 'Published' : 'Draft'}</span>
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white text-sm transition-all hover:bg-slate-800">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50">
                    {saving ? 'Saving...' : (modal === 'create' ? 'Create Post' : 'Save Changes')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
