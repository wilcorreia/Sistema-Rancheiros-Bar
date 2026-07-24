import React, { useState, useEffect, useCallback } from 'react';
import { Header, AppMode } from './components/Header';
import { TablesView } from './components/TablesView';
import { MobileOrderView } from './components/MobileOrderView';
import { KitchenView } from './components/KitchenView';
import { CheckoutModal } from './components/CheckoutModal';
import { ReportsView } from './components/ReportsView';
import { ProductsManager } from './components/ProductsManager';
import { PrinterSimulator } from './components/PrinterSimulator';
import { ThermalReceipt } from './components/ThermalReceipt';
import { Product, Table, Order, PrintJob, TableStatus, OrderItemStatus, PaymentMethod } from './types';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('TABLES');
  const [isStandaloneMobile, setIsStandaloneMobile] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<(Table & { activeOrders: Order[]; currentTotal: number })[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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

  // Fetch all live state from Express API
  const fetchAllData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [prodRes, tableRes, orderRes, printRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/tables'),
        fetch('/api/orders'),
        fetch('/api/print-jobs')
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (tableRes.ok) setTables(await tableRes.json());
      if (orderRes.ok) setOrders(await orderRes.json());
      if (printRes.ok) setPrintJobs(await printRes.json());
    } catch (err) {
      console.error('Error syncing with backend server:', err);
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
      items: { productId: string; name: string; price: number; quantity: number; notes: string; destination: any }[];
      customerCount?: number;
    },
    autoPrint = false
  ) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      const newOrder = await res.json();
      await fetchAllData();

      if (autoPrint && newOrder) {
        // Construct print job from order for thermal printing
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
        setActivePrintJobForThermal(pJob);
        setTimeout(() => {
          window.print();
        }, 150);
      }

      return newOrder;
    } else {
      throw new Error('Falha ao enviar pedido');
    }
  };

  // Handler: Delete Item from active Order
  const handleDeleteItemFromOrder = async (orderId: string, itemId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE'
      });
      await fetchAllData();
    } catch (err) {
      console.error('Error deleting item from order:', err);
    }
  };

  // Handler: Change Order or Item Status in Kitchen View
  const handleUpdateOrderStatus = async (
    orderId: string,
    status?: string,
    itemId?: string,
    itemStatus?: OrderItemStatus
  ) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, itemId, itemStatus })
    });
    fetchAllData();
  };

  // Handler: Complete Checkout for Table
  const handleConfirmCheckout = async (checkoutData: {
    tableId: string;
    paymentMethod: PaymentMethod;
    serviceFee: number;
    discount: number;
    waiterName: string;
  }) => {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutData)
    });

    if (res.ok) {
      await fetchAllData();
    } else {
      throw new Error('Falha ao concluir fechamento');
    }
  };

  // Handler: Add/Update/Delete Product
  const handleAddProduct = async (prodData: Omit<Product, 'id'>) => {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodData)
    });
    fetchAllData();
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    fetchAllData();
  };

  const handleDeleteProduct = async (id: string) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  // Handler: Add Table
  const handleAddTable = async (name: string, capacity: number) => {
    await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, capacity })
    });
    fetchAllData();
  };

  // Handler: Update Table Status
  const handleUpdateTableStatus = async (tableId: string, status: TableStatus) => {
    await fetch(`/api/tables/${tableId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
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
    await fetch(`/api/print-jobs/${jobId}/printed`, { method: 'POST' });
    fetchAllData();
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    if (confirm('Deseja restaurar os dados de demonstração com mesas e cardápio de testes?')) {
      await fetch('/api/reset-demo', { method: 'POST' });
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
