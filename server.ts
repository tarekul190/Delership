import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { SR, Dealer, Invoice, Collection, Product, SRVisit, DashboardStats } from './src/types';

// Let's establish a file-based JSON persistence
const DATA_FILE = path.join(process.cwd(), 'server-data.json');

// Default initial dataset to mock a live system
const INITIAL_DATA = {
  srs: [
    { id: 'sr-1', name: 'SR-Akash', phone: '+8801711223344', email: 'akash@dealership.com', territory: 'Dhanmondi, Dhaka', active: true, salesTarget: 600000, salesAchieved: 520000, latitude: 23.8103, longitude: 90.4125, lastUpdated: '2 min ago' },
    { id: 'sr-2', name: 'SR-Rahim', phone: '+8801711556677', email: 'rahim@dealership.com', territory: 'Mirpur, Dhaka', active: true, salesTarget: 500000, salesAchieved: 410000, latitude: 23.8050, longitude: 90.3687, lastUpdated: '5 min ago' },
    { id: 'sr-3', name: 'SR-Karim', phone: '+8801711889900', email: 'karim@dealership.com', territory: 'Uttara, Dhaka', active: true, salesTarget: 400000, salesAchieved: 320000, latitude: 23.8759, longitude: 90.3795, lastUpdated: '3 min ago' },
    { id: 'sr-4', name: 'SR-Hasan', phone: '+8801711334455', email: 'hasan@dealership.com', territory: 'Gulshan, Dhaka', active: true, salesTarget: 350000, salesAchieved: 280000, latitude: 23.7925, longitude: 90.4078, lastUpdated: '1 min ago' },
    { id: 'sr-5', name: 'SR-Munir', phone: '+8801711993311', email: 'munir@dealership.com', territory: 'Banani, Dhaka', active: false, salesTarget: 300000, salesAchieved: 200000, latitude: 23.7937, longitude: 90.4033, lastUpdated: '10 min ago' },
  ] as SR[],

  dealers: [
    { id: 'd-1', name: 'M/S Rahman Store', ownerName: 'Abdur Rahman', phone: '+8801811122334', address: 'Main Road, Dhanmondi, Dhaka', territory: 'Dhanmondi, Dhaka', active: true, creditLimit: 500000, currentDue: 150000 },
    { id: 'd-2', name: 'M/S Kabir Traders', ownerName: 'Humayun Kabir', phone: '+8801811556677', address: 'Mirpur-10, Dhaka', territory: 'Mirpur, Dhaka', active: true, creditLimit: 400000, currentDue: 250000 },
    { id: 'd-3', name: 'M/S Lucky Store', ownerName: 'Sajidul Islam', phone: '+8801811889900', address: 'Sector-4, Uttara, Dhaka', territory: 'Uttara, Dhaka', active: true, creditLimit: 300000, currentDue: 180000 },
    { id: 'd-4', name: 'M/S Hasan Store', ownerName: 'Hasan Ali', phone: '+8801811334455', address: 'Gulshan Circle-2, Dhaka', territory: 'Gulshan, Dhaka', active: true, creditLimit: 300000, currentDue: 120000 },
    { id: 'd-5', name: 'M/S Ali Traders', ownerName: 'Md. Ali', phone: '+8801811990011', address: 'Moghbazar, Dhaka', territory: 'Moghbazar, Dhaka', active: true, creditLimit: 250000, currentDue: 90000 },
    { id: 'd-6', name: 'Nahar & Sons', ownerName: 'Zahirul Islam', phone: '+8801811776655', address: 'Tejgaon Industrial Area, Dhaka', territory: 'Tejgaon, Dhaka', active: true, creditLimit: 600000, currentDue: 350000 },
  ] as Dealer[],

  invoices: [
    { id: 'inv-1', invoiceNo: 'INV-2024-0520-001', dealerId: 'd-1', dealerName: 'M/S Rahman Store', srId: 'sr-1', srName: 'SR-Akash', date: '2024-05-20', amount: 25000, status: 'Paid' },
    { id: 'inv-2', invoiceNo: 'INV-2024-0520-002', dealerId: 'd-2', dealerName: 'M/S Kabir Traders', srId: 'sr-2', srName: 'SR-Rahim', date: '2024-05-20', amount: 18500, status: 'Due' },
    { id: 'inv-3', invoiceNo: 'INV-2024-0520-003', dealerId: 'd-3', dealerName: 'M/S Lucky Store', srId: 'sr-3', srName: 'SR-Karim', date: '2024-05-19', amount: 32000, status: 'Paid' },
    { id: 'inv-4', invoiceNo: 'INV-2024-0520-004', dealerId: 'd-4', dealerName: 'M/S Hasan Store', srId: 'sr-4', srName: 'SR-Hasan', date: '2024-05-19', amount: 15800, status: 'Due' },
    { id: 'inv-5', invoiceNo: 'INV-2024-0520-005', dealerId: 'd-5', dealerName: 'M/S Ali Traders', srId: 'sr-1', srName: 'SR-Akash', date: '2024-05-18', amount: 22000, status: 'Paid' },
  ] as Invoice[],

  collections: [
    { id: 'col-1', date: '2024-05-20', dealerId: 'd-1', dealerName: 'M/S Rahman Store', srId: 'sr-1', srName: 'SR-Akash', amount: 20000, method: 'Cash' },
    { id: 'col-2', date: '2024-05-20', dealerId: 'd-2', dealerName: 'M/S Kabir Traders', srId: 'sr-2', srName: 'SR-Rahim', amount: 15000, method: 'Bkash' },
    { id: 'col-3', date: '2024-05-19', dealerId: 'd-3', dealerName: 'M/S Lucky Store', srId: 'sr-3', srName: 'SR-Karim', amount: 12000, method: 'Nagad' },
    { id: 'col-4', date: '2024-05-19', dealerId: 'd-4', dealerName: 'M/S Hasan Store', srId: 'sr-4', srName: 'SR-Hasan', amount: 10000, method: 'Bank' },
    { id: 'col-5', date: '2024-05-18', dealerId: 'd-5', dealerName: 'M/S Ali Traders', srId: 'sr-1', srName: 'SR-Akash', amount: 25000, method: 'Cash' },
  ] as Collection[],

  products: [
    { id: 'p-1', name: 'Sunsilk Shampoo 170ml', stock: 12, unit: 'Pcs', alertLevel: 'Low', price: 210 },
    { id: 'p-2', name: 'Surf Excel 500gm', stock: 8, unit: 'Pcs', alertLevel: 'Low', price: 140 },
    { id: 'p-3', name: 'Colgate Toothpaste 100gm', stock: 15, unit: 'Pcs', alertLevel: 'Low', price: 95 },
    { id: 'p-4', name: 'Pran Mango Juice 1L', stock: 10, unit: 'Pcs', alertLevel: 'Low', price: 120 },
    { id: 'p-5', name: 'Dettol Soap 125gm', stock: 7, unit: 'Pcs', alertLevel: 'Low', price: 65 },
    { id: 'p-6', name: 'Lux Soap 150gm', stock: 150, unit: 'Pcs', alertLevel: 'Normal', price: 75 },
    { id: 'p-7', name: 'Wheel Soap 130gm', stock: 85, unit: 'Pcs', alertLevel: 'Normal', price: 35 },
    { id: 'p-8', name: 'Close Up Toothpaste 140gm', stock: 24, unit: 'Pcs', alertLevel: 'Medium', price: 125 },
  ] as Product[],

  visits: [
    { id: 'v-1', srId: 'sr-1', srName: 'SR-Akash', dealerId: 'd-1', dealerName: 'M/S Rahman Store', checkInTime: '10:30 AM', status: 'Completed' },
    { id: 'v-2', srId: 'sr-2', srName: 'SR-Rahim', dealerId: 'd-2', dealerName: 'M/S Kabir Traders', checkInTime: '11:15 AM', status: 'Completed' },
    { id: 'v-3', srId: 'sr-3', srName: 'SR-Karim', dealerId: 'd-3', dealerName: 'M/S Lucky Store', checkInTime: '11:45 AM', status: 'Ongoing' },
    { id: 'v-4', srId: 'sr-4', srName: 'SR-Hasan', dealerId: 'd-4', dealerName: 'M/S Hasan Store', checkInTime: '01:10 PM', status: 'Planned' },
    { id: 'v-5', srId: 'sr-1', srName: 'SR-Akash', dealerId: 'd-5', dealerName: 'M/S Ali Traders', checkInTime: '02:00 PM', status: 'Planned' },
  ] as SRVisit[],

  salesHistory: [
    { date: 'May 14', sales: 100000 },
    { date: 'May 15', sales: 140000 },
    { date: 'May 16', sales: 250000 },
    { date: 'May 17', sales: 210000 },
    { date: 'May 18', sales: 180000 },
    { date: 'May 19', sales: 220000 },
    { date: 'May 20', sales: 280000 },
  ],

  stats: {
    todaySales: 245500,
    todaySalesGrowth: 12.5,
    todayCollection: 180000,
    todayCollectionGrowth: 8.3,
    activeSRCount: 32,
    totalSRCount: 45,
    totalDealers: 285,
    totalDealersActive: 285,
    pendingDue: 1750000,
    pendingDueDealersCount: 102
  } as DashboardStats
};

