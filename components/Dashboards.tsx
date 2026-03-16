
import React, { useState, useMemo, useEffect } from 'react';
import { BloodStock, RequestItem, UserRole, BloodType, BloodUnit, ComponentType, UnitHistoryEntry } from '../types';
import { BLOOD_TYPES, COLORS } from '../constants';
import InventoryChart from './InventoryChart';

// --- SHARED COMPONENTS ---
const StatCard = ({ label, value, subtext, colorClass = "text-slate-800" }: { label: string, value: string | number, subtext?: string, colorClass?: string }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black tracking-tight ${colorClass}`}>{value}</p>
    </div>
    {subtext && <p className="text-[10px] text-slate-500 font-medium mt-2">{subtext}</p>}
  </div>
);

const PlatformHeader = ({ title, subtitle, icon }: { title: string, subtitle: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
      {icon}
    </div>
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title} <span className="text-blue-700">Portal</span></h2>
      <p className="text-sm text-slate-500 font-medium mt-1">{subtitle}</p>
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="p-16 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{message}</p>
  </div>
);

// --- BLOOD BANK PLATFORM (EXPIRY TRACKING) ---
export const BloodBankDashboard: React.FC<{ 
  units: BloodUnit[],
  onAddUnit: (unit: BloodUnit) => void,
  onUpdateUnitStatus: (unitId: string, status: BloodUnit['status']) => void
}> = ({ units, onAddUnit, onUpdateUnitStatus }) => {
  const [filter, setFilter] = useState<'ALL' | 'EXPIRING' | 'EXPIRED'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'HISTORY'>('DETAILS');
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId) || null, [units, selectedUnitId]);

  // Intake Form State
  const [intakeForm, setIntakeForm] = useState({
    type: 'O+' as BloodType,
    componentType: 'WHOLE_BLOOD' as ComponentType,
    volume: 450,
    collectionDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });

  // Intelligent Expiry Calculation based on Component Type
  useEffect(() => {
    if (!intakeForm.collectionDate) return;
    
    const collection = new Date(intakeForm.collectionDate);
    let daysToAdd = 35; // Default for Whole Blood

    switch(intakeForm.componentType) {
      case 'PLATELETS': daysToAdd = 5; break;
      case 'RED_CELLS': daysToAdd = 42; break;
      case 'PLASMA': daysToAdd = 365; break;
      case 'WHOLE_BLOOD': daysToAdd = 35; break;
    }

    const expiry = new Date(collection.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    setIntakeForm(prev => ({ ...prev, expiryDate: expiry.toISOString().split('T')[0] }));
  }, [intakeForm.componentType, intakeForm.collectionDate]);

  const filteredUnits = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return units.filter(unit => {
      const expDate = new Date(unit.expiryDate);
      if (filter === 'EXPIRED') return expDate < now;
      if (filter === 'EXPIRING') return expDate >= now && expDate < sevenDaysFromNow;
      return true;
    });
  }, [units, filter]);

  // Enhanced metadata utility for visual highlighting
  const getExpiryMeta = (date: string) => {
    const expDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        label: 'Expired', 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        border: 'border-l-4 border-l-red-500',
        icon: (
          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        )
      };
    }
    if (diffDays < 7) {
      return { 
        label: `${diffDays}d remaining`, 
        color: 'text-orange-600 font-black', 
        bg: 'bg-orange-50', 
        border: 'border-l-4 border-l-orange-500 animate-pulse',
        icon: (
          <svg className="w-3 h-3 text-orange-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      };
    }
    if (diffDays < 14) {
      return { 
        label: `${diffDays}d remaining`, 
        color: 'text-amber-600', 
        bg: 'bg-amber-50', 
        border: 'border-l-4 border-l-amber-300',
        icon: null
      };
    }
    return { 
      label: `${diffDays}d remaining`, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      border: 'border-l-0',
      icon: null 
    };
  };

  const counts = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      all: units.length,
      expiring: units.filter(u => {
        const d = new Date(u.expiryDate);
        return d >= now && d < sevenDaysFromNow;
      }).length,
      expired: units.filter(u => new Date(u.expiryDate) < now).length
    };
  }, [units]);

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUnit({
      id: Math.random().toString(36).substr(2, 9),
      serialNumber: `LS-${Math.floor(Math.random() * 900000 + 100000)}`,
      type: intakeForm.type,
      componentType: intakeForm.componentType,
      volume: intakeForm.volume,
      expiryDate: new Date(intakeForm.expiryDate).toISOString(),
      collectionDate: new Date(intakeForm.collectionDate).toISOString(),
      receivedDate: new Date().toISOString(),
      status: 'VALID',
      history: []
    });
    setShowAddForm(false);
  };

  const handleStatusChange = async (newStatus: BloodUnit['status']) => {
    if (!selectedUnitId) return;
    setIsUpdating(true);
    await onUpdateUnitStatus(selectedUnitId, newStatus);
    setIsUpdating(false);
  };

  return (
    <div className="space-y-6">
      <PlatformHeader 
        title="Blood Logistics" 
        subtitle="Manage national supply chain and track unit integrity."
        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-lg font-black text-slate-800">Unit Inventory Matrix</h3>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { key: 'ALL', label: 'All', count: counts.all },
                { key: 'EXPIRING', label: 'Expiring', count: counts.expiring },
                { key: 'EXPIRED', label: 'Expired', count: counts.expired }
              ].map(f => (
                <button 
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 ${filter === f.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${filter === f.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            {filteredUnits.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="pb-4 pl-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial / Type</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Component</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrity Metrics</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUnits.map(unit => {
                    const meta = getExpiryMeta(unit.expiryDate);
                    return (
                      <tr 
                        key={unit.id} 
                        onClick={() => { setSelectedUnitId(unit.id); setActiveTab('DETAILS'); }}
                        className={`group hover:bg-slate-50 cursor-pointer transition-all ${meta.border}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xs font-black border border-red-100">{unit.type}</span>
                            <div>
                               <p className="font-black text-slate-700 text-xs">{unit.serialNumber}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Registered Hub Node</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                           <span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 px-2 py-1 rounded-md">
                              {unit.componentType?.replace('_', ' ') || 'WHOLE BLOOD'}
                           </span>
                           <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{unit.volume}ml Vol</p>
                        </td>
                        <td className="py-4">
                           <div className="flex items-center gap-2">
                             {meta.icon}
                             <p className="text-xs font-bold text-slate-800">Exp: {new Date(unit.expiryDate).toLocaleDateString()}</p>
                           </div>
                           <p className={`text-[9px] uppercase font-black ${meta.color}`}>{meta.label}</p>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${meta.bg} ${meta.color}`}>
                            {unit.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState message={`No ${filter.toLowerCase()} units found in the local node ledger.`} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full bg-blue-600 text-white p-6 rounded-3xl font-black text-xs tracking-widest uppercase hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            Register Intake
          </button>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Node Health</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Total Valid Units</span>
                <span className="text-sm font-black text-slate-800">{counts.all}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Critical Expiry</span>
                <span className="text-sm font-black text-red-600 animate-pulse">
                  {counts.expiring}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE INTAKE REGISTRATION MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2 text-balance">Inventory Intake Protocol</h3>
                  <p className="text-sm text-slate-500 font-medium">Verify all biological markers before ledger commitment.</p>
                </div>
                <button onClick={() => setShowAddForm(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <form onSubmit={handleIntakeSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Blood Group</label>
                    <select 
                      required
                      value={intakeForm.type}
                      onChange={e => setIntakeForm({...intakeForm, type: e.target.value as BloodType})}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-800 focus:border-blue-500 transition-colors"
                    >
                      {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Component Category</label>
                    <select 
                      required
                      value={intakeForm.componentType}
                      onChange={e => setIntakeForm({...intakeForm, componentType: e.target.value as ComponentType})}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-800 focus:border-blue-500 transition-colors"
                    >
                      <option value="WHOLE_BLOOD">Whole Blood (35 days)</option>
                      <option value="RED_CELLS">Packed Red Cells (42 days)</option>
                      <option value="PLATELETS">Platelets (5 days)</option>
                      <option value="PLASMA">Plasma (365 days)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Volume (ml)</label>
                    <input 
                      type="number" 
                      required
                      min="100"
                      max="800"
                      value={intakeForm.volume}
                      onChange={e => setIntakeForm({...intakeForm, volume: parseInt(e.target.value)})}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-800 focus:border-blue-500 transition-colors" 
                      placeholder="e.g. 450"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Collection Date</label>
                    <input 
                      type="date" 
                      required
                      max={new Date().toISOString().split('T')[0]}
                      value={intakeForm.collectionDate}
                      onChange={e => setIntakeForm({...intakeForm, collectionDate: e.target.value})}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-800 focus:border-blue-500 transition-colors" 
                    />
                  </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Calculated Biological Expiry</label>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-black text-blue-900">{new Date(intakeForm.expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-tighter">System Verified</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-bold uppercase mt-3 opacity-60">Protocol: Standard shelf-life for {intakeForm.componentType.replace('_', ' ')} applied.</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all">Abort Intake</button>
                  <button type="submit" className="flex-[2] w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    COMMIT TO LEDGER
                  </button>
                </div>
              </form>
            </div>
            <div className="bg-slate-50 px-10 py-4 border-t border-slate-100">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L9.03 9.069a1.003 1.003 0 00.94 0l6.864-4.171A1 1 0 0015.866 3H4.134a1 1 0 00-.968 1.9zM3 10.47V15a2 2 0 002 2h10a2 2 0 002-2v-4.53l-6.84 4.144a2 2 0 01-1.637 0L3 10.47z" clipRule="evenodd" /></svg>
                Distributed Node Sync Enabled: Transaction ID will be immutable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* UNIT DETAILS MODAL */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
             <div className="p-8 pb-0 flex items-center justify-between border-b border-slate-100">
               <div className="flex gap-6">
                 <button 
                   onClick={() => setActiveTab('DETAILS')}
                   className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'DETAILS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
                 >
                   Unit Details
                 </button>
                 <button 
                   onClick={() => setActiveTab('HISTORY')}
                   className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
                 >
                   Transaction History
                 </button>
               </div>
               <button onClick={() => setSelectedUnitId(null)} className="mb-4 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-xl">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>

             <div className="p-10 max-h-[70vh] overflow-y-auto">
               {activeTab === 'DETAILS' ? (
                 <div className="animate-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 font-black text-xl border border-red-100 shadow-sm">
                         {selectedUnit.type}
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-800 leading-none">{selectedUnit.serialNumber}</h3>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Unit Identification Node</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Component Profile</p>
                        <p className="text-sm font-black text-slate-800 uppercase bg-slate-100 inline-block px-3 py-1 rounded-lg">
                           {selectedUnit.componentType?.replace('_', ' ') || 'WHOLE BLOOD'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Net Volume</p>
                        <p className="text-lg font-black text-slate-800">{selectedUnit.volume} <span className="text-xs font-bold text-slate-400">ML</span></p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Collection Timestamp</p>
                        <p className="text-sm font-bold text-slate-700">{new Date(selectedUnit.collectionDate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Reception into Node</p>
                        <p className="text-sm font-bold text-slate-700">{new Date(selectedUnit.receivedDate).toLocaleString()}</p>
                      </div>

                      <div className="col-span-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <div className="flex justify-between items-center">
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Biological Integrity</p>
                               <p className="text-sm font-black text-slate-800">Expiry Protocol: {new Date(selectedUnit.expiryDate).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${getExpiryMeta(selectedUnit.expiryDate).bg} ${getExpiryMeta(selectedUnit.expiryDate).color}`}>
                               {getExpiryMeta(selectedUnit.expiryDate).label}
                            </span>
                         </div>
                      </div>

                      <div className="col-span-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Update Deployment Status</p>
                        <div className="grid grid-cols-4 gap-2">
                          {(['VALID', 'USED', 'RESERVED', 'EXPIRED'] as BloodUnit['status'][]).map(status => (
                            <button
                              key={status}
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(status)}
                              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                selectedUnit.status === status 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
                              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="animate-in slide-in-from-right-4 duration-300">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Unit Lifecycle Ledger</h4>
                    <div className="space-y-6 relative">
                       <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                       {selectedUnit.history && selectedUnit.history.length > 0 ? (
                         selectedUnit.history.map((entry, idx) => (
                           <div key={entry.id} className="relative pl-10">
                              <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${idx === 0 ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                 <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              </div>
                              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                 <div className="flex justify-between items-start mb-1">
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider">{entry.action.replace('_', ' ')}</p>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(entry.timestamp).toLocaleString()}</span>
                                 </div>
                                 <p className="text-[10px] text-slate-500 font-medium mb-2">Performed by: <span className="font-black text-slate-700">{entry.performedBy}</span></p>
                                 {entry.statusChange && (
                                   <div className="flex items-center gap-2 mt-2">
                                      <span className="text-[9px] font-black px-2 py-0.5 bg-slate-200 text-slate-500 rounded uppercase">{entry.statusChange.from}</span>
                                      <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                      <span className="text-[9px] font-black px-2 py-0.5 bg-blue-100 text-blue-600 rounded uppercase">{entry.statusChange.to}</span>
                                   </div>
                                 )}
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No transaction history found.</p>
                         </div>
                       )}
                    </div>
                 </div>
               )}

               <div className="mt-12 flex gap-4">
                  <button className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all">
                     Print ID Label
                  </button>
                  <button 
                    onClick={() => setSelectedUnitId(null)}
                    className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                     Close Overview
                  </button>
               </div>
             </div>
             <div className="bg-slate-900 text-white/50 px-10 py-5 text-[9px] font-black uppercase tracking-[0.3em] flex justify-between items-center">
                <span>LifeStream Audit ID: {selectedUnit.id}</span>
                <span className="text-white/20">Verified Ledger Entry</span>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- ADMIN PLATFORM ---
export const AdminDashboard: React.FC<{ logs: any[] }> = ({ logs }) => (
  <div className="space-y-6">
    <PlatformHeader 
      title="System Audit" 
      subtitle="Distributed network administration and security monitoring."
      icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
    />

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
       <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Status</p>
          <div className="flex items-center gap-2 mt-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <p className="text-lg font-black text-slate-800">Operational</p>
          </div>
       </div>
       <StatCard label="Live Nodes" value="1" subtext="Local Machine Hub" />
       <StatCard label="Audit Records" value={logs.length} subtext="System Log Depth" />
       <StatCard label="Data Integrity" value="Verified" colorClass="text-emerald-600" subtext="Local Storage Mode" />
    </div>

    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
      <h3 className="text-lg font-black text-slate-800 mb-6">Security & Transaction Log</h3>
      {logs.length > 0 ? (
        <div className="space-y-4">
           {logs.map((log) => (
             <div key={log.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-xl">
                <div className={`w-1.5 h-1.5 rounded-full ${log.severity === 'CRITICAL' ? 'bg-red-500 animate-ping' : log.severity === 'MODERATE' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-slate-800">{log.action}</p>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(log.ts).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Node: {log.node}</p>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <EmptyState message="No system logs generated yet" />
      )}
    </div>
  </div>
);

// --- DONOR PLATFORM ---
export const DonorDashboard: React.FC<{ name: string }> = ({ name }) => (
  <div className="space-y-6">
    <PlatformHeader 
      title="Citizen" 
      subtitle={`Welcome to LifeStream, ${name}. Your life-saving journey starts here.`}
      icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
    />
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard label="Donations" value="0 Units" subtext="No history found" />
      <StatCard label="Impact Score" value="0" colorClass="text-emerald-600" subtext="Help save lives" />
      <StatCard label="Blood Type" value="Unknown" colorClass="text-slate-400" subtext="Pending verification" />
      <StatCard label="Service Points" value="0" colorClass="text-blue-600" subtext="Level 1 Access" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6">Eligible Donation Timeline</h3>
        <EmptyState message="Complete your first donation to track eligibility" />
        <div className="mt-8 flex justify-end">
           <button className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-slate-900 transition-all shadow-xl shadow-slate-200">
              BOOK INITIAL APPOINTMENT
            </button>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 flex flex-col justify-between overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div>
          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-4">Digital Identity</p>
          <p className="text-xl font-black tracking-tight mb-1">LS-NEW-CITIZEN</p>
          <p className="text-xs font-medium opacity-80">Pending Identity Verification</p>
        </div>
        <div className="mt-8">
           <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center text-white/40 border border-white/10 border-dashed">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
           </div>
           <p className="text-[10px] font-bold opacity-60 mt-4">Barcode generated upon enrollment</p>
        </div>
      </div>
    </div>
  </div>
);

// --- HOSPITAL PLATFORM ---
export const HospitalDashboard: React.FC<{ 
  stock: BloodStock[], 
  requests: RequestItem[], 
  onRequestEmergency: () => void 
}> = ({ stock, requests, onRequestEmergency }) => (
  <div className="space-y-6">
    <PlatformHeader 
      title="Medical Hub" 
      subtitle="Authorized facility dashboard. Zero mock data active."
      icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
    />

    {stock.length === 0 ? (
      <EmptyState message="Facility inventory is currently empty. Please register initial stock." />
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {BLOOD_TYPES.map(type => {
          const item = stock.find(s => s.type === type);
          const isLow = item && item.units < item.criticalLevel;
          return (
            <div key={type} className={`p-4 rounded-2xl border transition-all ${isLow ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'} shadow-sm flex flex-col items-center`}>
              <p className={`text-sm font-black mb-1 ${isLow ? 'text-red-600' : 'text-slate-400'}`}>{type}</p>
              <p className={`text-xl font-black ${isLow ? 'text-red-700' : 'text-slate-800'}`}>{item?.units || 0}</p>
            </div>
          );
        })}
      </div>
    )}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Active Shipments & Orders</h3>
        </div>
        <div className="p-0 min-h-[300px]">
          {requests.length > 0 ? (
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-800">{req.id}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(req.timestamp).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-blue-700">{req.type}</span>
                      <span className="text-[10px] text-slate-500 ml-2">{req.units} Units</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${req.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {req.urgency}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <p className="text-[10px] font-black uppercase tracking-widest">No active Logistics found</p>
             </div>
          )}
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-black mb-4">Request Authority</h3>
          <p className="text-slate-400 text-xs font-medium mb-8 leading-relaxed">
            Authorized medical staff can initiate immediate national procurement protocols.
          </p>
          <div className="space-y-3">
             <button onClick={onRequestEmergency} className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-red-900/40 transition-all uppercase">
                Trigger Emergency Order
             </button>
             <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs tracking-widest transition-all uppercase border border-slate-700">
                Routine Replenishment
             </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- NGO PLATFORM ---
export const NgoDashboard: React.FC = () => (
  <div className="space-y-6">
    <PlatformHeader 
      title="Partner Services" 
      subtitle="Outreach management and community engagement."
      icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
    />
    <EmptyState message="Outreach campaigns will appear here after initialization." />
  </div>
);
