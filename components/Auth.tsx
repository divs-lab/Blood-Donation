
import React, { useState } from 'react';
import { UserRole, BloodType, AuthUser } from '../types';
import { BLOOD_TYPES } from '../constants';
import { ApiService } from '../services/storeService';

interface AuthProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.DONOR);
  const [bloodType, setBloodType] = useState<BloodType>('O+');
  const [facilityName, setFacilityName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'SIGNUP') {
        const newUser: AuthUser = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          password,
          name: role === UserRole.DONOR ? name : facilityName,
          role,
          bloodType: role === UserRole.DONOR ? bloodType : undefined,
          facilityName: role !== UserRole.DONOR ? facilityName : undefined,
        };
        await ApiService.registerUser(newUser);
        setView('LOGIN');
        setError("Account registered. Please authenticate.");
      } else {
        const user = await ApiService.loginUser(email, password);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="mb-10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-red-600 text-white p-3 rounded-2xl font-black text-2xl shadow-xl shadow-red-200">LS</div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 leading-none tracking-tighter">LifeStream</h1>
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-[0.3em] mt-1">National Terminal</p>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 overflow-hidden relative">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
            {view === 'LOGIN' ? 'Node Access' : 'Node Enrollment'}
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            {view === 'LOGIN' ? 'Secure entry for health personnel.' : 'Register new authority credentials.'}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-bold uppercase tracking-widest ${error.includes('registered') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {view === 'SIGNUP' && (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Authority Role</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                >
                  {Object.values(UserRole).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>

              {role === UserRole.DONOR ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Legal Full Name</label>
                  <input 
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors" 
                    placeholder="Enter your name" 
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Facility/Entity Name</label>
                  <input 
                    type="text" required value={facilityName} onChange={e => setFacilityName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors" 
                    placeholder="e.g. Metro General Hub" 
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Authorized Email</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors" 
              placeholder="id@healthcare.gov" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Secure Passphrase</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 mt-4 bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : (view === 'LOGIN' ? 'AUTHENTICATE' : 'ENROLL DEVICE')}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
          <button 
            onClick={() => setView(view === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
          >
            {view === 'LOGIN' ? 'Need system enrollment? Create account' : 'Already have credentials? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};
