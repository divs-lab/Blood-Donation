
import { BloodStock, RequestItem, BloodUnit, AuthUser, UserRole } from '../types';

const STORAGE_KEYS = {
  STOCK: 'ls_stock',
  UNITS: 'ls_units',
  REQUESTS: 'ls_requests',
  AUDIT: 'ls_audit_logs',
  USERS: 'ls_users',
  SESSION: 'ls_current_session'
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const ApiService = {
  // CONFIG: Endpoint for the future MongoDB middleware
  BASE_URL: 'http://localhost:5000/api', 

  // --- AUTH METHODS ---
  registerUser: async (user: AuthUser): Promise<boolean> => {
    await delay(800);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (users.find((u: AuthUser) => u.email === user.email)) {
      throw new Error("Email already registered in national database.");
    }
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  },

  loginUser: async (email: string, password: string): Promise<AuthUser> => {
    await delay(1000);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: AuthUser) => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid credentials or unauthorized node access.");
    }
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    return user;
  },

  getCurrentSession: (): AuthUser | null => {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // --- DATA METHODS ---
  getStock: async (): Promise<BloodStock[]> => {
    await delay(600);
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK);
    return saved ? JSON.parse(saved) : [];
  },

  getRequests: async (): Promise<RequestItem[]> => {
    await delay(400);
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return saved ? JSON.parse(saved) : [];
  },

  getUnits: async (): Promise<BloodUnit[]> => {
    await delay(500);
    const saved = localStorage.getItem(STORAGE_KEYS.UNITS);
    return saved ? JSON.parse(saved) : [];
  },

  saveStock: async (stock: BloodStock[]) => {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
  },

  saveRequests: async (requests: RequestItem[]) => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  },

  saveUnits: async (units: BloodUnit[]) => {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
  },

  addAuditLog: async (node: string, action: string, severity: 'LOW' | 'MODERATE' | 'CRITICAL') => {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]');
    const newLog = {
      node,
      action,
      severity,
      ts: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    };
    const updated = [newLog, ...logs].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(updated));
    return updated;
  },

  getAuditLogs: async () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]');
  }
};
