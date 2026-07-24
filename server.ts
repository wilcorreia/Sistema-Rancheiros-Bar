import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, INITIAL_TABLES, INITIAL_ORDERS, generatePastPayments } from './src/data/initialData.ts';
import { Product, Table, Order, PaymentRecord, PrintJob, OrderStatus, TableStatus } from './src/types.ts';
import {
  getFirestoreProducts,
  saveFirestoreProduct,
  deleteFirestoreProduct,
  getFirestoreTables,
  saveFirestoreTable,
  getFirestoreOrders,
  saveFirestoreOrder,
  deleteFirestoreOrder,
  getFirestorePaymentRecords,
  saveFirestorePaymentRecord,
  getFirestorePrintJobs,
  saveFirestorePrintJob,
  resetFirestoreData,
  clearFirestoreSalesData
} from './src/lib/firestoreService.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database Store with Firestore real-time persistence
let products: Product[] = [...INITIAL_PRODUCTS];
let tables: Table[] = [...INITIAL_TABLES];
let orders: Order[] = [...INITIAL_ORDERS];
let paymentRecords: PaymentRecord[] = [];
let printJobs: PrintJob[] = [];
let nextOrderNumber = 101;

// Load data from Firestore
async function syncFromFirestore() {
  try {
    const p = await getFirestoreProducts();
    if (p.length) products = p;

    const t = await getFirestoreTables();
    if (t.length) tables = t;

    const o = await getFirestoreOrders();
    if (o.length) {
      orders = o;
      const maxOrderNum = Math.max(...o.map(ord => ord.orderNumber || 0), 104);
      nextOrderNumber = maxOrderNum + 1;
    }

    const pay = await getFirestorePaymentRecords();
    if (pay.length) paymentRecords = pay;

    const pj = await getFirestorePrintJobs();
    if (pj.length) printJobs = pj;

    console.log('Successfully synchronized with Firebase Firestore!');
  } catch (err) {
    console.error('Error synchronizing with Firestore:', err);
  }
}

// Initial sync
syncFromFirestore();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString(), db: 'Firebase Firestore' });
});

// Products API
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: req.body.name,
    category: req.body.category || 'Geral',
    price: Number(req.body.price) || 0,
    description: req.body.description || '',
    available: req.body.available !== false,
    printDestination: req.body.printDestination || 'KITCHEN'
  };
  products.push(newProduct);
  await saveFirestoreProduct(newProduct);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Produto não encontrado' });

  products[index] = {
    ...products[index],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : products[index].price
  };
  await saveFirestoreProduct(products[index]);
  res.json(products[index]);
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  products = products.filter(p => p.id !== id);
  await deleteFirestoreProduct(id);
  res.json({ success: true });
});

// Categories API
app.get('/api/categories', (req, res) => {
  const categoriesSet = new Set(products.map(p => p.category || 'Geral'));
  res.json(Array.from(categoriesSet));
});

app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  const categoryName = name.trim();
  res.status(201).json({ name: categoryName });
});

app.put('/api/categories/:oldName', async (req, res) => {
  const { oldName } = req.params;
  const { newName } = req.body;
  if (!newName || !newName.trim()) return res.status(400).json({ error: 'Novo nome é obrigatório' });

  const updatedName = newName.trim();
  let updatedCount = 0;

  for (const product of products) {
    if (product.category === oldName) {
      product.category = updatedName;
      await saveFirestoreProduct(product);
      updatedCount++;
    }
  }

  res.json({ success: true, updatedCount, newName: updatedName });
});

app.delete('/api/categories/:name', async (req, res) => {
  const { name } = req.params;
  let reassignedCount = 0;

  for (const product of products) {
    if (product.category === name) {
      product.category = 'Geral';
      await saveFirestoreProduct(product);
      reassignedCount++;
    }
  }

  res.json({ success: true, reassignedCount });
});

// Tables API
app.get('/api/tables', (req, res) => {
  const enrichedTables = tables.map(table => {
    const tableOrders = orders.filter(o => o.tableId === table.id && o.status !== 'CLOSED');
    const totalAmount = tableOrders.reduce((sum, ord) => sum + ord.total, 0);
    return {
      ...table,
      activeOrders: tableOrders,
      currentTotal: Math.round(totalAmount * 100) / 100
    };
  });
  res.json(enrichedTables);
});

app.post('/api/tables', async (req, res) => {
  const newTable: Table = {
    id: `t-${Date.now()}`,
    name: req.body.name || `Mesa ${tables.length + 1}`,
    number: req.body.number || tables.length + 1,
    capacity: Number(req.body.capacity) || 4,
    status: 'FREE'
  };
  tables.push(newTable);
  await saveFirestoreTable(newTable);
  res.status(201).json(newTable);
});

