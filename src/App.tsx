import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Bell, Plus, Users, Store, ShoppingBag, Banknote, Wallet, 
  MapPin, ShieldAlert, CheckCircle, Clock, ArrowRight, X, Check,
  RefreshCw, Grid, Filter, HelpCircle, FileText, ChevronRight, Power, Settings,
  Mail, Lock, Eye, EyeOff
} from 'lucide-react';

import { 
  fetchDashboardSummary, fetchInvoices, createInvoice, payInvoice,
  fetchCollections, createCollection, fetchSRs, createSR, toggleSRStatus,
  updateSRLocation, fetchDealers, createDealer, fetchProducts, adjustProductStock,
  fetchVisits, checkInVisit, updateVisitStatus, DashboardResponse
} from './api';

import { SR, Dealer, Invoice, Collection, Product, SRVisit, DashboardStats } from './types';

import StatCard from './components/StatCard';
import SalesLineChart from './components/SalesLineChart';
import SalesSRDonutChart from './components/SalesSRDonutChart';
import TargetGaugeChart from './components/TargetGaugeChart';
import LiveLocationMap from './components/LiveLocationMap';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'srs' | 'dealers' | 'invoices' | 'collections' | 'inventory' | 'visits'>('dashboard');

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_auth_dealership') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('admin@dealership.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('is_auth_dealership');
    setIsAuthenticated(false);
    showToast('👋 Logged out successfully');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      if (!loginEmail.includes('@')) {
        setLoginError('Please enter a valid email address.');
        setIsLoggingIn(false);
        return;
      }
      if (loginPassword.length < 6) {
        setLoginError('Password must be at least 6 characters.');
        setIsLoggingIn(false);
        return;
      }

      if (loginEmail === 'admin@dealership.com' && loginPassword !== 'admin123') {
        setLoginError('Incorrect password for the admin account.');
        setIsLoggingIn(false);
        return;
      }

      localStorage.setItem('is_auth_dealership', 'true');
      setIsAuthenticated(true);
      setIsLoggingIn(false);
      showToast('⚡ Access granted! Welcome.');
    }, 1000);
  };

  // Server Data states
  const [summary, setSummary] = useState<DashboardResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [srs, setSrs] = useState<SR[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [visits, setVisits] = useState<SRVisit[]>([]);

  // Page interaction states
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatingMove, setIsSimulatingMove] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Modals visibility toggles
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isSRModalOpen, setIsSRModalOpen] = useState(false);
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  // Modal Form States
  const [newInvoiceData, setNewInvoiceData] = useState({ dealerId: '', srId: '', amount: '' });
  const [newCollectionData, setNewCollectionData] = useState({ dealerId: '', srId: '', amount: '', method: 'Cash' });
  const [newSRData, setNewSRData] = useState({ name: '', phone: '', email: '', territory: '', salesTarget: '400000' });
  const [newDealerData, setNewDealerData] = useState({ name: '', ownerName: '', phone: '', address: '', territory: '', creditLimit: '300000' });
  const [newVisitData, setNewVisitData] = useState({ srId: '', dealerId: '', status: 'Ongoing' as const });

  // Quick info notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch all database snapshots on mount or changes
  const reloadData = async () => {
    try {
      const summaryData = await fetchDashboardSummary();
      setSummary(summaryData);

      const [invList, colList, srList, dealerList, prodList, visitList] = await Promise.all([
        fetchInvoices(),
        fetchCollections(),
        fetchSRs(),
        fetchDealers(),
        fetchProducts(),
        fetchVisits()
      ]);

      setInvoices(invList);
      setCollections(colList);
      setSrs(srList);
      setDealers(dealerList);
      setProducts(prodList);
      setVisits(visitList);

      // Dynamically compute notification alerts
      const alerts: string[] = [];
      prodList.forEach(p => {
        if (p.stock <= 12) alerts.push(`Low stock alert: ${p.name} needs restocking (${p.stock} remaining)`);
      });
      invList.slice(0, 4).forEach(i => {
        if (i.status === 'Due' && i.amount > 20000) alerts.push(`Pending payment: ${i.dealerName} owes ৳${i.amount.toLocaleString()}`);
      });
      setNotifications(alerts);

    } catch (err) {
      console.error('Error reloading app databases', err);
      showToast('⚠️ Sync error occurred with backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      reloadData();
    }
  }, [activeTab, isAuthenticated]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Submit handers
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceData.dealerId || !newInvoiceData.srId || !newInvoiceData.amount) return;
    try {
      await createInvoice({
        dealerId: newInvoiceData.dealerId,
        srId: newInvoiceData.srId,
        amount: Number(newInvoiceData.amount)
      });
      showToast('✅ Invoice generated successfully on backend!');
      setIsInvoiceModalOpen(false);
      setNewInvoiceData({ dealerId: '', srId: '', amount: '' });
      reloadData();
    } catch {
      showToast('❌ Failed to record invoice');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionData.dealerId || !newCollectionData.srId || !newCollectionData.amount) return;
    try {
      await createCollection({
        dealerId: newCollectionData.dealerId,
        srId: newCollectionData.srId,
        amount: Number(newCollectionData.amount),
        method: newCollectionData.method
      });
      showToast('✅ Collection payment processed and verified!');
      setIsCollectionModalOpen(false);
      setNewCollectionData({ dealerId: '', srId: '', amount: '', method: 'Cash' });
      reloadData();
    } catch {
      showToast('❌ Failed to record collection');
    }
  };

  const handleCreateSR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSRData.name || !newSRData.phone || !newSRData.territory) return;
    try {
      await createSR({
        name: newSRData.name,
        phone: newSRData.phone,
        email: newSRData.email || `${newSRData.name.toLowerCase().replace(' ', '')}@dealership.com`,
        territory: newSRData.territory,
        salesTarget: Number(newSRData.salesTarget)
      });
      showToast('✅ New Sales Representative onboarded!');
      setIsSRModalOpen(false);
      setNewSRData({ name: '', phone: '', email: '', territory: '', salesTarget: '400000' });
      reloadData();
    } catch {
      showToast('❌ Failed to create SR');
    }
  };

  const handleCreateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealerData.name || !newDealerData.phone || !newDealerData.territory) return;
    try {
      await createDealer({
        name: newDealerData.name,
        ownerName: newDealerData.ownerName || 'Unknown Owner',
        phone: newDealerData.phone,
        address: newDealerData.address || `${newDealerData.territory}, Dhaka`,
        territory: newDealerData.territory,
        creditLimit: Number(newDealerData.creditLimit)
      });
      showToast('✅ Dealer outlet registered!');
      setIsDealerModalOpen(false);
      setNewDealerData({ name: '', ownerName: '', phone: '', address: '', territory: '', creditLimit: '300000' });
      reloadData();
    } catch {
      showToast('❌ Failed to register dealer');
    }
  };

  const handleCheckInVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitData.srId || !newVisitData.dealerId) return;
    try {
      await checkInVisit(newVisitData);
      showToast('✅ SR Check-in logged successfully!');
      setIsVisitModalOpen(false);
      setNewVisitData({ srId: '', dealerId: '', status: 'Ongoing' });
      reloadData();
    } catch {
      showToast('❌ Failed to record visit check-in');
    }
  };

  const handleToggleSRActive = async (id: string) => {
    try {
      const updated = await toggleSRStatus(id);
      showToast(`Status toggled for ${updated.name}!`);
      reloadData();
    } catch {
      showToast('❌ Status modification failed');
    }
  };

  const handleQuickRestock = async (id: string, adjustment: number) => {
    try {
      const updated = await adjustProductStock(id, adjustment);
      showToast(`📦 Restocked! ${updated.name} stock stands at ${updated.stock} ${updated.unit}.`);
      reloadData();
    } catch {
      showToast('❌ Stock restock failed');
    }
  };

  const handlePayDueInvoice = async (invoiceId: string) => {
    try {
      await payInvoice(invoiceId);
      showToast(`✅ Invoice status updated to Paid! Payment collection recorded.`);
      reloadData();
    } catch {
      showToast('❌ Payment process failed');
    }
  };

  // Live Location Random simulation walk in Dhaka
  const triggerMapSimulation = async () => {
    setIsSimulatingMove(true);
    showToast('🚕 Simulating live Sales Representatives riding through Dhaka sectors...');
    
    try {
      for (const sr of srs) {
        // Dhanmondi, Mirpur, Uttara, Gulshan areas jitter walking
        const latOffset = (Math.random() - 0.5) * 0.006;
        const lngOffset = (Math.random() - 0.5) * 0.006;
        await updateSRLocation(sr.id, sr.latitude + latOffset, sr.longitude + lngOffset);
      }
      setTimeout(() => {
        setIsSimulatingMove(false);
        reloadData();
        showToast('🎯 GPS location routes updated from Dhaka SR terminal simulation.');
      }, 1500);
    } catch {
      setIsSimulatingMove(false);
    }
  };

  // Searching elements filter
  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.dealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.srName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDealers = dealers.filter(dlr => 
    dlr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dlr.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dlr.territory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSRs = srs.filter(sr => 
    sr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sr.territory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#030712] font-sans relative overflow-hidden select-none">
        {/* Background Mesh Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-cyan-600/15 rounded-full blur-[150px] pointer-events-none z-0"></div>

        <div className="w-full max-w-md p-8 bg-[#0b0f19]/80 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden font-display flex flex-col gap-6">
          {/* Top Brand Mark */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/20 mb-2">
              D
            </span>
            <h1 className="text-xl font-black text-white tracking-wide uppercase leading-tight">Dealership Platform</h1>
            <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest max-w-[280px]">
              Secure Sales Representative Network Manager
            </p>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input 
                  type="email" 
                  required
                  placeholder="name@dealership.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs font-semibold bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-white/20 hover:bg-white/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs font-bold tracking-wider font-mono bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-white/20 hover:bg-white/10 transition-all outline-none animate-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-indigo-800 disabled:opacity-50 text-white text-xs font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 active:scale-[0.98] transition-all outline-none cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating terminal...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Verify</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Assist */}
          <div className="mt-2 p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex flex-col gap-1 text-[11px]">
            <span className="font-bold text-indigo-400 uppercase tracking-widest text-[9px]">Demo System Credentials</span>
            <div className="flex justify-between items-center text-white/70">
              <span>Username: <strong className="text-white select-all font-semibold font-mono">admin@dealership.com</strong></span>
            </div>
            <div className="flex justify-between items-center text-white/70">
              <span>Password: <strong className="text-white select-all font-semibold font-mono font-bold">admin123</strong></span>
            </div>
          </div>
        </div>

        {/* Global Toast Message inside Login page itself */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 bg-slate-900/95 border border-white/10 text-white text-xs px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 z-50 font-bold"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex text-white bg-[#030712] font-sans relative overflow-hidden">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-64 bg-white/5 backdrop-blur-2xl border-r border-white/10 text-white/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 font-display z-20">
        <div>
          {/* Logo Branding */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
              D
            </span>
            <div>
              <h1 className="text-sm font-black text-white tracking-wide uppercase leading-tight">Dealership</h1>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">SR Management System</p>
            </div>
          </div>

          {/* Tab Categories Selection list */}
          <nav className="p-4 space-y-1.55">
            <span className="text-[10px] font-black tracking-widest text-white/40 uppercase px-3 block mb-2">Main Modules</span>
            
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left font-semibold text-xs py-3 px-3.5 rounded-xl flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'hover:bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => setActiveTab('srs')}
              className={`w-full text-left font-semibold text-xs py-3 px-3.5 rounded-xl flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                activeTab === 'srs' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'hover:bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>SR Management</span>
            </button>

            <button 
              onClick={() => setActiveTab('dealers')}
              className={`w-full text-left font-semibold text-xs py-3 px-3.5 rounded-xl flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                activeTab === 'dealers' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'hover:bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Dealer Management</span>
            </button>

            <button 
              onClick={() => setActiveTab('invoices')}
              className={`w-full text-left font-semibold text-xs py-3 px-3.5 rounded-xl flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                activeTab === 'invoices' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'hover:bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Sales & Invoices</span>
            </button>

            <button 
              onClick={() => setActiveTab('collections')}
              className={`w-full text-left font-semibold text-xs py-3 px-3.5 rounded-xl flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                activeTab === 'collections' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'hover:bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Collection Register</span>
            </button>

            <button 
              onClick={() => setActiveTab('inventory')}
              className={`w-full text-left font-semibold text-xs py-3 px-3.5 rounded-xl flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                activeTab === 'inventory' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'hover:bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Inventory Products</span>
            </button>

            <button 
              onClick={() => setActiveTab('visits')}
              className={`w-full text-left font-semibold text-xs py-3 px-3.5 rounded-xl flex items-center gap-2.5 transition-all outline-none cursor-pointer ${
                activeTab === 'visits' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'hover:bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>SR Visits Register</span>
            </button>
          </nav>
        </div>

        {/* Bottom User Coordinates display with Interactive Logout */}
        <div className="p-4 border-t border-white/10 bg-[#070b14] space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 font-bold text-white text-sm flex items-center justify-center border border-white/10 uppercase">
              {loginEmail ? loginEmail.substring(0, 2).toUpperCase() : 'AU'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {loginEmail === 'admin@dealership.com' ? 'Admin User' : loginEmail.split('@')[0]}
              </p>
              <p className="text-[10px] text-white/40 font-semibold font-mono truncate">{loginEmail}</p>
            </div>
            <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[11px] font-bold py-2.5 px-3 rounded-xl border border-rose-500/15 hover:border-rose-500/25 transition-all outline-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Settle System Logout</span>
          </button>
        </div>
      </aside>

      {/* CORE FRAME WINDOW */}
      <main className="flex-1 min-w-0 flex flex-col z-10">
        {/* HEADER TOOL PANEL */}
        <header className="bg-white/5 backdrop-blur-md border-b border-white/10 h-16 shrink-0 flex items-center justify-between px-6 sticky top-0 z-10">
          {/* Dashboard Title & Segment Indicators */}
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-md font-bold text-white flex items-center gap-2 capitalize">
                <span>{activeTab === 'dashboard' ? 'Overview' : activeTab}</span>
                <span className="text-[10px] font-bold tracking-wide uppercase text-white/60 bg-white/10 border border-white/10 px-1.5 py-0.5 rounded-md">Server Sync</span>
              </h2>
              <div className="text-[10px] flex items-center gap-1.5 text-white/40 mt-0.5 font-semibold">
                <span>Dealership Workspace</span>
                <span>•</span>
                <span>Active Core Router</span>
              </div>
            </div>
          </div>

          {/* Search bar & Admin Actions */}
          <div className="flex items-center gap-4 flex-1 max-w-sm ml-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search Dealer profiles, products, invoices, SRs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-white/30 hover:bg-white/10 transition-all outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-white/40 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Record Buttons */}
            <div className="flex items-center gap-2 z-10">
              <button 
                onClick={() => setIsInvoiceModalOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-455 text-white text-[11px] font-bold px-3 py-1.8 rounded-lg flex items-center gap-1 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all outline-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </button>
              <button 
                onClick={() => setIsCollectionModalOpen(true)}
                className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-455 text-white text-[11px] font-bold px-3 py-1.8 rounded-lg flex items-center gap-1 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all outline-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Collection</span>
              </button>
            </div>

            {/* Notification Drawer controller */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white relative outline-none cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotificationMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2.5 w-80 bg-[#111827]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 z-50 text-xs text-white"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                      <span className="font-bold text-white/80 uppercase tracking-wider text-[10px]">Operations Alerts</span>
                      <span className="text-[10px] font-semibold text-white/50 bg-white/10 px-1 py-0.2 rounded-sm">{notifications.length} active</span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-white/40 text-center py-4">No active terminal warnings</p>
                      ) : (
                        notifications.map((msg, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-205 flex items-start gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-orange-405 shrink-0 mt-0.5" />
                            <span>{msg}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/60">May 20, 2024</span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            </div>
          </div>
        </header>

        {/* LOADING SHIM SKELETON */}
        {loading ? (
          <div className="flex-1 p-6 flex flex-col gap-6 justify-center items-center">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm font-bold text-slate-500">Synchronizing dealership metrics from the back end...</p>
          </div>
        ) : (
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* REAL-TIME OPERATIONS TOAST BANNER */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-900 border border-slate-700/80 text-white rounded-xl py-3 px-4 shadow-xl flex items-center justify-between z-50 text-xs text-center"
                >
                  <span>{toastMessage}</span>
                  <button onClick={() => setToastMessage(null)} className="ml-4 hover:text-red-400 text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TAB-1: EXECUTIVE DASHBOARD */}
            {activeTab === 'dashboard' && summary && (
              <div className="space-y-6">
                {/* 1. KEY METRICS KEYSTONE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard 
                    title="Today Sales" 
                    value={`৳ ${(summary.stats.todaySales).toLocaleString()}`} 
                    growth={12.5} 
                    growthLabel="from yesterday" 
                    type="sales" 
                  />
                  <StatCard 
                    title="Today Collection" 
                    value={`৳ ${(summary.stats.todayCollection).toLocaleString()}`} 
                    growth={8.3} 
                    growthLabel="from yesterday" 
                    type="collection" 
                  />
                  <StatCard 
                    title="Active SR" 
                    value={`${srs.filter(sr => sr.active).length} of ${srs.length + 20} total SR`} 
                    subtext="Live Terminal active" 
                    type="sr" 
                  />
                  <StatCard 
                    title="Total Dealers" 
                    value={`${dealers.length + 200}`} 
                    subtext="Active Dealers" 
                    type="dealer" 
                  />
                  <StatCard 
                    title="Pending Due" 
                    value={`৳ ${(summary.stats.pendingDue).toLocaleString()}`} 
                    subtext="From 102 Dealers" 
                    type="due" 
                  />
                </div>

                {/* 2. ANALYTICS ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-5 h-[340px]">
                    <SalesLineChart data={summary.salesHistory} />
                  </div>

                  <div className="lg:col-span-4 h-[340px]">
                    <SalesSRDonutChart data={summary.salesBySR} />
                  </div>

                  <div className="lg:col-span-3 h-[340px]">
                    <TargetGaugeChart achieved={srs.reduce((sum, item) => sum + item.salesAchieved, 0)} target={2000000} />
                  </div>
                </div>

                {/* 3. OPERATIONS BLOCK */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Recent Invoices list */}
                  <div className="lg:col-span-4 bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg shadow-black/10 flex flex-col max-h-[360px]" style={{ contentVisibility: 'auto' }}>
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">Recent Sales Invoices</h4>
                        <span className="text-[10px] text-white/40 block font-semibold">Active Dealer Bills</span>
                      </div>
                      <button onClick={() => setActiveTab('invoices')} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">View All</button>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                      {invoices.slice(0, 5).map((inv) => (
                        <div key={inv.id} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-mono font-bold block text-white/40">{inv.invoiceNo}</span>
                            <span className="font-bold text-white truncate block max-w-[130px]">{inv.dealerName}</span>
                            <span className="text-[10px] text-white/40 font-semibold mt-0.5 block">{inv.srName} • {inv.date}</span>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-bold text-white block">৳ {inv.amount.toLocaleString()}</span>
                            {inv.status === 'Paid' ? (
                              <span className="inline-block text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-sm px-1.5 py-0.2 mt-1">Paid</span>
                            ) : (
                              <button 
                                onClick={() => handlePayDueInvoice(inv.id)}
                                className="text-[9px] bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 font-bold rounded-sm px-1.5 py-0.2 mt-1 outline-none transition-all cursor-pointer"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Collections Feed */}
                  <div className="lg:col-span-4 bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg shadow-black/10 flex flex-col max-h-[360px]" style={{ contentVisibility: 'auto' }}>
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">Recent Collections</h4>
                        <span className="text-[10px] text-white/40 block font-semibold font-sans">Payment collections received</span>
                      </div>
                      <button onClick={() => setActiveTab('collections')} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">View All</button>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                      {collections.slice(0, 5).map((col) => (
                        <div key={col.id} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-semibold text-white/40 block">{col.date}</span>
                            <span className="font-bold text-white truncate block max-w-[130px]">{col.dealerName}</span>
                            <span className="text-[10px] text-white/40 font-medium block">by {col.srName}</span>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-bold text-white block">৳ {col.amount.toLocaleString()}</span>
                            <span className="inline-block text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-sm px-1.5 py-0.2 mt-1 uppercase tracking-wide">
                              {col.method}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SR Live Location Segment (Interactive Map) */}
                  <div className="lg:col-span-4 h-[360px]">
                    <LiveLocationMap 
                      srs={srs} 
                      onTriggerMovement={triggerMapSimulation} 
                      isSimulating={isSimulatingMove} 
                    />
                  </div>
                </div>

                {/* 4. DOWNSTREAM TABLES DETAIL BOXES */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" style={{ contentVisibility: 'auto' }}>
                  {/* Top Dealers List representation */}
                  <div className="lg:col-span-4 bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg shadow-black/10 flex flex-col max-h-[360px]">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">Top Dealers by Sales</h4>
                        <span className="text-[10px] text-white/40 block font-semibold font-sans">Dealer outlet rankings</span>
                      </div>
                      <button onClick={() => setActiveTab('dealers')} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">Manage</button>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {dealers.slice(0, 5).map((dealer, idx) => (
                        <div key={dealer.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-white/10 border border-white/10 font-bold text-white/80 flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-white font-display block">{dealer.name}</span>
                              <span className="text-[10px] text-white/40 font-medium mt-0.5 block">{dealer.territory}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-bold text-white block">৳ {(dealer.creditLimit - dealer.currentDue + 100000).toLocaleString()}</span>
                            <span className="text-[9px] text-white/40 font-semibold block">Total Volume</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Low Stock Alerts */}
                  <div className="lg:col-span-4 bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg shadow-black/10 flex flex-col max-h-[360px]">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">Low Stock Products</h4>
                        <span className="text-[10px] text-rose-400 font-bold block flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-455" /> Urgent Restock Alert list
                        </span>
                      </div>
                      <button onClick={() => setActiveTab('inventory')} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">View All</button>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {products.filter(p => p.stock < 25).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/15 text-xs">
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] text-white/40 font-semibold mt-0.5 block">Price: ৳{p.price} • SKU: {p.id.toUpperCase()}</span>
                          </div>
                          
                          <div className="text-right flex items-center gap-2">
                            <div className="mr-1">
                              <span className="font-black text-rose-400 block">{p.stock} {p.unit}</span>
                              <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold px-1 rounded-sm block text-center mt-0.5">LOW</span>
                            </div>
                            {/* In-place quick restock action */}
                            <button 
                              onClick={() => handleQuickRestock(p.id, 20)}
                              className="bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-bold text-white px-2 py-1 rounded-lg shadow-md outline-none transition-all cursor-pointer"
                            >
                              +20
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SR Visits Tables representation */}
                  <div className="lg:col-span-4 bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg shadow-black/10 flex flex-col max-h-[360px]">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">Recent SR Visits</h4>
                        <span className="text-[10px] text-white/40 block font-semibold font-sans">Active field visit monitor</span>
                      </div>
                      <button onClick={() => setActiveTab('visits')} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">View Logs</button>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                      {visits.slice(0, 5).map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
                          <div>
                            <span className="font-bold text-white block">{v.srName}</span>
                            <span className="text-[10px] text-white/40 block">{v.dealerName} • {v.checkInTime}</span>
                          </div>

                          <div className="text-right">
                            {v.status === 'Completed' && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-2 py-0.5 font-bold flex items-center gap-0.5">
                                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> Completed
                              </span>
                            )}
                            {v.status === 'Ongoing' && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg px-2 py-0.5 font-bold flex items-center gap-0.5 animate-pulse">
                                <Clock className="w-2.5 h-2.5 text-amber-400" /> Ongoing
                              </span>
                            )}
                            {v.status === 'Planned' && (
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg px-2 py-0.5 font-bold">
                                Planned
                              </span>
                            )}
                            {v.status === 'Missed' && (
                              <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg px-2 py-0.5 font-bold">
                                Missed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB-2: SALES REPRESENTATIVES MANAGEMENT */}
            {activeTab === 'srs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white font-display">Sales Representatives List</h3>
                    <p className="text-xs text-white/40 mt-1">Manage, onboard, disable and view targets for your SR network</p>
                  </div>
                  <button 
                    onClick={() => setIsSRModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:shadow-indigo-500/10 transition-all outline-none cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Onboard New SR</span>
                  </button>
                </div>

                <div className="bg-white/5 border text-xs border-white/10 rounded-2xl shadow-lg shadow-black/10 overflow-hidden" style={{ contentVisibility: 'auto' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-white/40 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                        <th className="py-3 px-5">SR Name</th>
                        <th className="py-3 px-5">Territory Domain</th>
                        <th className="py-3 px-5">Contact Details</th>
                        <th className="py-3 px-5 text-right">Achieved vs Target (৳)</th>
                        <th className="py-3 px-5">Performance Gauge</th>
                        <th className="py-3 px-5">Active Status</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {filteredSRs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-white/40 font-medium">No sales representatives match your query.</td>
                        </tr>
                      ) : (
                        filteredSRs.map((sr) => {
                          const ratio = Math.min(100, Math.round((sr.salesAchieved / sr.salesTarget) * 100)) || 0;
                          return (
                            <tr key={sr.id} className="hover:bg-white/5 transition-all font-medium">
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-full bg-white/10 text-white/95 border border-white/10 font-black font-display flex items-center justify-center uppercase">
                                    {sr.name.split('-')[1]?.charAt(0) || 'S'}
                                  </span>
                                  <div>
                                    <span className="font-bold text-white block">{sr.name}</span>
                                    <span className="text-[10px] text-white/40 tracking-wider">ID: {sr.id.toUpperCase()}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 text-white/70">{sr.territory}</td>
                              <td className="py-3.5 px-5 space-y-0.5">
                                <span className="block font-mono text-white/80">{sr.phone}</span>
                                <span className="text-[10px] text-white/40 block">{sr.email}</span>
                              </td>
                              <td className="py-3.5 px-5 text-right space-y-0.5">
                                <span className="font-bold text-white block">৳ {sr.salesAchieved.toLocaleString()}</span>
                                <span className="text-[10px] text-white/40 block">of ৳ {sr.salesTarget.toLocaleString()}</span>
                              </td>
                              <td className="py-3.5 px-5 min-w-[140px]">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                                    <div className="bg-[#6366f1] h-full" style={{ width: `${ratio}%` }} />
                                  </div>
                                  <span className="font-bold text-white/70">{ratio}%</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-5">
                                {sr.active ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <Check className="w-3 h-3" /> ACTIVE
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
                                    <X className="w-3 h-3" /> DEACTIVATED
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <button 
                                  onClick={() => handleToggleSRActive(sr.id)}
                                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ml-auto transition-all outline-none cursor-pointer ${
                                    sr.active 
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' 
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{sr.active ? 'Disable' : 'Enable'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB-3: DEALER OUTLETS MANAGEMENT */}
            {activeTab === 'dealers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white font-display">Registered Dealer Outlets</h3>
                    <p className="text-xs text-white/40 mt-1">Supervise outlet credit limits, current outstanding dues, and territories</p>
                  </div>
                  <button 
                    onClick={() => setIsDealerModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:shadow-indigo-500/10 transition-all outline-none cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register New Dealer</span>
                  </button>
                </div>

                <div className="bg-white/5 border text-xs border-white/10 rounded-2xl shadow-lg shadow-black/10 overflow-hidden" style={{ contentVisibility: 'auto' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-white/40 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                        <th className="py-3 px-5">Outlet Name</th>
                        <th className="py-3 px-5">Proprietor / Owner</th>
                        <th className="py-3 px-5">Territory & Address</th>
                        <th className="py-3 px-5 text-right">Outstanding Due (৳)</th>
                        <th className="py-3 px-5 text-right">Credit Limit (৳)</th>
                        <th className="py-3 px-5">Credit Safety Gauge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {filteredDealers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-white/40 font-medium">No outlets registered under search query.</td>
                        </tr>
                      ) : (
                        filteredDealers.map((dlr) => {
                          const ratio = Math.min(100, Math.round((dlr.currentDue / dlr.creditLimit) * 100)) || 0;
                          return (
                            <tr key={dlr.id} className="hover:bg-white/5 transition-all font-medium">
                              <td className="py-3.5 px-5 font-bold text-white">{dlr.name}</td>
                              <td className="py-3.5 px-5 space-y-0.5">
                                <span className="block font-semibold text-white/80">{dlr.ownerName}</span>
                                <span className="text-[10px] text-white/40 font-mono block">{dlr.phone}</span>
                              </td>
                              <td className="py-3.5 px-5 space-y-0.5">
                                <span className="block text-white/70">{dlr.territory}</span>
                                <span className="text-[10px] text-white/40 block truncate max-w-sm">{dlr.address}</span>
                              </td>
                              <td className="py-3.5 px-5 text-right font-black text-white font-mono">৳ {dlr.currentDue.toLocaleString()}</td>
                              <td className="py-3.5 px-5 text-right font-black text-white font-mono">৳ {dlr.creditLimit.toLocaleString()}</td>
                              <td className="py-3.5 px-5 min-w-[160px]">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                                    <div className={`h-full ${ratio > 70 ? 'bg-rose-500' : 'bg-[#6366f1]'}`} style={{ width: `${ratio}%` }} />
                                  </div>
                                  <span className={`font-bold ${ratio > 70 ? 'text-rose-400' : 'text-white/70'}`}>
                                    {ratio}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB-4: SALES & INVOICES REGISTER */}
            {activeTab === 'invoices' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white font-display">Sales Invoice Register</h3>
                    <p className="text-xs text-white/40 mt-1">Audit billing transactions, verify payment statuses, and trigger settlement collection records</p>
                  </div>
                  <button 
                    onClick={() => setIsInvoiceModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:shadow-indigo-500/10 transition-all outline-none cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate New Invoice</span>
                  </button>
                </div>

                <div className="bg-white/5 border text-xs border-white/10 rounded-2xl shadow-lg shadow-black/10 overflow-hidden" style={{ contentVisibility: 'auto' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-white/40 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                        <th className="py-3 px-5">Invoice Reference</th>
                        <th className="py-3 px-5">Billing Dealer</th>
                        <th className="py-3 px-5">Serviced by SR</th>
                        <th className="py-3 px-5 text-right">Invoice Amount (৳)</th>
                        <th className="py-3 px-5">Billing Date</th>
                        <th className="py-3 px-5">Payment Status</th>
                        <th className="py-3 px-5 text-right">Settlement Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-white/40 font-medium">No sales invoices match search criteria.</td>
                        </tr>
                      ) : (
                        filteredInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-white/5 transition-all font-medium">
                            <td className="py-3.5 px-5 font-mono font-bold text-indigo-400">{inv.invoiceNo}</td>
                            <td className="py-3.5 px-5 font-bold text-white">{inv.dealerName}</td>
                            <td className="py-3.5 px-5 text-white/70">{inv.srName}</td>
                            <td className="py-3.5 px-5 text-right font-black text-white">৳ {inv.amount.toLocaleString()}</td>
                            <td className="py-3.5 px-5 text-white/50">{inv.date}</td>
                            <td className="py-3.5 px-5">
                              {inv.status === 'Paid' ? (
                                <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full">
                                  <Check className="w-2.5 h-2.5" /> PAID
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 bg-rose-505/10 text-rose-400 border border-rose-500/20 font-bold px-2 py-0.5 rounded-full animate-pulse">
                                  DUE
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              {inv.status !== 'Paid' ? (
                                <button 
                                  onClick={() => handlePayDueInvoice(inv.id)}
                                  className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/35 text-emerald-300 font-bold px-3 py-1.5 rounded-lg ml-auto outline-none transition-all cursor-pointer"
                                >
                                  Process Cash Pay
                                </button>
                              ) : (
                                <span className="text-[10px] text-white/40 font-bold pr-2 flex items-center justify-end gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Settled
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB-5: COLLECTION REGISTER */}
            {activeTab === 'collections' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white font-display">Collections Feed Audit</h3>
                    <p className="text-xs text-white/40 mt-1">Audit daily cash and digital collections uploaded by Sales Representatives</p>
                  </div>
                  <button 
                    onClick={() => setIsCollectionModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:shadow-indigo-500/10 transition-all outline-none cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Record New Collection</span>
                  </button>
                </div>

                <div className="bg-white/5 border text-xs border-white/10 rounded-2xl shadow-lg shadow-black/10 overflow-hidden" style={{ contentVisibility: 'auto' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-white/40 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                        <th className="py-3 px-5">Receipt ID</th>
                        <th className="py-3 px-5">Paid by Dealer</th>
                        <th className="py-3 px-5">Collected by SR</th>
                        <th className="py-3 px-5 text-right">Payment Amount (৳)</th>
                        <th className="py-3 px-5">Audit Date</th>
                        <th className="py-3 px-5">Method Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80 font-medium">
                      {collections.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-white/40 font-medium">No collections registered on server yet.</td>
                        </tr>
                      ) : (
                        collections.map((col) => (
                          <tr key={col.id} className="hover:bg-white/5 transition-all">
                            <td className="py-3.5 px-5 font-mono font-bold text-white/40 uppercase">{col.id.replace('col-', 'REC-')}</td>
                            <td className="py-3.5 px-5 font-bold text-white">{col.dealerName}</td>
                            <td className="py-3.5 px-5 text-white/70">{col.srName}</td>
                            <td className="py-3.5 px-5 text-right font-black text-white font-mono">৳ {col.amount.toLocaleString()}</td>
                            <td className="py-3.5 px-5 text-white/50">{col.date}</td>
                            <td className="py-3.5 px-5">
                              <span className={`inline-block font-bold px-2 py-0.5 rounded-md ${
                                col.method === 'Cash' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                col.method === 'Bank' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' :
                                col.method === 'Bkash' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              }`}>
                                {col.method.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB-6: INVENTORY STOCK MANAGEMENT */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 font-sans">
                <div>
                  <h3 className="text-lg font-black text-white font-display">Dealership Product Inventory</h3>
                  <p className="text-xs text-white/40 mt-1">Audit current stock metrics. Perform instant restocking configurations in one click.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ contentVisibility: 'auto' }}>
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= 15;
                    return (
                      <div key={p.id} className={`p-4 bg-white/5 backdrop-blur-md rounded-xl border shadow-lg shadow-black/10 flex flex-col justify-between ${
                        isLow ? 'border-rose-500/20 bg-rose-500/5' : 'border-white/10'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-white/40 block uppercase">{p.id.toUpperCase()}</span>
                            {isLow ? (
                              <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold px-1.5 py-0.2 rounded-sm uppercase">LOW STOCK</span>
                            ) : (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-1.5 py-0.2 rounded-sm uppercase">STABLE</span>
                            )}
                          </div>
                          
                          <h4 className="font-bold text-sm text-white font-display">{p.name}</h4>
                          <h5 className="text-[11px] text-white/40 font-medium mt-1">Price Unit: <span className="font-bold text-white/80">৳{p.price}</span></h5>
                        </div>

                        <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-white/40 font-semibold block">In Stock</span>
                            <span className={`text-md font-black block ${isLow ? 'text-rose-400' : 'text-white'}`}>
                              {p.stock} {p.unit}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleQuickRestock(p.id, 10)}
                              className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/15 text-xs font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all outline-none cursor-pointer"
                            >
                              +10 Pcs
                            </button>
                            <button 
                              onClick={() => handleQuickRestock(p.id, 50)}
                              className="bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/15 text-xs font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all outline-none cursor-pointer"
                            >
                              +50 Pcs
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB-7: SR VISITS REGISTER */}
            {activeTab === 'visits' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white font-display">SR Client Visit Register</h3>
                    <p className="text-xs text-white/40 mt-1">Track checkout logs of visit durations, ongoing route trips, and dealer interaction statuses</p>
                  </div>
                  <button 
                    onClick={() => setIsVisitModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:shadow-indigo-500/10 transition-all outline-none cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log New Check-in</span>
                  </button>
                </div>

                <div className="bg-white/5 border text-xs border-white/10 rounded-2xl shadow-lg shadow-black/10 overflow-hidden" style={{ contentVisibility: 'auto' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-white/40 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                        <th className="py-3 px-5">Visit Reference</th>
                        <th className="py-3 px-5">Representative Name</th>
                        <th className="py-3 px-5">Dealer Outlet Site</th>
                        <th className="py-3 px-5">Check-in Stamp</th>
                        <th className="py-3 px-5">Routing Status</th>
                        <th className="py-3 px-5 text-right">Logs Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80 font-medium">
                      {visits.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-white/40 font-medium">No route visits recorded.</td>
                        </tr>
                      ) : (
                        visits.map((v) => (
                          <tr key={v.id} className="hover:bg-white/5 transition-all">
                            <td className="py-3.5 px-5 font-mono font-bold text-white/40 text-[10px] uppercase">{v.id.toUpperCase()}</td>
                            <td className="py-3.5 px-5 font-bold text-white">{v.srName}</td>
                            <td className="py-3.5 px-5 text-white/70">{v.dealerName}</td>
                            <td className="py-3.5 px-5 text-white/50">{v.checkInTime}</td>
                            <td className="py-3.5 px-5">
                              {v.status === 'Completed' && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-bold">
                                  <Check className="w-3 h-3" /> COMPLETED
                                </span>
                              )}
                              {v.status === 'Ongoing' && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 animate-pulse font-bold">
                                  ONGOING
                                </span>
                              )}
                              {v.status === 'Planned' && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full px-2 py-0.5 font-bold">
                                  PLANNED
                                </span>
                              )}
                              {v.status === 'Missed' && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full px-2 py-0.5 font-bold">
                                  MISSED
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              {v.status === 'Ongoing' && (
                                <button 
                                  onClick={async () => {
                                    await updateVisitStatus(v.id, 'Completed');
                                    showToast('Route check-out updated to Completed.');
                                    reloadData();
                                  }}
                                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all outline-none cursor-pointer"
                                >
                                  Trigger Checkout
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 5. BACK-END DRIVEN MODALS SELECTION */}
      
      {/* MODAL-A: NEW INVOICE */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/10 flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="font-bold text-white text-sm font-display">Generate Real Invoice (Backend Sync)</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-white/40 hover:text-white/80 outline-none cursor-pointer scale-95 hover:scale-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs font-medium text-white/70">
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Select Dealer Outlet</label>
                <select 
                  required
                  value={newInvoiceData.dealerId}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dealerId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" className="bg-slate-955 text-white/55">-- Choose Outlet --</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.id} className="bg-slate-950 text-white">{d.name} ({d.territory})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Assigned Specialist (SR)</label>
                <select 
                  required
                  value={newInvoiceData.srId}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, srId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" className="bg-slate-955 text-white/55">-- Choose SR --</option>
                  {srs.map(r => (
                    <option key={r.id} value={r.id} className="bg-slate-955 text-white">{r.name} ({r.territory})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Billing Amount (৳)</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  placeholder="e.g. 25000"
                  value={newInvoiceData.amount}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl outline-none shadow-md hover:shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  Confirm and Post on Backend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL-B: NEW COLLECTION */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/10 flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="font-bold text-white text-sm font-display">Post Collection Payment (Backend Sync)</h3>
              <button onClick={() => setIsCollectionModalOpen(false)} className="text-white/40 hover:text-white/80 outline-none cursor-pointer scale-95 hover:scale-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4 text-xs font-medium text-white/70">
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Paying Dealer Outlet</label>
                <select 
                  required
                  value={newCollectionData.dealerId}
                  onChange={(e) => setNewCollectionData({ ...newCollectionData, dealerId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" className="bg-slate-955 text-white/55">-- Choose Outlet --</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.id} className="bg-slate-955 text-white">{d.name} (Due: ৳{d.currentDue.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Collection specialist (SR)</label>
                <select 
                  required
                  value={newCollectionData.srId}
                  onChange={(e) => setNewCollectionData({ ...newCollectionData, srId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" className="bg-slate-955 text-white/55">-- Choose SR --</option>
                  {srs.map(r => (
                    <option key={r.id} value={r.id} className="bg-slate-955 text-white">{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Settling Fund (৳)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="e.g. 15000"
                    value={newCollectionData.amount}
                    onChange={(e) => setNewCollectionData({ ...newCollectionData, amount: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Fund Method</label>
                  <select 
                    value={newCollectionData.method}
                    onChange={(e) => setNewCollectionData({ ...newCollectionData, method: e.target.value })}
                    className="w-full bg-slate-905 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer bg-slate-900"
                  >
                    <option value="Cash" className="bg-slate-955">Cash (Receipt)</option>
                    <option value="Bkash" className="bg-slate-955">bKash Terminal</option>
                    <option value="Nagad" className="bg-slate-955">Nagad Utility</option>
                    <option value="Bank" className="bg-slate-955">Bank Wire Transfer</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl outline-none shadow-md hover:shadow-emerald-600/10 transition-all cursor-pointer"
                >
                  Record and Settle Outstanding Due
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL-C: NEW SR ONBOARD */}
      {isSRModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/10 flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="font-bold text-white text-sm font-display">Onboard Representative (SR)</h3>
              <button onClick={() => setIsSRModalOpen(false)} className="text-white/40 hover:text-white/80 outline-none cursor-pointer scale-95 hover:scale-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSR} className="space-y-4 text-xs font-medium text-white/70">
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Representative Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. SR-Munir"
                  value={newSRData.name}
                  onChange={(e) => setNewSRData({ ...newSRData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Phone Contact</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="+88017..."
                    value={newSRData.phone}
                    onChange={(e) => setNewSRData({ ...newSRData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Territory Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Banani, Dhaka"
                    value={newSRData.territory}
                    onChange={(e) => setNewSRData({ ...newSRData, territory: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Overall Sales Target (৳)</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  placeholder="e.g. 400000"
                  value={newSRData.salesTarget}
                  onChange={(e) => setNewSRData({ ...newSRData, salesTarget: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl outline-none shadow-md hover:shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  Onboard Representative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL-D: REGISTER DEALER OUTLET */}
      {isDealerModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/10 flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="font-bold text-white text-sm font-display">Register Dealer Outlet</h3>
              <button onClick={() => setIsDealerModalOpen(false)} className="text-white/40 hover:text-white/80 outline-none cursor-pointer scale-95 hover:scale-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDealer} className="space-y-4 text-xs font-medium text-white/70">
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Outlet Corporate Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Nahar & Sons"
                  value={newDealerData.name}
                  onChange={(e) => setNewDealerData({ ...newDealerData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Outlet Owner</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Zahirul Islam"
                    value={newDealerData.ownerName}
                    onChange={(e) => setNewDealerData({ ...newDealerData, ownerName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Mobile Contact</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="+88018..."
                    value={newDealerData.phone}
                    onChange={(e) => setNewDealerData({ ...newDealerData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Territory Domain</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Tejgaon, Dhaka"
                    value={newDealerData.territory}
                    onChange={(e) => setNewDealerData({ ...newDealerData, territory: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Credit Threshold (৳)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="e.g. 500000"
                    value={newDealerData.creditLimit}
                    onChange={(e) => setNewDealerData({ ...newDealerData, creditLimit: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Location Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sector-4, Uttar Badda, Dhaka"
                  value={newDealerData.address}
                  onChange={(e) => setNewDealerData({ ...newDealerData, address: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl outline-none shadow-md hover:shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  Register Outlet in system
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL-E: LOG SR CHECK-IN VISIT */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/10 flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="font-bold text-white text-sm font-display">Settle Route Check-in Visit</h3>
              <button onClick={() => setIsVisitModalOpen(false)} className="text-white/40 hover:text-white/80 outline-none cursor-pointer scale-95 hover:scale-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckInVisit} className="space-y-4 text-xs font-medium text-white/70">
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Sales Representative (SR)</label>
                <select 
                  required
                  value={newVisitData.srId}
                  onChange={(e) => setNewVisitData({ ...newVisitData, srId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-white"
                >
                  <option value="" className="text-white/55">-- Choose SR --</option>
                  {srs.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Destination Dealer Outlet</label>
                <select 
                  required
                  value={newVisitData.dealerId}
                  onChange={(e) => setNewVisitData({ ...newVisitData, dealerId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-white"
                >
                  <option value="" className="text-white/55">-- Choose Outlet --</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.territory})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-wider mb-1.5">Routing Status</label>
                <select 
                  value={newVisitData.status}
                  onChange={(e) => setNewVisitData({ ...newVisitData, status: e.target.value as any })}
                  className="w-full bg-slate-900 border border-white/10 text-white p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-white"
                >
                  <option value="Ongoing">Ongoing Check-In</option>
                  <option value="Planned">Planned Route</option>
                  <option value="Completed">Direct Completed</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl outline-none shadow-md hover:shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  Post Visit Check-in Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
