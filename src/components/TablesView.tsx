import React, { useState } from 'react';
import { Table, TableStatus, Order } from '../types';
import { Users, Clock, Plus, Receipt, Utensils, CheckCircle2, AlertCircle, PlusCircle, Trash2 } from 'lucide-react';

interface TablesViewProps {
  tables: (Table & { activeOrders: Order[]; currentTotal: number })[];
  onOpenOrderForTable: (tableId: string) => void;
  onSelectTableForCheckout: (tableId: string) => void;
  onUpdateTableStatus: (tableId: string, status: TableStatus) => void;
  onAddTable: (name: string, capacity: number) => void;
  onDeleteItemFromOrder?: (orderId: string, itemId: string) => void;
}

export const TablesView: React.FC<TablesViewProps> = ({
  tables,
  onOpenOrderForTable,
  onSelectTableForCheckout,
  onUpdateTableStatus,
  onAddTable,
  onDeleteItemFromOrder
}) => {
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'ALL'>('ALL');
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const selectedTableForDetail = tables.find(t => t.id === selectedTableId);

  const filteredTables = tables.filter(t => filterStatus === 'ALL' || t.status === filterStatus);

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    onAddTable(newTableName, newTableCapacity);
    setNewTableName('');
    setNewTableCapacity(4);
    setShowAddTableModal(false);
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'FREE':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">Livre</span>;
      case 'OCCUPIED':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">Ocupada</span>;
      case 'BILL_REQUESTED':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-200 animate-pulse">Pediu Conta</span>;
      case 'RESERVED':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">Reservada</span>;
    }
  };

  const getCardBorder = (status: TableStatus) => {
    switch (status) {
      case 'FREE':
        return 'border-slate-200 hover:border-emerald-400 bg-white';
      case 'OCCUPIED':
        return 'border-amber-300 bg-amber-50/40 hover:border-amber-400';
      case 'BILL_REQUESTED':
        return 'border-purple-400 bg-purple-50/50 hover:border-purple-500 shadow-md ring-2 ring-purple-300';
      case 'RESERVED':
        return 'border-blue-200 bg-blue-50/30 hover:border-blue-300';
    }
  };

  const formatElapsedTime = (isoString?: string) => {
    if (!isoString) return null;
    const diffMins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Filtrar:</span>
          {(['ALL', 'FREE', 'OCCUPIED', 'BILL_REQUESTED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' && 'Todas as Mesas'}
              {status === 'FREE' && '🟢 Livres'}
              {status === 'OCCUPIED' && '🟡 Ocupadas'}
              {status === 'BILL_REQUESTED' && '🟣 Pediram Conta'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddTableModal(true)}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Mesa</span>
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map(table => {
          const elapsedTime = formatElapsedTime(table.openedAt);
          const itemCount = table.activeOrders.reduce((sum, ord) => sum + ord.items.length, 0);

          return (
            <div
              key={table.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${getCardBorder(
                table.status
              )}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
                    <span>{table.name}</span>
                  </div>
                  {getStatusBadge(table.status)}
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cap: {table.capacity} p.</span>
                  </span>
                  {table.waiter && (
                    <span className="truncate">
                      Garçom: <strong className="text-slate-700">{table.waiter}</strong>
                    </span>
                  )}
                  {elapsedTime && (
                    <span className="flex items-center space-x-1 text-slate-600 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{elapsedTime}</span>
                    </span>
                  )}
                </div>

                {/* Total and Order info */}
                {table.status !== 'FREE' ? (
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60 mb-3">
                    <div className="text-[11px] text-slate-500 font-medium flex justify-between mb-1">
                      <span>Consumo ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                      <button
                        onClick={() => setSelectedTableId(table.id)}
                        className="text-amber-600 hover:underline font-bold text-[11px]"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      R$ {table.currentTotal.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center mb-3">
                    <span className="text-xs text-slate-400 font-medium">Mesa disponível para atendimento</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200/50 grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenOrderForTable(table.id)}
                  className="flex items-center justify-center space-x-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-2 rounded-xl transition shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{table.status === 'FREE' ? 'Abrir / Lançar' : '+ Lançar'}</span>
                </button>

                {table.status !== 'FREE' ? (
                  <button
                    onClick={() => onSelectTableForCheckout(table.id)}
                    className="flex items-center justify-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-2 rounded-xl transition"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Fechar / Caixa</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center justify-center space-x-1 bg-slate-100 text-slate-300 font-medium text-xs py-2 px-2 rounded-xl cursor-not-allowed"
                  >
                    <span>Livre</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Item Detail Modal */}
      {selectedTableForDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedTableForDetail.name} - Extrato Atual</h3>
                <p className="text-xs text-slate-500">Garçom: {selectedTableForDetail.waiter || 'Não informado'}</p>
              </div>
              <button
                onClick={() => setSelectedTableId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1">
              {selectedTableForDetail.activeOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  Nenhum pedido em aberto nesta mesa.
                </div>
              ) : (
                selectedTableForDetail.activeOrders.map(order => (
                  <div key={order.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1">
                      <span>Pedido #{order.orderNumber}</span>
                      <span>{new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-slate-800 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <div className="flex-1 pr-2">
                            <span className="font-bold text-slate-900">{item.quantity}x {item.name}</span>
                            {item.notes && <em className="text-amber-600 block text-[10px]">Obs: {item.notes}</em>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                            {onDeleteItemFromOrder && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!deletingItemId) {
                                    setDeletingItemId(item.id);
                                    try {
                                      await onDeleteItemFromOrder(order.id, item.id);
                                    } finally {
                                      setDeletingItemId(null);
                                    }
                                  }
                                }}
                                disabled={deletingItemId === item.id}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                title="Excluir produto do pedido"
                              >
                                {deletingItemId === item.id ? (
                                  <span className="text-[10px] text-red-500 font-bold animate-pulse">...</span>
                                ) : (
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
              <div>
                <span className="text-xs text-slate-500 block">Total Geral</span>
                <span className="text-xl font-black text-slate-900">R$ {selectedTableForDetail.currentTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const tId = selectedTableForDetail.id;
                    setSelectedTableId(null);
                    onOpenOrderForTable(tId);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl"
                >
                  + Lançar
                </button>
                <button
                  onClick={() => {
                    const tId = selectedTableForDetail.id;
                    setSelectedTableId(null);
                    onSelectTableForCheckout(tId);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Imprimir / Fechar Conta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">Cadastrar Nova Mesa / Local</h3>
            <form onSubmit={handleAddTableSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome ou Identificador</label>
                <input
                  type="text"
                  placeholder="Ex: Mesa 11, Balcão 03, Lounge VIP"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Capacidade (Pessoas)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={e => setNewTableCapacity(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Salvar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