app.patch('/api/tables/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, waiter, customerCount } = req.body;
  const table = tables.find(t => t.id === id);
  if (!table) return res.status(404).json({ error: 'Mesa não encontrada' });

  table.status = status as TableStatus;
  if (waiter !== undefined) table.waiter = waiter;
  if (customerCount !== undefined) table.customerCount = customerCount;
  if (status === 'OCCUPIED' && !table.openedAt) {
    table.openedAt = new Date().toISOString();
  } else if (status === 'FREE') {
    table.openedAt = undefined;
    table.waiter = undefined;
    table.customerCount = undefined;
  }

  await saveFirestoreTable(table);
  res.json(table);
});

// Orders API
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const { tableId, waiterName, items, customerCount } = req.body;
  const table = tables.find(t => t.id === tableId);
  
  if (!table) return res.status(400).json({ error: 'Mesa inválida' });

  const orderNum = nextOrderNumber++;
  const orderTotal = items.reduce((acc: number, item: any) => acc + ((Number(item.price) || 0) * item.quantity), 0);

  const formattedItems = items.map((item: any, idx: number) => ({
    id: `item-${Date.now()}-${idx}`,
    productId: item.productId || `custom-${idx}`,
    name: item.name,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    notes: item.notes || '',
    destination: item.destination || 'KITCHEN',
    status: 'PENDING' as const
  }));

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: orderNum,
    tableId: table.id,
    tableName: table.name,
    waiterName: waiterName || 'Garçom',
    items: formattedItems,
    total: Math.round(orderTotal * 100) / 100,
    createdAt: new Date().toISOString(),
    status: 'OPEN',
    printedToKitchen: false
  };

  orders.unshift(newOrder);
  await saveFirestoreOrder(newOrder);

  // Update table status
  table.status = 'OCCUPIED';
  table.waiter = waiterName || table.waiter || 'Garçom';
  if (customerCount) table.customerCount = Number(customerCount);
  if (!table.openedAt) table.openedAt = new Date().toISOString();
  await saveFirestoreTable(table);

  // Create single consolidated print job for all items on comanda
  if (formattedItems.length > 0) {
    const pJob: PrintJob = {
      id: `pj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      tableName: newOrder.tableName,
      waiterName: newOrder.waiterName,
      destination: 'KITCHEN', // Unified comanda production queue
      items: formattedItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, notes: i.notes })),
      createdAt: newOrder.createdAt,
      status: 'PENDING'
    };
    printJobs.unshift(pJob);
    await saveFirestorePrintJob(pJob);
  }

  res.status(201).json(newOrder);
});

// Delete item from open order
app.delete('/api/orders/:orderId/items/:itemId', async (req, res) => {
  const { orderId, itemId } = req.params;
  const order = orders.find(o => o.id === orderId);

  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  const initialItemCount = order.items.length;
  order.items = order.items.filter(i => i.id !== itemId);

  if (order.items.length === initialItemCount) {
    return res.status(404).json({ error: 'Item não encontrado no pedido' });
  }

  // Recalculate order total
  order.total = Math.round(order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 100) / 100;

  if (order.items.length === 0) {
    // If order is now empty, remove order completely
    orders = orders.filter(o => o.id !== orderId);
    await deleteFirestoreOrder(orderId);

    // Check if table has any remaining open orders
    const remainingTableOrders = orders.filter(o => o.tableId === order.tableId && o.status !== 'CLOSED');
    if (remainingTableOrders.length === 0) {
      const table = tables.find(t => t.id === order.tableId);
      if (table) {
        table.status = 'FREE';
        table.openedAt = undefined;
        table.waiter = undefined;
        table.customerCount = undefined;
        await saveFirestoreTable(table);
      }
    }
    return res.json({ success: true, message: 'Item e pedido removidos com sucesso' });
  } else {
    await saveFirestoreOrder(order);
    res.json({ success: true, order });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, itemStatus, itemId } = req.body;
  const order = orders.find(o => o.id === id);

  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  if (status) {
    order.status = status as OrderStatus;
  }

  if (itemId && itemStatus) {
    const item = order.items.find(i => i.id === itemId);
    if (item) item.status = itemStatus;
  }

  await saveFirestoreOrder(order);
  res.json(order);
});

// Checkout / Close Table
app.post('/api/orders/checkout', async (req, res) => {
  const { tableId, paymentMethod, serviceFee, discount, waiterName } = req.body;
  const table = tables.find(t => t.id === tableId);

  const activeOrders = orders.filter(o => o.tableId === tableId && o.status !== 'CLOSED');
  if (activeOrders.length === 0) {
    return res.status(400).json({ error: 'Nenhum pedido aberto para esta mesa' });
  }

  const subtotal = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const feeVal = Number(serviceFee) || 0;
  const discVal = Number(discount) || 0;
  const total = Math.max(0, subtotal + feeVal - discVal);

  const itemsSummaryMap = new Map<string, { name: string; quantity: number; price: number }>();
  activeOrders.forEach(o => {
    o.items.forEach(i => {
      const existing = itemsSummaryMap.get(i.productId);
      if (existing) {
        existing.quantity += i.quantity;
      } else {
        itemsSummaryMap.set(i.productId, { name: i.name, quantity: i.quantity, price: i.price });
      }
    });
  });

  const paymentRecord: PaymentRecord = {
    id: `pay-${Date.now()}`,
    orderId: activeOrders.map(o => o.id).join(','),
    tableId: tableId,
    tableName: table?.name || 'Mesa',
    waiterName: waiterName || table?.waiter || 'Garçom',
    subtotal: Math.round(subtotal * 100) / 100,
    serviceFee: Math.round(feeVal * 100) / 100,
    discount: Math.round(discVal * 100) / 100,
    total: Math.round(total * 100) / 100,
    paymentMethod: paymentMethod || 'PIX',
    timestamp: new Date().toISOString(),
    itemsSummary: Array.from(itemsSummaryMap.values())
  };

  paymentRecords.unshift(paymentRecord);
  await saveFirestorePaymentRecord(paymentRecord);

  // Close active orders
  for (const o of activeOrders) {
    o.status = 'CLOSED';
    await saveFirestoreOrder(o);
  }

  // Free table
  if (table) {
    table.status = 'FREE';
    table.openedAt = undefined;
    table.waiter = undefined;
    table.customerCount = undefined;
    await saveFirestoreTable(table);
  }

  res.json({ success: true, paymentRecord });
});

// Print Jobs API
app.get('/api/print-jobs', (req, res) => {
  res.json(printJobs);
});

app.post('/api/print-jobs/:id/printed', async (req, res) => {
  const { id } = req.params;
  const job = printJobs.find(pj => pj.id === id);
  if (job) {
    job.status = 'PRINTED';
    await saveFirestorePrintJob(job);

    const order = orders.find(o => o.id === job.orderId);
    if (order) {
      order.printedToKitchen = true;
      order.printedAt = new Date().toISOString();
      await saveFirestoreOrder(order);
    }
  }
  res.json({ success: true, job });
});

// Reports API
app.get('/api/reports/summary', (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const todayRecords = paymentRecords.filter(p => p.timestamp.startsWith(todayStr));
  const todayTotal = todayRecords.reduce((sum, p) => sum + p.total, 0);

  const byPaymentToday = {
    PIX: todayRecords.filter(p => p.paymentMethod === 'PIX').reduce((sum, p) => sum + p.total, 0),
    CREDIT: todayRecords.filter(p => p.paymentMethod === 'CREDIT').reduce((sum, p) => sum + p.total, 0),
    DEBIT: todayRecords.filter(p => p.paymentMethod === 'DEBIT').reduce((sum, p) => sum + p.total, 0),
    CASH: todayRecords.filter(p => p.paymentMethod === 'CASH').reduce((sum, p) => sum + p.total, 0),
  };

  const last30DaysMap = new Map<string, { date: string; revenue: number; count: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().split('T')[0];
    const displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    last30DaysMap.set(dateKey, { date: displayDate, revenue: 0, count: 0 });
  }

  let monthlyTotal = 0;
  paymentRecords.forEach(p => {
    const dateKey = p.timestamp.split('T')[0];
    monthlyTotal += p.total;
    if (last30DaysMap.has(dateKey)) {
      const entry = last30DaysMap.get(dateKey)!;
      entry.revenue = Math.round((entry.revenue + p.total) * 100) / 100;
      entry.count += 1;
    }
  });

  const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
  paymentRecords.forEach(p => {
    p.itemsSummary.forEach(item => {
      const current = productSalesMap.get(item.name) || { name: item.name, qty: 0, revenue: 0 };
      current.qty += item.quantity;
      current.revenue += item.quantity * item.price;
      productSalesMap.set(item.name, current);
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  res.json({
    today: {
      revenue: Math.round(todayTotal * 100) / 100,
      ordersCount: todayRecords.length,
      averageTicket: todayRecords.length ? Math.round((todayTotal / todayRecords.length) * 100) / 100 : 0,
      byPayment: byPaymentToday
    },
    monthly: {
      totalRevenue: Math.round(monthlyTotal * 100) / 100,
      ordersCount: paymentRecords.length,
      averageTicket: paymentRecords.length ? Math.round((monthlyTotal / paymentRecords.length) * 100) / 100 : 0
    },
    dailyChart: Array.from(last30DaysMap.values()),
    topProducts,
    recentTransactions: paymentRecords.slice(0, 15)
  });
});

// Clear All Sales Data (orders, history, print jobs)
app.post('/api/admin/clear-sales', async (req, res) => {
  orders = [];
  paymentRecords = [];
  printJobs = [];
  tables = INITIAL_TABLES.map(t => ({ ...t, status: 'FREE', waiter: undefined, openedAt: undefined, customerCount: undefined }));
  await clearFirestoreSalesData();
  res.json({ success: true, message: 'Todas as vendas e historicos ficticios foram limpos com sucesso!' });
});

// Reset System Data Endpoint
app.post('/api/reset-demo', async (req, res) => {
  products = [...INITIAL_PRODUCTS];
  tables = INITIAL_TABLES.map(t => ({ ...t, status: 'FREE' }));
  orders = [];
  paymentRecords = [];
  printJobs = [];
  await resetFirestoreData();
  res.json({ success: true, message: 'Sistema restaurado e limpo com sucesso!' });
});

// Vite server startup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
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
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
