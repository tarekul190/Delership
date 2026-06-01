import { SR, Dealer, Invoice, Collection, Product, SRVisit, DashboardStats } from './types';

const API_BASE = ''; // Same host, so relative paths work automatically

export interface DashboardResponse {
  stats: DashboardStats;
  salesHistory: { date: string; sales: number }[];
  salesBySR: { name: string; sales: number }[];
  visits: SRVisit[];
  lowStockProducts: Product[];
}

export async function fetchDashboardSummary(): Promise<DashboardResponse> {
  const response = await fetch(`${API_BASE}/api/dashboard/summary`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard summary');
  }
  return response.json();
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch(`${API_BASE}/api/invoices`);
  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }
  return response.json();
}

export async function createInvoice(invoiceData: {
  dealerId: string;
  srId: string;
  amount: number;
}): Promise<Invoice> {
  const response = await fetch(`${API_BASE}/api/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData),
  });
  if (!response.ok) {
    throw new Error('Failed to create invoice');
  }
  return response.json();
}

export async function payInvoice(id: string): Promise<{ invoice: Invoice; collection: Collection }> {
  const response = await fetch(`${API_BASE}/api/invoices/${id}/pay`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to process invoice payment');
  }
  return response.json();
}

export async function fetchCollections(): Promise<Collection[]> {
  const response = await fetch(`${API_BASE}/api/collections`);
  if (!response.ok) {
    throw new Error('Failed to fetch collections');
  }
  return response.json();
}

export async function createCollection(collectionData: {
  dealerId: string;
  srId: string;
  amount: number;
  method: string;
}): Promise<Collection> {
  const response = await fetch(`${API_BASE}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(collectionData),
  });
  if (!response.ok) {
    throw new Error('Failed to record collection');
  }
  return response.json();
}

export async function fetchSRs(): Promise<SR[]> {
  const response = await fetch(`${API_BASE}/api/srs`);
  if (!response.ok) {
    throw new Error('Failed to fetch SRs');
  }
  return response.json();
}

export async function createSR(srData: {
  name: string;
  phone: string;
  email: string;
  territory: string;
  salesTarget: number;
}): Promise<SR> {
  const response = await fetch(`${API_BASE}/api/srs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(srData),
  });
  if (!response.ok) {
    throw new Error('Failed to onboard SR');
  }
  return response.json();
}

export async function toggleSRStatus(id: string): Promise<SR> {
  const response = await fetch(`${API_BASE}/api/srs/${id}/toggle-status`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to toggle SR status');
  }
  return response.json();
}

export async function updateSRLocation(id: string, latitude: number, longitude: number): Promise<SR> {
  const response = await fetch(`${API_BASE}/api/srs/${id}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });
  if (!response.ok) {
    throw new Error('Failed to update SR location');
  }
  return response.json();
}

export async function fetchDealers(): Promise<Dealer[]> {
  const response = await fetch(`${API_BASE}/api/dealers`);
  if (!response.ok) {
    throw new Error('Failed to fetch dealers');
  }
  return response.json();
}

export async function createDealer(dealerData: {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  territory: string;
  creditLimit: number;
}): Promise<Dealer> {
  const response = await fetch(`${API_BASE}/api/dealers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dealerData),
  });
  if (!response.ok) {
    throw new Error('Failed to create dealer');
  }
  return response.json();
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/api/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}

export async function adjustProductStock(id: string, stockAdjustment: number): Promise<Product> {
  const response = await fetch(`${API_BASE}/api/products/${id}/adjust-stock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stockAdjustment }),
  });
  if (!response.ok) {
    throw new Error('Failed to adjust stock');
  }
  return response.json();
}

export async function fetchVisits(): Promise<SRVisit[]> {
  const response = await fetch(`${API_BASE}/api/visits`);
  if (!response.ok) {
    throw new Error('Failed to fetch visits');
  }
  return response.json();
}

export async function checkInVisit(visitData: {
  srId: string;
  dealerId: string;
  status: 'Completed' | 'Ongoing' | 'Planned' | 'Missed';
}): Promise<SRVisit> {
  const response = await fetch(`${API_BASE}/api/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visitData),
  });
  if (!response.ok) {
    throw new Error('Failed to record check-in');
  }
  return response.json();
}

export async function updateVisitStatus(id: string, status: string): Promise<SRVisit> {
  const response = await fetch(`${API_BASE}/api/visits/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update visit status');
  }
  return response.json();
}
