
import React, { useState, useCallback, useEffect } from 'react';
import { UserRole, BloodStock, RequestItem, BloodUnit, AuthUser, UnitHistoryEntry } from './types';
import Layout from './components/Layout';
import { DonorDashboard, HospitalDashboard, BloodBankDashboard, AdminDashboard, NgoDashboard } from './components/Dashboards';
import { Auth } from './components/Auth';
import { ApiService } from './services/storeService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);

  // Data States
  const [stock, setStock] = useState<BloodStock[]>([]);
  const [units, setUnits] = useState<BloodUnit[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const syncNodeData = useCallback(async () => {
    try {
      const [s, r, u, l] = await Promise.all([
        ApiService.getStock(),
        ApiService.getRequests(),
        ApiService.getUnits(),
        ApiService.getAuditLogs()
      ]);
      setStock(s);
      setRequests(r);
      setUnits(u);
      setAuditLogs(l);
    } catch (e) {
      console.error("Node Sync Failure:", e);
    }
  }, []);

  useEffect(() => {
    const session = ApiService.getCurrentSession();
    if (session) {
      setCurrentUser(session);
    }
    syncNodeData().then(() => setIsLoading(false));
  }, [syncNodeData]);

  const handleAuthSuccess = useCallback(async (user: AuthUser) => {
    setIsLoading(true);
    setCurrentUser(user);
    await ApiService.addAuditLog(user.role, `System Auth Successful: ${user.name}`, 'LOW');
    await syncNodeData();
    setIsLoading(false);
  }, [syncNodeData]);

  const handleLogout = useCallback(async () => {
    if (currentUser) {
      await ApiService.addAuditLog(currentUser.role, 'Session Terminated', 'LOW');
    }
    ApiService.logout();
    setCurrentUser(null);
  }, [currentUser]);

  const handleAddUnit = useCallback(async (newUnit: BloodUnit) => {
    if (!currentUser) return;
    
    // Initialize history
    const intakeEntry: UnitHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: 'INITIAL_INTAKE',
      performedBy: currentUser.name,
      statusChange: { from: 'NULL', to: 'VALID' }
    };
    newUnit.history = [intakeEntry];

    const updatedUnits = [newUnit, ...units];
    setUnits(updatedUnits);
    await ApiService.saveUnits(updatedUnits);
    
    const existing = stock.find(s => s.type === newUnit.type);
    let updatedStock;
    if (existing) {
      updatedStock = stock.map(s => s.type === newUnit.type ? { ...s, units: s.units + 1 } : s);
    } else {
      updatedStock = [...stock, { type: newUnit.type, units: 1, criticalLevel: 10, expiryAlerts: 0 }];
    }
    setStock(updatedStock);
    await ApiService.saveStock(updatedStock);

    await ApiService.addAuditLog(currentUser.role, `Inventory Intake: ${newUnit.serialNumber}`, 'MODERATE');
    const logs = await ApiService.getAuditLogs();
    setAuditLogs(logs);
  }, [units, stock, currentUser]);

  const handleUpdateUnitStatus = useCallback(async (unitId: string, newStatus: BloodUnit['status']) => {
    if (!currentUser) return;
    
    const oldUnit = units.find(u => u.id === unitId);
    if (!oldUnit) return;
    if (oldUnit.status === newStatus) return;

    const historyEntry: UnitHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: 'STATUS_TRANSITION',
      performedBy: currentUser.name,
      statusChange: { from: oldUnit.status, to: newStatus }
    };

    const updatedUnits = units.map(u => u.id === unitId ? { 
      ...u, 
      status: newStatus,
      history: [historyEntry, ...(u.history || [])]
    } : u);
    
    setUnits(updatedUnits);
    await ApiService.saveUnits(updatedUnits);

    // Update aggregate stock if status moved from/to VALID
    const wasValid = oldUnit.status === 'VALID';
    const isValidNow = newStatus === 'VALID';

    if (wasValid !== isValidNow) {
      const change = isValidNow ? 1 : -1;
      const updatedStock = stock.map(s => 
        s.type === oldUnit.type ? { ...s, units: Math.max(0, s.units + change) } : s
      );
      setStock(updatedStock);
      await ApiService.saveStock(updatedStock);
    }

    await ApiService.addAuditLog(currentUser.role, `Unit ${oldUnit.serialNumber} status update: ${newStatus}`, 'MODERATE');
    const logs = await ApiService.getAuditLogs();
    setAuditLogs(logs);
  }, [units, stock, currentUser]);

  const handleEmergencyOrder = useCallback(async () => {
    if (!currentUser) return;
    const newRequest: RequestItem = {
      id: `REQ-${Math.floor(Math.random() * 9000 + 1000)}`,
      requester: currentUser.name,
      type: 'O-', 
      units: 1,
      status: 'PENDING',
      urgency: 'EMERGENCY',
      timestamp: new Date().toISOString()
    };
    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    await ApiService.saveRequests(updatedRequests);
    await ApiService.addAuditLog(currentUser.role, `EMERGENCY SIGNAL: ${newRequest.id}`, 'CRITICAL');
    const logs = await ApiService.getAuditLogs();
    setAuditLogs(logs);
  }, [requests, currentUser]);

  const toggleEmergency = useCallback(async () => {
    setIsEmergency(prev => {
      const newState = !prev;
      ApiService.addAuditLog('SYS-ADMIN', `Network State Shift: ${newState ? 'CRITICAL' : 'STABLE'}`, newState ? 'CRITICAL' : 'LOW')
        .then(async () => {
           const logs = await ApiService.getAuditLogs();
           setAuditLogs(logs);
        });
      return newState;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Connecting to National Node...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const renderDashboard = () => {
    switch (currentUser.role) {
      case UserRole.DONOR:
        return <DonorDashboard name={currentUser.name} />;
      case UserRole.HOSPITAL:
        return <HospitalDashboard stock={stock} requests={requests} onRequestEmergency={handleEmergencyOrder} />;
      case UserRole.BLOOD_BANK:
        return (
          <BloodBankDashboard 
            units={units} 
            onAddUnit={handleAddUnit} 
            onUpdateUnitStatus={handleUpdateUnitStatus}
          />
        );
      case UserRole.ADMIN:
        return <AdminDashboard logs={auditLogs} />;
      case UserRole.NGO:
        return <NgoDashboard />;
      default:
        return <DonorDashboard name={currentUser.name} />;
    }
  };

  return (
    <Layout 
      activeRole={currentUser.role} 
      userName={currentUser.name}
      onRoleChange={() => {}} 
      onLogout={handleLogout}
      isEmergency={isEmergency}
      toggleEmergency={toggleEmergency}
    >
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        {renderDashboard()}
      </div>

      <footer className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center text-slate-400 pb-8">
        <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500"></div> Connection Secure</span>
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-blue-500"></div> Local persistence hub active</span>
        </div>
        <p className="text-[8px] font-bold uppercase tracking-widest">LifeStream National Terminal v1.1.0</p>
      </footer>
    </Layout>
  );
};

export default App;
