import React, { useState } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><span className="text-white font-bold text-lg">CORE</span></div>
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">{error}</div>}
          {fieldError && <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-medium">{fieldError}</div>}
          <div><label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label><input id="reg-name" name="fullName" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" /></div>
          <div><label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1">Email</label><input id="reg-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" /></div>
          <div><label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1">Password</label><input id="reg-password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Min 6 characters" /></div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-md">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <div className="mt-6 text-center"><button onClick={onSwitch} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Already have an account? Sign in</button></div>
      </div>
    </div>
  );
}
