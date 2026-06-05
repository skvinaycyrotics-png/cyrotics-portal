'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Share2, Plus, Trash2, Save, Loader2, CheckCircle2, Link as LinkIcon } from 'lucide-react';

interface SocialLink { platform: string; url: string; icon: string; order: number; active: boolean; }

const PLATFORMS = [
  { name: 'LinkedIn', icon: 'linkedin', placeholder: 'https://linkedin.com/company/cyrotics' },
  { name: 'Twitter / X', icon: 'twitter', placeholder: 'https://twitter.com/cyrotics' },
  { name: 'Instagram', icon: 'instagram', placeholder: 'https://instagram.com/cyrotics' },
  { name: 'YouTube', icon: 'youtube', placeholder: 'https://youtube.com/@cyrotics' },
  { name: 'Facebook', icon: 'facebook', placeholder: 'https://facebook.com/cyrotics' },
  { name: 'GitHub', icon: 'github', placeholder: 'https://github.com/cyrotics' },
];

const BRAND_COLORS: Record<string, string> = {
  linkedin: 'text-blue-400', twitter: 'text-sky-400', instagram: 'text-pink-400',
  youtube: 'text-red-400', facebook: 'text-blue-500', github: 'text-slate-300',
};

export default function SocialLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: { links: SocialLink[] } }>('/cms/social-links');
      setLinks(res.data.links);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchLinks(); }, []);

  const addLink = () => {
    setLinks(l => [...l, { platform: '', url: '', icon: '', order: l.length + 1, active: true }]);
  };

  const updateLink = (idx: number, field: keyof SocialLink, value: string | boolean | number) => {
    setLinks(l => l.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const selectPlatform = (idx: number, platform: typeof PLATFORMS[0]) => {
    setLinks(l => l.map((item, i) => i === idx ? { ...item, platform: platform.name, icon: platform.icon } : item));
  };

  const removeLink = (idx: number) => {
    setLinks(l => l.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/cms/social-links', { links: links.filter(l => l.platform && l.url) });
      showToast('Social links saved successfully.');
      fetchLinks();
    } catch { showToast('Save failed.'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Social Media Links</h1>
          <p className="text-slate-400 text-sm mt-1">Manage social profile links shown on the website</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addLink} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-300 text-sm hover:text-white transition-all">
            <Plus className="h-4 w-4" /> Add Link
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
      ) : (
        <div className="space-y-3">
          {links.map((link, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
              {/* Platform icon */}
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center shrink-0">
                <Share2 className={`h-5 w-5 ${BRAND_COLORS[link.icon] || 'text-slate-400'}`} />
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-2">
                {/* Platform picker */}
                <div className="sm:col-span-2">
                  <select value={link.platform}
                    onChange={e => {
                      const p = PLATFORMS.find(p => p.name === e.target.value);
                      if (p) selectPlatform(idx, p);
                      else updateLink(idx, 'platform', e.target.value);
                    }}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
                    <option value="">Select platform</option>
                    {PLATFORMS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                {/* URL */}
                <div className="sm:col-span-3 relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)}
                    placeholder={PLATFORMS.find(p => p.name === link.platform)?.placeholder || 'https://...'}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-600 text-sm focus:outline-none" />
                </div>
              </div>

              {/* Active toggle */}
              <button type="button" onClick={() => updateLink(idx, 'active', !link.active)}
                title={link.active ? 'Active' : 'Inactive'}
                className={`w-9 h-5 rounded-full transition-all shrink-0 ${link.active ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform mx-0.5 ${link.active ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>

              <button onClick={() => removeLink(idx)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {links.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-900/60 border border-slate-700/50 rounded-2xl">
              <Share2 className="h-10 w-10 mb-3" />
              <p>No social links yet. Add your first one.</p>
            </div>
          )}
        </div>
      )}

      {links.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Links
          </button>
        </div>
      )}
    </div>
  );
}
