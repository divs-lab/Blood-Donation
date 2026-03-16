
export enum UserRole {
  DONOR = 'DONOR',
  HOSPITAL = 'HOSPITAL',
  BLOOD_BANK = 'BLOOD_BANK',
  NGO = 'NGO',
  ADMIN = 'ADMIN'
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type ComponentType = 'WHOLE_BLOOD' | 'PLASMA' | 'PLATELETS' | 'RED_CELLS';

export interface BloodStock {
  type: BloodType;
  units: number;
  criticalLevel: number;
  expiryAlerts: number;
}

export interface UnitHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  statusChange?: {
    from: string;
    to: string;
  };
  performedBy: string;
}

export interface BloodUnit {
  id: string;
  serialNumber: string;
  type: BloodType;
  componentType: ComponentType;
  volume: number;
  expiryDate: string;
  receivedDate: string;
  collectionDate: string;
  status: 'VALID' | 'EXPIRED' | 'USED' | 'RESERVED';
  history: UnitHistoryEntry[];
}

export interface RequestItem {
  id: string;
  requester: string;
  type: BloodType;
  units: number;
  status: 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED';
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  timestamp: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  bloodType?: BloodType;
  facilityName?: string;
  licenseId?: string;
}
