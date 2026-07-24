import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header, AppMode } from './components/Header';
import { TablesView } from './components/TablesView';
import { MobileOrderView } from './components/MobileOrderView';
import { KitchenView } from './components/KitchenView';
import { CheckoutModal } from './components/CheckoutModal';
import { ReportsView } from './components/ReportsView';
import { ProductsManager } from './components/ProductsManager';
import { PrinterSimulator } from './components/PrinterSimulator';
import { ThermalReceipt } from './components/ThermalReceipt';
import { Product, Table, Order, PrintJob, TableStatus, OrderItemStatus, PaymentMethod, PaymentRecord } from './types';
import { INITIAL_PRODUCTS, INITIAL_TABLES } from './data/initialData';
import {
  getFirestoreProducts,
  getFirestoreTables,
  getFirestoreOrders,
  getFirestorePrintJobs,
  saveFirestoreProduct,
  deleteFirestoreProduct,
  saveFirestoreTable,
  saveFirestoreOrder,
  saveFirestorePaymentRecord,
  saveFirestorePrintJob,
  resetFirestoreData,
  clearFirestoreSalesData,
  deleteFirestoreOrder
} from './lib/firestoreService';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('TABLES');
  const [isStandaloneMobile, setIsStandaloneMobile] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [rawTables, setRawTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Compute enriched tables with activeOrders and currentTotal derived from orders
  const tables = useMemo(() => {
    return rawTables.map(t => {
      const activeOrders = (orders || []).filter(o => 
        (o.tableId === t.id || o.tableName?.toLowerCase() === t.name?.toLowerCase() || String(o.tableId) === String(t.number)) && 
        o.status !== 'CLOSED'
      );
      const currentTotal = activeOrders.reduce((sum, ord) => {
        const itemsSum = (ord.items || []).reduce((iSum, item) => iSum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
        return sum + itemsSum;
      }, 0);
      const oldestOrder = activeOrders[0];
      const latestOrder = activeOrders[activeOrders.length - 1];

      return {
        ...t,
        status: activeOrders.length > 0 ? ('OCCUPIED' as const) : t.status,
        activeOrders,
        currentTotal,
        openedAt: oldestOrder?.createdAt || t.openedAt,
        waiter: latestOrder?.waiterName || t.waiter
      };
    });
  }, [rawTables, orders]);

  // Check URL query params for ?mode=mobile
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'mobile' || params.get('mobile') === 'true') {
      setCurrentMode('MOBILE_ORDER');
      setIsStandaloneMobile(true);
    }
  }, []);

  // Modals & Active selections
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<string | undefined>(undefined);
  const [selectedTableForCheckout, setSelectedTableForCheckout] = useState<(Table & { activeOrders: Order[]; currentTotal: number }) | null>(null);
  const [activePrintJobForThermal, setActivePrintJobForThermal] = useState<PrintJob | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState<boolean>(false);

  // Fetch all live state from Express API (or fallback directly to client-side Firestore)
  const fetchAllData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const isJson = (res: Response) => res.ok && res.headers.get('content-type')?.includes('application/json');

      const [prodRes, tableRes, orderRes, printRes] = await Promise.allSettled([
        fetch('/api/products'),
        fetch('/api/tables'),
        fetch('/api/orders'),
        fetch('/api/print-jobs')
      ]);

      let loadedProducts: Product[] = [];
      let loadedTables: Table[] = [];
      let loadedOrders: Order[] = [];
      let loadedPrintJobs: PrintJob[] = [];

      if (prodRes.status === 'fulfilled' && isJson(prodRes.value)) {
        try { loadedProducts = await prodRes.value.json(); } catch {}
      }
      if (tableRes.status === 'fulfilled' && isJson(tableRes.value)) {
        try { loadedTables = await tableRes.value.json(); } catch {}
      }
      if (orderRes.status === 'fulfilled' && isJson(orderRes.value)) {
        try { loadedOrders = await orderRes.value.json(); } catch {}
      }
      if (printRes.status === 'fulfilled' && isJson(printRes.value)) {
        try { loadedPrintJobs = await printRes.value.json(); } catch {}
      }

      // Fallback to Firestore directly if backend API is not present (e.g. static host on Vercel)
      if (!loadedProducts.length) loadedProducts = await getFirestoreProducts();
      if (!loadedTables.length) loadedTables = await getFirestoreTables();
      if (!loadedOrders.length) loadedOrders = await getFirestoreOrders();
      if (!loadedPrintJobs.length) loadedPrintJobs = await getFirestorePrintJobs();

      setProducts(prev => {
        const base = loadedProducts.length ? loadedProducts : INITIAL_PRODUCTS;
        const map = new Map<string, Product>();
        base.forEach(p => map.set(p.id, p));
        prev.forEach(p => {
          if (!map.has(p.id)) map.set(p.id, p);
        });
        return Array.from(map.values());
      });

      setRawTables(prev => {
        const base = loadedTables.length ? loadedTables : INITIAL_TABLES;
        const map = new Map<string, Table>();
        base.forEach(t => map.set(t.id, t));
        prev.forEach(t => {
          if (!map.has(t.id)) map.set(t.id, t);
        });
        return Array.from(map.values()).sort((a, b) => a.number - b.number);
      });

      setOrders(prev => {
        const closedLocally = new Set(prev.filter(p => p.status === 'CLOSED').map(p => p.id));
        const mergedMap = new Map<string, Order>();
        loadedOrders.forEach(o => {
          if (closedLocally.has(o.id)) {
            mergedMap.set(o.id, { ...o, status: 'CLOSED' });
          } else {
            mergedMap.set(o.id, o);
          }
        });
        prev.forEach(o => {
          if (!mergedMap.has(o.id)) {
            mergedMap.set(o.id, o);
          }
        });
        return Array.from(mergedMap.values());
      });
      setPrintJobs(loadedPrintJobs);
    } catch (err) {
      console.error('API Sync error, using direct Firestore:', err);
      const [p, t, o, pj] = await Promise.all([
        getFirestoreProducts(),
        getFirestoreTables(),
        getFirestoreOrders(),
        getFirestorePrintJobs()
      ]);

      setProducts(prev => {
        const base = p.length ? p : INITIAL_PRODUCTS;
        const map = new Map<string, Product>();
        base.forEach(item => map.set(item.id, item));
        prev.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });
        return Array.from(map.values());
      });

      setRawTables(prev => {
        const base = t.length ? t : INITIAL_TABLES;
        const map = new Map<string, Table>();
        base.forEach(tbl => map.set(tbl.id, tbl));
        prev.forEach(tbl => {
          if (!map.has(tbl.id)) map.set(tbl.id, tbl);
        });
        return Array.from(map.values()).sort((a, b) => a.number - b.number);
      });
      setOrders(prev => {
        const mergedMap = new Map<string, Order>();
        o.forEach(ord => mergedMap.set(ord.id, ord));
        prev.forEach(ord => {
          if (ord.status === 'OPEN' && !mergedMap.has(ord.id)) {
            mergedMap.set(ord.id, ord);
          }
        });
        return Array.from(mergedMap.values());
      });
      setPrintJobs(pj);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial load + live polling sync every 3.5s for real-time mobile/desktop sync
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Handler: Create Order from Mobile or Tables view
  const handleSubmitOrder = async (
    orderData: {
      tableId: string;
      waiterName: string;
      customerName?: string;
      items: { productId: string; name: string; price: number; quantity: number; notes: string; destination: any }[];
      customerCount?: number;
    },
    autoPrint = false
  ) => {
    const targetTable = rawTables.find(t => t.id === orderData.tableId);
    const orderNum = Math.max(...orders.map(o => o.orderNumber || 0), 100) + 1;
    const orderItems = orderData.items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      productId: it.productId,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      notes: it.notes || '',
      status: 'PENDING' as OrderItemStatus,
      destination: it.destination || ('KITCHEN' as const)
    }));
    const calculatedTotal = orderItems.reduce((s, item) => s + item.price * item.quantity, 0);

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: orderNum,
      tableId: orderData.tableId,
      tableName: targetTable ? targetTable.name : `Mesa ${orderData.tableId}`,
      waiterName: orderData.waiterName || 'Rancheiros',
      customerName: orderData.customerName,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      printedToKitchen: false,
      total: calculatedTotal,
      items: orderItems
    };

    // Instant state update so table never appears empty
    setOrders(prev => [...prev.filter(o => o.id !== newOrder.id), newOrder]);
    setRawTables(prev => prev.map(t => t.id === orderData.tableId ? { ...t, status: 'OCCUPIED' } : t));

    // Save order to Firestore
    try {
      await saveFirestoreOrder(newOrder);
      if (targetTable) {
        await saveFirestoreTable({
          id: targetTable.id,
          number: targetTable.number,
          name: targetTable.name,
          capacity: targetTable.capacity,
          customerCount: orderData.customerCount || targetTable.customerCount || 1,
          status: 'OCCUPIED'
        });
      }
    } catch (err) {
      console.error('Error saving order to Firestore:', err);
    }

    if (autoPrint) {
      const pJob: PrintJob = {
        id: `pj-${Date.now()}`,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        tableName: newOrder.tableName,
        waiterName: newOrder.waiterName,
        destination: 'KITCHEN',
        items: newOrder.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price, notes: i.notes })),
        createdAt: newOrder.createdAt,
        status: 'PENDING'
      };
      setPrintJobs(prev => [...prev, pJob]);
      saveFirestorePrintJob(pJob).catch(() => {});
      setActivePrintJobForThermal(pJob);
      setTimeout(() => {
        window.print();
      }, 150);
    }

    return newOrder;
  };

  // Handler: Delete Item from active Order
  const handleDeleteItemFromOrder = async (orderId: string, itemId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items.filter(i => i.id !== itemId);
      return { ...o, items: updatedItems };
    }).filter(o => o.items.length > 0));

    try {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const updatedItems = order.items.filter(i => i.id !== itemId);
        if (updatedItems.length === 0) {
          await deleteFirestoreOrder(orderId);
        } else {
          await saveFirestoreOrder({ ...order, items: updatedItems });
        }
      }
    } catch (err) {
      console.error('Error deleting order item:', err);
    }
  };

  // Handler: Change Order or Item Status in Kitchen View
  const handleUpdateOrderStatus = async (
    orderId: string,
    status?: string,
    itemId?: string,
    itemStatus?: OrderItemStatus
  ) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      let updated = { ...o };
      if (status) updated.status = status as any;
      if (itemId && itemStatus) {
        updated.items = updated.items.map(i => i.id === itemId ? { ...i, status: itemStatus } : i);
      }
      return updated;
    }));

    try {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        let updated = { ...order };
        if (status) updated.status = status as any;
        if (itemId && itemStatus) {
          updated.items = updated.items.map(i => i.id === itemId ? { ...i, status: itemStatus } : i);
        }
        await saveFirestoreOrder(updated);
      }
    } catch (err) {
      console.error('Error updating order status in Firestore:', err);
    }
  };

  // Handler: Complete Checkout for Table
  const handleConfirmCheckout = async (checkoutData: {
    tableId: string;
    paymentMethod: PaymentMethod;
    serviceFee: number;
    discount: number;
    waiterName: string;
  }) => {
    // 1. Find target table in rawTables
    const targetTable = rawTables.find(t =>
      t.id === checkoutData.tableId ||
      String(t.number) === String(checkoutData.tableId) ||
      t.name?.toLowerCase() === String(checkoutData.tableId).toLowerCase()
    );

    // 2. Find ALL active orders belonging to this table
    const tableOrders = orders.filter(o =>
      o.status !== 'CLOSED' && (
        o.tableId === checkoutData.tableId ||
        (targetTable && (
          o.tableId === targetTable.id ||
          String(o.tableId) === String(targetTable.number) ||
          o.tableName?.toLowerCase() === targetTable.name?.toLowerCase()
        ))
      )
    );

    const subtotal = tableOrders.reduce((sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0), 0);
    const totalAmount = Math.max(0, subtotal + checkoutData.serviceFee - checkoutData.discount);

    // Consolidated items summary for payment record
    const itemsSummaryMap = new Map<string, { name: string; quantity: number; price: number }>();
    tableOrders.forEach(o => {
      (o.items || []).forEach(i => {
        const existing = itemsSummaryMap.get(i.name);
        if (existing) {
          existing.quantity += i.quantity;
        } else {
          itemsSummaryMap.set(i.name, { name: i.name, quantity: i.quantity, price: Number(i.price) || 0 });
        }
      });
    });

    const record: PaymentRecord = {
      id: `pay-${Date.now()}`,
      orderId: tableOrders.map(o => o.id).join(','),
      tableId: targetTable ? targetTable.id : checkoutData.tableId,
      tableName: targetTable ? targetTable.name : `Mesa ${checkoutData.tableId}`,
      waiterName: checkoutData.waiterName || targetTable?.waiter || 'Garçom',
      subtotal: Math.round(subtotal * 100) / 100,
      serviceFee: checkoutData.serviceFee,
      discount: checkoutData.discount,
      total: Math.round(totalAmount * 100) / 100,
      paymentMethod: checkoutData.paymentMethod,
      timestamp: new Date().toISOString(),
      itemsSummary: Array.from(itemsSummaryMap.values())
    };

    // 3. INSTANT STATE UPDATES IN REACT
    const closedOrderIds = new Set(tableOrders.map(o => o.id));
    setOrders(prev => prev.map(o => closedOrderIds.has(o.id) ? { ...o, status: 'CLOSED' as const } : o));

    if (targetTable) {
      setRawTables(prev => prev.map(t => t.id === targetTable.id ? {
        ...t,
        status: 'FREE' as const,
        waiter: undefined,
        customerCount: undefined,
        openedAt: undefined
      } : t));
    }

    // 4. PERSIST TO FIRESTORE DIRECTLY
    try {
      await saveFirestorePaymentRecord(record);

      for (const ord of tableOrders) {
        await saveFirestoreOrder({ ...ord, status: 'CLOSED' });
      }

      if (targetTable) {
        await saveFirestoreTable({
          id: targetTable.id,
          number: targetTable.number,
          name: targetTable.name,
          capacity: targetTable.capacity,
          status: 'FREE'
        });
      }
    } catch (err) {
      console.error('Error persisting checkout to Firestore:', err);
    }

    // 5. ALSO POST TO EXPRESS API
    try {
      await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      });
    } catch {
      // ignore network failure
    }

    await fetchAllData();
  };

  // Handler: Add/Update/Delete Product
  const handleAddProduct = async (prodData: Omit<Product, 'id'>) => {
    const newP: Product = {
      ...prodData,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [...prev.filter(p => p.id !== newP.id), newP]);
    try {
      await saveFirestoreProduct(newP);
    } catch (err) {
      console.error('Error saving product to Firestore:', err);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const p = products.find(prod => prod.id === id);
    if (p) {
      try {
        await saveFirestoreProduct({ ...p, ...updates });
      } catch (err) {
        console.error('Error updating product in Firestore:', err);
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await deleteFirestoreProduct(id);
    } catch (err) {
      console.error('Error deleting product in Firestore:', err);
    }
  };

  // Handler: Add Table
  const handleAddTable = async (name: string, capacity: number) => {
    const newT: Table = {
      id: `table-${Date.now()}`,
      number: rawTables.length + 1,
      name,
      capacity,
      status: 'FREE'
    };
    setRawTables(prev => [...prev.filter(t => t.id !== newT.id), newT]);
    try {
      await saveFirestoreTable(newT);
    } catch (err) {
      console.error('Error saving table in Firestore:', err);
    }
  };

  // Handler: Update Table Status
  const handleUpdateTableStatus = async (tableId: string, status: TableStatus) => {
    try {
      const res = await fetch(`/api/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('API failed');
    } catch {
      const t = tables.find(tab => tab.id === tableId);
      if (t) {
        await saveFirestoreTable({
          id: t.id,
          number: t.number,
          name: t.name,
          capacity: t.capacity,
          status
        });
      }
    }
    fetchAllData();
  };

  // Handler: Print Ticket
  const handlePrintTicket = (job: PrintJob) => {
    setActivePrintJobForThermal(job);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Handler: Mark Print Job Done
  const handleMarkJobPrinted = async (jobId: string) => {
    try {
      const res = await fetch(`/api/print-jobs/${jobId}/printed`, { method: 'POST' });
      if (!res.ok) throw new Error('API failed');
    } catch {
      const job = printJobs.find(j => j.id === jobId);
      if (job) {
        await saveFirestorePrintJob({ ...job, status: 'PRINTED' });
      }
    }
    fetchAllData();
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    if (confirm('Deseja restaurar os dados de demonstração com mesas e cardápio de testes?')) {
      try {
        const res = await fetch('/api/reset-demo', { method: 'POST' });
        if (!res.ok) throw new Error('API failed');
      } catch {
        await resetFirestoreData();
      }
      fetchAllData();
    }
  };

  const pendingKitchenCount = orders.filter(o => o.status !== 'CLOSED' && o.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-slate-950 sm:bg-slate-100 text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Printable Thermal Receipt Component */}
      <ThermalReceipt job={activePrintJobForThermal} />

      {/* Main App Navigation Header or Standalone Mobile Bar */}
      {isStandaloneMobile ? (
        <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <span className="font-black text-amber-400 text-sm tracking-wider uppercase">RANCHEIRO'S <span className="text-white">GARÇOM</span></span>
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
          </div>
          <button
            onClick={() => {
              setIsStandaloneMobile(false);
              const url = new URL(window.location.href);
              url.searchParams.delete('mode');
              url.searchParams.delete('mobile');
              window.history.replaceState({}, '', url.toString());
            }}
            className="text-[11px] bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 font-semibold"
          >
            Modo Completo (PC)
          </button>
        </div>
      ) : (
        <Header
          currentMode={currentMode}
          onModeChange={mode => {
            setCurrentMode(mode);
            if (mode !== 'MOBILE_ORDER') setSelectedTableForOrder(undefined);
          }}
          pendingKitchenCount={pendingKitchenCount}
          onResetDemo={handleResetDemo}
          isSyncing={isSyncing}
          onOpenPrinterModal={() => setShowPrinterModal(true)}
        />
      )}

      {/* Main Content Area */}
      <main className={isStandaloneMobile ? "p-0" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:hidden"}>
        {currentMode === 'TABLES' && (
          <TablesView
            tables={tables}
            onOpenOrderForTable={tableId => {
              setSelectedTableForOrder(tableId);
              setCurrentMode('MOBILE_ORDER');
            }}
            onSelectTableForCheckout={tableId => {
              const table = tables.find(t => t.id === tableId);
              if (table) setSelectedTableForCheckout(table);
            }}
            onUpdateTableStatus={handleUpdateTableStatus}
            onAddTable={handleAddTable}
            onDeleteItemFromOrder={handleDeleteItemFromOrder}
          />
        )}

        {currentMode === 'MOBILE_ORDER' && (
          <MobileOrderView
            products={products}
            tables={tables}
            preselectedTableId={selectedTableForOrder}
            onSubmitOrder={handleSubmitOrder}
            onCancel={() => setCurrentMode('TABLES')}
          />
        )}

        {currentMode === 'KITCHEN' && (
          <KitchenView
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onPrintTicket={handlePrintTicket}
            printJobs={printJobs}
            onMarkJobPrinted={handleMarkJobPrinted}
          />
        )}

        {currentMode === 'CHECKOUT' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm text-center">
              <h2 className="text-xl font-black text-slate-900 mb-2">Caixa & Fechamento de Comandas</h2>
              <p className="text-xs text-slate-500 mb-4">Selecione uma mesa ocupada para emitir a conta, aplicar desconto e receber o pagamento.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                {tables.filter(t => t.status !== 'FREE').length === 0 ? (
                  <p className="text-xs text-slate-400 col-span-3 py-6">Nenhuma mesa aberta para fechamento no momento.</p>
                ) : (
                  tables.filter(t => t.status !== 'FREE').map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTableForCheckout(t)}
                      className="p-4 rounded-2xl bg-slate-900 text-white font-bold text-left hover:bg-slate-800 transition flex justify-between items-center"
                    >
                      <div>
                        <span className="block font-black text-sm">{t.name}</span>
                        <span className="text-[11px] text-amber-400 font-mono">
                          R$ {t.currentTotal.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <span className="text-xs bg-amber-500 text-slate-950 px-2 py-1 rounded-xl">Fechar</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {currentMode === 'REPORTS' && (
          <ReportsView onRefreshData={fetchAllData} />
        )}

        {currentMode === 'PRODUCTS' && (
          <ProductsManager
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
      </main>

      {/* Checkout Modal */}
      {selectedTableForCheckout && (
        <CheckoutModal
          table={selectedTableForCheckout}
          onClose={() => setSelectedTableForCheckout(null)}
          onConfirmCheckout={async checkoutData => {
            await handleConfirmCheckout(checkoutData);
            setSelectedTableForCheckout(null);
          }}
        />
      )}

      {/* Printer Queue Modal */}
      {showPrinterModal && (
        <PrinterSimulator
          printJobs={printJobs}
          onClose={() => setShowPrinterModal(false)}
          onPrintJob={handlePrintTicket}
          onMarkPrinted={handleMarkJobPrinted}
        />
      )}
    </div>
  );
}