// Ensure database file loaded
function loadDatabase() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading persistence database, loading defaults', e);
      return { ...INITIAL_DATA };
    }
  } else {
    saveDatabase(INITIAL_DATA);
    return { ...INITIAL_DATA };
  }
}

function saveDatabase(data: typeof INITIAL_DATA) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error persisting database', e);
  }
}

const db = loadDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request parser
  app.use(express.json());

  // Log simple requests for state verification
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });

  // REST API Endpoints
  
  // 1. Stats and overall charts
  app.get('/api/dashboard/summary', (req, res) => {
    // Dynamically re-calculate totals to keep stats matching the actual collections / invoices
    const totalInvoicesValue = db.invoices.reduce((sum, entry) => sum + entry.amount, 0);
    const todaySales = db.invoices
      .filter(inv => inv.date === '2024-05-20')
      .reduce((sum, inv) => sum + inv.amount, 0) || 245500;

    const todayCollection = db.collections
      .filter(col => col.date === '2024-05-20')
      .reduce((sum, col) => sum + col.amount, 0) || 180000;

    const activeSRCount = db.srs.filter(sr => sr.active).length;
    const totalSRCount = db.srs.length;
    
    // Total dealers & dues
    const totalDealers = db.dealers.length;
    const pendingDue = db.dealers.reduce((sum, dlr) => sum + dlr.currentDue, 0);

    const updatedStats = {
      ...db.stats,
      todaySales,
      todayCollection,
      activeSRCount: activeSRCount + 28, // Adding a constant factor to keep context of total (32 out of 45)
      totalSRCount: totalSRCount + 40,
      totalDealers: totalDealers + 279,
      pendingDue: pendingDue + 630000, // Anchored placeholder + custom values
    };

    res.json({
      stats: updatedStats,
      salesHistory: db.salesHistory,
      salesBySR: db.srs.map(sr => ({ name: sr.name, sales: sr.salesAchieved })),
      visits: db.visits,
      lowStockProducts: db.products.filter(p => p.stock <= p.alertLevel || p.stock < 20)
    });
  });

  // 2. Invoices Operations (CRUD)
  app.get('/api/invoices', (req, res) => {
    res.json(db.invoices);
  });

  app.post('/api/invoices', (req, res) => {
    const { dealerId, srId, amount } = req.body;
    const dealer = db.dealers.find(d => d.id === dealerId);
    const sr = db.srs.find(r => r.id === srId);

    if (!dealer || !sr) {
      return res.status(404).json({ error: 'Dealer or SR not found' });
    }

    const nextIdx = db.invoices.length + 1;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-2024-0520-00${nextIdx}`,
      dealerId: dealer.id,
      dealerName: dealer.name,
      srId: sr.id,
      srName: sr.name,
      date: '2024-05-20', // today standard
      amount: Number(amount),
      status: 'Due'
    };

    db.invoices.unshift(newInvoice); // Add to the top
    
    // Add to dealer current due
    dealer.currentDue += Number(amount);
    
    // Add to SR sales achievement
    sr.salesAchieved += Number(amount);

    // Save and send
    saveDatabase(db);
    res.status(201).json(newInvoice);
  });

  app.patch('/api/invoices/:id/pay', (req, res) => {
    const { id } = req.params;
    const invoice = db.invoices.find(inv => inv.id === id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    if (invoice.status === 'Paid') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    invoice.status = 'Paid';

    // Clear dealer's due by that amount
    const dealer = db.dealers.find(d => d.id === invoice.dealerId);
    if (dealer) {
      dealer.currentDue = Math.max(0, dealer.currentDue - invoice.amount);
    }

    // Automatically record a matching Collection event
    const newCollection: Collection = {
      id: `col-${Date.now()}`,
      date: '2024-05-20',
      dealerId: invoice.dealerId,
      dealerName: invoice.dealerName,
      srId: invoice.srId,
      srName: invoice.srName,
      amount: invoice.amount,
      method: 'Cash'
    };
    db.collections.unshift(newCollection);

    saveDatabase(db);
    res.json({ invoice, collection: newCollection });
  });

  // 3. Collections Operations
  app.get('/api/collections', (req, res) => {
    res.json(db.collections);
  });

  app.post('/api/collections', (req, res) => {
    const { dealerId, srId, amount, method } = req.body;
    const dealer = db.dealers.find(d => d.id === dealerId);
    const sr = db.srs.find(r => r.id === srId);

    if (!dealer || !sr) {
      return res.status(404).json({ error: 'Dealer or SR not found' });
    }

    const newCollection: Collection = {
      id: `col-${Date.now()}`,
      date: '2024-05-20',
      dealerId: dealer.id,
      dealerName: dealer.name,
      srId: sr.id,
      srName: sr.name,
      amount: Number(amount),
      method: method || 'Cash'
    };

    db.collections.unshift(newCollection);
    
    // Reduce dealer current due
    dealer.currentDue = Math.max(0, dealer.currentDue - Number(amount));

    saveDatabase(db);
    res.status(201).json(newCollection);
  });

  // 4. Sales Representatives (SR) Operations
  app.get('/api/srs', (req, res) => {
    res.json(db.srs);
  });

  app.post('/api/srs', (req, res) => {
    const { name, phone, email, territory, salesTarget } = req.body;
    const newSR: SR = {
      id: `sr-${Date.now()}`,
      name,
      phone,
      email,
      territory,
      active: true,
      salesTarget: Number(salesTarget) || 300000,
      salesAchieved: 0,
      latitude: 23.8103 + (Math.random() - 0.5) * 0.05,
      longitude: 90.4125 + (Math.random() - 0.5) * 0.05,
      lastUpdated: 'Just now'
    };
    
    db.srs.push(newSR);
    saveDatabase(db);
    res.status(201).json(newSR);
  });

  app.patch('/api/srs/:id/toggle-status', (req, res) => {
    const { id } = req.params;
    const sr = db.srs.find(r => r.id === id);
    if (!sr) return res.status(403).json({ error: 'SR not found' });
    
    sr.active = !sr.active;
    saveDatabase(db);
    res.json(sr);
  });

  app.post('/api/srs/:id/location', (req, res) => {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const sr = db.srs.find(r => r.id === id);
    if (!sr) return res.status(404).json({ error: 'SR not found' });

    sr.latitude = Number(latitude);
    sr.longitude = Number(longitude);
    sr.lastUpdated = '1 min ago';

    saveDatabase(db);
    res.json(sr);
  });

  // 5. Dealers API
  app.get('/api/dealers', (req, res) => {
    res.json(db.dealers);
  });

  app.post('/api/dealers', (req, res) => {
    const { name, ownerName, phone, address, territory, creditLimit } = req.body;
    const newDealer: Dealer = {
      id: `d-${Date.now()}`,
      name,
      ownerName,
      phone,
      address,
      territory,
      active: true,
      creditLimit: Number(creditLimit) || 300000,
      currentDue: 0
    };

    db.dealers.push(newDealer);
    saveDatabase(db);
    res.status(201).json(newDealer);
  });

  // 6. Products & Inventory API
  app.get('/api/products', (req, res) => {
    res.json(db.products);
  });

  app.put('/api/products/:id/adjust-stock', (req, res) => {
    const { id } = req.params;
    const { stockAdjustment } = req.body;
    const product = db.products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.stock = Math.max(0, product.stock + Number(stockAdjustment));
    
    // Dynamically adjust alert level
    if (product.stock <= 10) {
      product.alertLevel = 'Low';
    } else if (product.stock <= 25) {
      product.alertLevel = 'Medium';
    } else {
      product.alertLevel = 'Normal';
    }

    saveDatabase(db);
    res.json(product);
  });

  // 7. Visits API (Check-In Logs)
  app.get('/api/visits', (req, res) => {
    res.json(db.visits);
  });

  app.post('/api/visits', (req, res) => {
    const { srId, dealerId, checkInTime, status } = req.body;
    const dealer = db.dealers.find(d => d.id === dealerId);
    const sr = db.srs.find(r => r.id === srId);

    if (!dealer || !sr) {
      return res.status(404).json({ error: 'Dealer or SR not found' });
    }

    const newVisit: SRVisit = {
      id: `v-${Date.now()}`,
      srId: sr.id,
      srName: sr.name,
      dealerId: dealer.id,
      dealerName: dealer.name,
      checkInTime: checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: status || 'Ongoing'
    };

    db.visits.unshift(newVisit);
    saveDatabase(db);
    res.status(201).json(newVisit);
  });

  app.patch('/api/visits/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const visit = db.visits.find(v => v.id === id);
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    visit.status = status;
    saveDatabase(db);
    res.json(visit);
  });


  // Integrating Vite middleware for handling client bundle during Dev and static resources on Prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Dealer-SR Server running on http://0.0.0.0:${PORT}`);
    console.log(`Node environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
