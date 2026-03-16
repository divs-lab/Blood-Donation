
import React from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  userName: string;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  isEmergency: boolean;
  toggleEmergency: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRole, userName, onLogout, isEmergency, toggleEmergency }) => {
  
  // Define role-specific navigation to ensure a clean "Citizen" portal
  const getNavLinks = () => {
    switch(activeRole) {
      case UserRole.DONOR:
        return [
          { label: 'My Impact', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
          { label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'Centers', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
          { label: 'Records', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
        ];
      case UserRole.HOSPITAL:
        return [
          { label: 'Ward Overview', icon: 'M4 6h16M4 12h16M4 18h16' },
          { label: 'Blood Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { label: 'Transfusions', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
        ];
      case UserRole.BLOOD_BANK:
        return [
          { label: 'Global Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { label: 'Expiry Monitor', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Logistics', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' }
        ];
      default:
        return [{ label: 'Dashboard', icon: 'M4 6h16M4 12h16M4 18h16' }];
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 ${isEmergency ? 'border-t-8 border-red-600' : ''}`}>
      {/* Top Banner for Emergency */}
      {isEmergency && (
        <div className="bg-red-600 text-white text-center py-2 px-6 flex justify-between items-center animate-pulse sticky top-0 z-50 shadow-lg">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-black tracking-widest uppercase text-xs">National Emergency Protocol Active: Supply Levels Critical</span>
          </div>
          <button 
            onClick={toggleEmergency} 
            className="text-[10px] bg-white text-red-600 px-3 py-1 rounded-full font-black uppercase hover:bg-slate-100 transition-colors"
          >
            End Protocol
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white p-2 rounded-lg font-bold text-xl shadow-sm">LS</div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none tracking-tighter">LifeStream</h1>
            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mt-0.5">National Coordination</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleEmergency}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              isEmergency 
              ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200 scale-105' 
              : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isEmergency ? 'bg-white animate-pulse' : 'bg-red-600'}`}></div>
            {isEmergency ? 'System Alert: ON' : 'Trigger Emergency'}
          </button>

          <div className="h-8 w-px bg-gray-100 mx-1"></div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
            <div className={`w-1.5 h-1.5 rounded-full ${isEmergency ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Portal: {activeRole.replace('_', ' ')}</span>
          </div>
          
          <div className="h-8 w-px bg-gray-100 mx-1"></div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-700 leading-none">{userName}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Authorized Account</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-100">
                {userName.charAt(0)}
              </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Terminate Session"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Contextual based on Role */}
        <aside className="w-64 bg-white border-r border-gray-100 hidden lg:flex flex-col p-4 gap-2">
          <div className="mb-6 px-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Utilities</div>
          
          {getNavLinks().map((item) => (
            <button key={item.label} className="flex items-center gap-3 px-3 py-3 text-xs font-black text-slate-600 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-wider group">
              <svg className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:text-blue-600 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}

          <div className="mt-auto border-t border-gray-50 pt-6 px-2">
            <div className={`p-5 rounded-[2rem] text-white overflow-hidden relative transition-colors duration-500 ${isEmergency ? 'bg-red-600' : 'bg-slate-900'}`}>
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Compliance</p>
              <p className="text-[10px] font-bold leading-relaxed">
                {isEmergency ? 'EMERGENCY PROTOCOL: Authorized staff only.' : 'Audit logs active for all transactions.'}
              </p>
            </div>
          </div>
        </aside>

        <main className={`flex-1 overflow-y-auto p-8 transition-colors duration-500 ${isEmergency ? 'bg-red-50/30' : 'bg-[#f8fafc]'}`}>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
