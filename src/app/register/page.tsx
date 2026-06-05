'use client';

import { useState } from 'react';
import Link from 'next/link';
import api, { ApiError } from '@/lib/api';
import {
  Shield, User, Building2, Mail, Phone, FileText,
  CheckCircle2, ArrowRight, Loader2, AlertCircle, Users, Eye
} from 'lucide-react';

type Step = 'form' | 'success';
type RoleRequested = 'client' | 'guest';

const ROLE_OPTIONS = [
  {
    value: 'client' as RoleRequested,
    label: 'Client Access',
    description: 'Full portal access — track your projects, raise tickets, download documents.',
    icon: Building2,
    badge: 'Requires approval',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    value: 'guest' as RoleRequested,
    label: 'Guest Access',
    description: 'Temporary read-only access to view assigned project updates.',
    icon: Eye,
    badge: 'Limited access',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
];

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', company: '',
    designation: '', purpose: '', roleRequested: 'client' as RoleRequested,
    projectReference: '',
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.purpose.length < 20) {
      setError('Please describe your purpose in at least 20 characters.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/register', form);
      setStep('success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f2e] via-[#030712] to-[#0a0f2e]" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(14,165,233,0.08) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="https://www.cyrotics.in">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-widest">CYROTICS</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Request Portal Access</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Submit your details below. Our team reviews requests within 1–2 business days and will notify you by email.
          </p>
        </div>

        {step === 'success' ? (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-10 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Request Submitted!</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Your access request has been received. We&apos;ll review it and send login credentials to{' '}
              <strong className="text-white">{form.email}</strong> within 1–2 business days.
            </p>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Name</span>
                <span className="text-slate-200">{form.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Access type</span>
                <span className="text-cyan-400 capitalize">{form.roleRequested}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className="text-amber-400">Pending review</span>
              </div>
            </div>
            <Link href="/login"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
              Go to Login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
                  Access Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => update('roleRequested', opt.value)}
                      className={`relative text-left p-4 rounded-xl border transition-all ${
                        form.roleRequested === opt.value
                          ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                          : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${form.roleRequested === opt.value ? 'bg-cyan-500/20' : 'bg-slate-700/50'}`}>
                          <opt.icon className={`h-4 w-4 ${form.roleRequested === opt.value ? 'text-cyan-400' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-white">{opt.label}</p>
                            {form.roleRequested === opt.value && (
                              <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
                          <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}>
                            {opt.badge}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Personal Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full Name *" value={form.name} onChange={v => update('name', v)}
                    placeholder="Rajesh Kumar" required />
                  <Field label="Email Address *" type="email" value={form.email}
                    onChange={v => update('email', v)} placeholder="rajesh@company.com" required />
                  <Field label="Mobile Number" value={form.mobile}
                    onChange={v => update('mobile', v)} placeholder="+91 98765 43210" />
                  <Field label="Designation" value={form.designation}
                    onChange={v => update('designation', v)} placeholder="IT Manager" />
                </div>
              </div>

              {/* Company Info */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" /> Company Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Company / Organisation" value={form.company}
                    onChange={v => update('company', v)} placeholder="Acme Corporation" />
                  <Field label="Project Reference (if any)" value={form.projectReference}
                    onChange={v => update('projectReference', v)} placeholder="CYR-0001 or project name" />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> Purpose / Reason for Access *
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Describe why you need access and how you are associated with Cyrotics Technologies. Minimum 20 characters.
                </p>
                <textarea
                  value={form.purpose}
                  onChange={e => update('purpose', e.target.value)}
                  required minLength={20} rows={4}
                  placeholder="e.g. I am the IT Head at Acme Corporation and we have an ongoing data center project with Cyrotics (CYR-0012). I need access to track milestones and download documents..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                />
                <p className="text-xs text-slate-600 mt-1 text-right">{form.purpose.length} chars</p>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting request...</>
                ) : (
                  <>Submit Access Request <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
              <p className="text-slate-400 text-sm">
                Already have access?{' '}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
      />
    </div>
  );
}
