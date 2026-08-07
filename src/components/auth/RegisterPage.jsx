import React, { useState } from 'react';
import { ArrowRight, RefreshCw, UserPlus } from 'lucide-react';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function RegisterPage({ onRegister, onSwitch, loading, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setFieldError('Name is required'); return; }
    const emailErr = validateEmail(email);
    if (emailErr) { setFieldError(emailErr); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { setFieldError(pwErr); return; }
    setFieldError('');
    onRegister(name, email, password);
  };

  return (
    <div className="min-h-screen bg-[#080e1a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/assets/corein-logo-white.svg" alt="COREIN" className="h-10 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Create account</h1>
          <p className="text-slate-400 mt-2 text-sm">Join the COREIN workspace</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {error}
              </div>
            )}
            {fieldError && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                {fieldError}
              </div>
            )}

            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
              <input
                id="reg-name"
                name="fullName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                placeholder="Min 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={onSwitch} className="text-sm text-slate-400 hover:text-indigo-400 font-medium transition">
              Already have an account? <span className="text-indigo-400 font-semibold">Sign in</span>
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">COREIN Worker Portal v3.0</p>
      </div>
    </div>
  );
}