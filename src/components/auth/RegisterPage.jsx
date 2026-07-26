import React, { useState } from 'react';

export default function RegisterPage({ onRegister, onSwitch, loading, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
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
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" /></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" /></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Min 6 characters" /></div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-md">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <div className="mt-6 text-center"><button onClick={onSwitch} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Already have an account? Sign in</button></div>
      </div>
    </div>
  );
}
