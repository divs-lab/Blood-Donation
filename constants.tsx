
import { BloodStock, RequestItem, BloodType } from './types';

export const COLORS = {
  primary: '#004A99', // Healthcare Blue
  secondary: '#2D8A5B', // Trust Green
  emergency: '#D32F2F', // Urgent Red
  bg: '#F8FAFC'
};

// Pure empty state for fresh production-ready local system
export const MOCK_STOCK: BloodStock[] = [];
export const MOCK_REQUESTS: RequestItem[] = [];

export const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
