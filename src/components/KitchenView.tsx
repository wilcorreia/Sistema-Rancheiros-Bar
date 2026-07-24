import React, { useState, useEffect } from 'react';
import { Order, OrderItemStatus, PrintDestination, PrintJob } from '../types';
import { ChefHat, Printer, Clock, CheckCircle2, Play, Volume2, VolumeX, Check, AlertTriangle } from 'lucide-react';
import { playKitchenChime } from '../utils/audio';

interface KitchenViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status?: string, itemId?: string, itemStatus?: OrderItemStatus) => void;
  onPrintTicket: (job: PrintJob) => void;
  printJobs: PrintJob[];
  onMarkJobPrinted: (jobId: string) => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  orders,
  onUpdateOrderStatus,
  onPrintTicket,
  printJobs,
  onMarkJobPrinted
}) => {
  const [filterDestination, setFilterDestination] = useState<PrintDestination | 'ALL'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(false);

  // Filter pending active orders for kitchen view (non-closed)
  const activeOrders = orders.filter(o => o.status !== 'CLOSED');

  // Trigger sound when new order arrives
  useEffect(() => {
    if (soundEnabled && activeOrders.some(o => o.status === 'OPEN')) {
      playKitchenChime();
    }
  }, [activeOrders.length, soundEnabled]);

  const getItemStatusBadge = (status: OrderItemStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">Pendente</span>;
      case 'PREPARING':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Em Preparo</span>;
      case 'READY':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Pronto</span>;
      case 'DELIVERED':
        return <span className="bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Entregue</span>;
    }
  };

  const getTicketBg = (order: Order) => {
    if (order.items.every(i => i.status === 'READY' || i.status === 'DELIVERED')) {
      return 'border-emerald-500/40 bg-slate-900/90';
    }
    if (order.items.some(i => i.status === 'PREPARING')) {
      return 'border-amber-500/50 bg-slate-900 shadow-amber-500/10 shadow-lg';
    }
    return 'border-red-500/50 bg-slate-900 shadow-red-500/10 shadow-lg';
  };

  const formatOrderAge = (createdAt: string) => {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return `${mins} min`;
  };

  return (
    <div className="space-y-6">
      {/* Kitchen Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-black">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-base flex items-center space-x-2">
              <span>Tela da Cozinha / KDS</span>
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
                {activeOrders.length} Pedidos Ativos
              </span>
            </h2>
            <p className="text-xs text-slate-400">Monitor de pedidos e controle de impressão de comandas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Destination Filters */}
          <div className="bg-slate-950 p-1 rounded-xl flex space-x-1 border border-slate-800">
            {(['ALL', 'KITCHEN', 'BAR', 'DESSERT'] as const).map(dest => (
              <button
                key={dest}
                onClick={() => setFilterDestination(dest)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterDestination === dest
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {dest === 'ALL' && 'Tudo'}
                {dest === 'KITCHEN' && 'Cozinha'}
                {dest === 'BAR' && 'Bar'}
                {dest === 'DESSERT' && 'Sobremesas'}
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? 'Alarme sonoro ativado' : 'Alarme sonoro desativado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Auto Print Toggle */}
          <button
            onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              autoPrintEnabled
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Auto-impressão ao chegar novo pedido"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Auto Impressão: {autoPrintEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Orders KDS Grid */}
      {activeOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/40 mb-3" />
          <h3 className="font-extrabold text-slate-300 text-lg">Nenhum Pedido Pendente</h3>
          <p className="text-xs text-slate-500 mt-1">Todos os pedidos foram preparados e entregues!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrders.map(order => {
            const filteredItems = order.items.filter(
              item => filterDestination === 'ALL' || item.destination === filterDestination
            );

            if (filteredItems.length === 0) return null;

            const ageMinutes = formatOrderAge(order.createdAt);
            const isLate = parseInt(ageMinutes) > 20;

            // Matching print job for this order
            const matchingJob = printJobs.find(pj => pj.orderId === order.id && pj.status === 'PENDING');

            return (
              <div
                key={order.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${getTicketBg(order)}`}
              >
                <div>
                  {/* Order Header */}
                  <div className="flex justify-between items-start pb-3 border-b border-slate-800 mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-xl text-white">{order.tableName}</span>
                        <span className="bg-slate-800 text-amber-400 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">Garçom: {order.waiterName}</span>
                      {order.customerName && (
                        <span className="text-xs font-bold text-amber-400 block mt-0.5 uppercase">
                          Cliente: {order.customerName}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className={`flex items-center space-x-1 text-xs font-bold ${
                        isLate ? 'text-red-400 animate-pulse' : 'text-slate-300'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ageMinutes}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3 mb-4">
                    {filteredItems.map(item => (
                      <div key={item.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-black text-sm text-white">
                            {item.quantity}x {item.name}
                          </span>
                          {getItemStatusBadge(item.status)}
                        </div>

                        {item.notes && (
                          <div className="mt-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold p-1.5 rounded-lg uppercase tracking-wide">
                            ⚠️ OBS: {item.notes}
                          </div>
                        )}

                        {/* Item Status Toggle Buttons */}
                        <div className="flex space-x-1.5 mt-2 pt-1 border-t border-slate-900">
                          {item.status === 'PENDING' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, undefined, item.id, 'PREPARING')}
                              className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold py-1 px-2 rounded-lg border border-amber-500/30 transition flex items-center justify-center space-x-1"
                            >
                              <Play className="w-3 h-3" />
                              <span>Iniciar</span>
                            </button>
                          )}
                          {item.status === 'PREPARING' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, undefined, item.id, 'READY')}
                              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold py-1 px-2 rounded-lg border border-emerald-500/30 transition flex items-center justify-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Pronto</span>
                            </button>
                          )}
                          {item.status === 'READY' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, undefined, item.id, 'DELIVERED')}
                              className="flex-1 bg-slate-800 text-slate-300 text-[11px] font-bold py-1 px-2 rounded-lg border border-slate-700 transition"
                            >
                              Entregue
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const printPayload: PrintJob = matchingJob || {
                        id: `pj-manual-${Date.now()}`,
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        tableName: order.tableName,
                        waiterName: order.waiterName,
                        customerName: order.customerName,
                        destination: 'KITCHEN',
                        items: filteredItems.map(i => ({ name: i.name, quantity: i.quantity, notes: i.notes })),
                        createdAt: order.createdAt,
                        status: 'PRINTED'
                      };
                      onPrintTicket(printPayload);
                      if (matchingJob) onMarkJobPrinted(matchingJob.id);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Imprimir Comanda</span>
                  </button>

                  <button
                    onClick={() => {
                      // Mark all items ready/delivered
                      filteredItems.forEach(item => {
                        onUpdateOrderStatus(order.id, undefined, item.id, 'READY');
                      });
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-3 py-2 rounded-xl transition"
                    title="Concluir todos os itens da comanda"
                  >
                    Pronto Tudo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
