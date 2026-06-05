'use client';

import { useState } from 'react';
import api, { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock, Shield, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

type Tab = 'profile' | 'security' | '2fa';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const accentColor = user?.dashboardConfig?.accentColor || '#0ea5e9';
  const [tab, setTab] = useState<Tab>('profile');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '', mobile: user?.mobile || '',
    company: user?.company || '', designation: user?.designation || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [tfaSetupDone, setTfaSetupDone] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { setError('Passwords do not match.'); return; }
    if (passwords.newPassword.length < 8) { setError('Min 8 characters.'); return; }
    setSubmitting(true); setError('');
    try {
      await api.put('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      showToast('Password changed successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const setup2FA = async () => {
    setSubmitting(true);
    try {
      const res = await api.post<{ data: { qrCode: string } }>('/auth/2fa/setup');
      setQrCode(res.data.qrCode);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const verify2FA = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await api.post('/auth/2fa/verify', { code: tfaCode });
      setTfaSetupDone(true); showToast('2FA enabled!'); refreshUser();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Invalid code.'); }
    finally { setSubmitting(false); }
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Password', icon: Lock },
    { key: '2fa', label: '2FA', icon: Shield },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-slate-600 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" /> {toast}
        </div>
      )}
      <div><h1 className="text-2xl font-bold text-white">My Profile</h1></div>
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
          style={{ background: `linear-gradient(135deg, ${accentColor}, #6366f1)` }}>
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-bold text-white">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize mt-1 inline-block"
            style={{ background: `${accentColor}20`, color: accentColor }}>{user?.role}</span>
        </div>
      </div>
      <div className="flex gap-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            style={tab === t.key ? { background: `${accentColor}25` } : {}}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {tab === 'profile' && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[{label:'Full Name',key:'name'},{label:'Mobile',key:'mobile'},{label:'Company',key:'company'},{label:'Designation',key:'designation'}].map(({label,key})=>(
              <div key={key}>
                <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                <input value={profile[key as keyof typeof profile]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"/>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Email (cannot change)</label>
            <input value={user?.email} disabled className="w-full bg-slate-800/20 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 text-sm cursor-not-allowed"/>
          </div>
          <button onClick={()=>showToast('Profile saved.')} className="px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:opacity-90"
            style={{background:`linear-gradient(135deg,${accentColor},#6366f1)`}}>Save Changes</button>
        </div>
      )}
      {tab === 'security' && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[{label:'Current Password',key:'currentPassword'},{label:'New Password',key:'newPassword'},{label:'Confirm New Password',key:'confirmPassword'}].map(({label,key})=>(
              <div key={key}>
                <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                <div className="relative">
                  <input type={showPw?'text':'password'} value={passwords[key as keyof typeof passwords]}
                    onChange={e=>setPasswords(p=>({...p,[key]:e.target.value}))} required
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"/>
                  {key==='newPassword'&&<button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showPw?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                  </button>}
                </div>
              </div>
            ))}
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{background:`linear-gradient(135deg,${accentColor},#6366f1)`}}>
              {submitting?<><Loader2 className="h-4 w-4 animate-spin"/>Updating...</>:'Change Password'}
            </button>
          </form>
        </div>
      )}
      {tab === '2fa' && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center">
          {user?.twoFactorEnabled||tfaSetupDone?(
            <><CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3"/><h3 className="text-lg font-bold text-white mb-2">2FA is Active</h3></>
          ):!qrCode?(
            <><Shield className="h-12 w-12 text-slate-600 mx-auto mb-3"/>
            <h3 className="text-lg font-bold text-white mb-2">Enable Two-Factor Authentication</h3>
            <p className="text-slate-400 text-sm mb-6">Add extra security with Google Authenticator or Authy.</p>
            <button onClick={setup2FA} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-sm mx-auto transition-all hover:opacity-90"
              style={{background:`linear-gradient(135deg,${accentColor},#6366f1)`}}>
              {submitting?<Loader2 className="h-4 w-4 animate-spin"/>:<Shield className="h-4 w-4"/>}Setup 2FA
            </button></>
          ):(
            <form onSubmit={verify2FA} className="space-y-4 max-w-xs mx-auto">
              <img src={qrCode} alt="2FA QR" className="w-48 h-48 bg-white p-2 rounded-xl mx-auto"/>
              <input value={tfaCode} onChange={e=>setTfaCode(e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6} required
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none" placeholder="000000"/>
              <button type="submit" disabled={submitting||tfaCode.length<6} className="w-full py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
                style={{background:`linear-gradient(135deg,${accentColor},#6366f1)`}}>Verify & Enable</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
