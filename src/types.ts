export interface SR {
  id: string;
  name: string;
  phone: string;
  email: string;
  territory: string;
  active: boolean;
  salesTarget: number;
  salesAchieved: number;
  latitude: number;
  longitude: number;
  lastUpdated: string; // ISO string or time string
  avatar?: string;
}

export interface Dealer {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  territory: string;
  active: boolean;
  creditLimit: number;
  currentDue: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  dealerId: string;
  dealerName: string;
  srId: string;
  srName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  status: 'Paid' | 'Due' | 'Overdue';
}

export interface Collection {
  id: string;
  date: string; // YYYY-MM-DD or ISO
  dealerId: string;
  dealerName: string;
  srId: string;
  srName: string;
  amount: number;
  method: 'Cash' | 'Bank' | 'Bkash' | 'Nagad';
}

export interface Product {
  id: string;
  name: string;
  stock: number;
  unit: string;
  alertLevel: 'Low' | 'Medium' | 'Normal';
  price: number;
}

export interface SRVisit {
  id: string;
  srId: string;
  srName: string;
  dealerId: string;
  dealerName: string;
  checkInTime: string; // e.g., "10:30 AM" or ISO
  status: 'Completed' | 'Ongoing' | 'Planned' | 'Missed';
}

export interface DashboardStats {
  todaySales: number;
  todaySalesGrowth: number; // e.g. 12.5%
  todayCollection: number;
  todayCollectionGrowth: number; // e.g. 8.3%
  activeSRCount: number;
  totalSRCount: number;
  totalDealers: number;
  totalDealersActive: number;
  pendingDue: number;
  pendingDueDealersCount: number;
}
