import React, { useState } from 'react';
import { Product, Table, PrintDestination } from '../types';
import { Smartphone, Search, Plus, Minus, Send, MessageSquare, Check, ShoppingBag, ArrowLeft, Printer, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface MobileOrderViewProps {
  products: Product[];
  tables: Table[];
  preselectedTableId?: string;
  onSubmitOrder: (orderData: {
    tableId: string;
    waiterName: string;
    items: { productId: string; name: string; price: number; quantity: number; notes: string; destination: PrintDestination }[];
    customerCount?: number;
  }, autoPrint?: boolean) => void;
  onCancel?: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

export const MobileOrderView: React.FC<MobileOrderViewProps> = ({
  products,
  tables,
  preselectedTableId,
  onSubmitOrder,
  onCancel
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>(preselectedTableId || (tables[0]?.id || ''));
  const [waiterName, setWaiterName] = useState<string>(localStorage.getItem('waiterName') || 'Carlos');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeItemForNotes, setActiveItemForNotes] = useState<Product | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const categories: string[] = ['TODOS', ...Array.from<string>(new Set(products.map(p => (p.category || 'Geral'))))];
  const allCategories: string[] = Array.from<string>(new Set(products.map(p => (p.category || 'Geral'))));

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const expandAll = () => setCollapsedCategories({});
  const collapseAll = () => {
    const collapsedMap: Record<string, boolean> = {};
    allCategories.forEach(c => { collapsedMap[c] = true; });
    setCollapsedCategories(collapsedMap);
  };

  const categoryGroups = allCategories.map(cat => {
    const items = products.filter(p => {
      const matchesCategoryFilter = selectedCategory === 'TODOS' || p.category === cat;
      const matchesSearch = searchQuery.trim() === '' ||
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategoryFilter && matchesSearch && p.available && (p.category || 'Geral') === cat;
    });

    return { category: cat, items };
  }).filter(group => group.items.length > 0);

  const addToCart = (product: Product, notes = '') => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.notes === notes);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }
      return [...prev, { product, quantity: 1, notes }];
    });
  };

  const removeFromCart = (product: Product, notes = '') => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && (notes ? item.notes === notes : true));
      if (existingIndex > -1) {
        const updated = [...prev];
        if (updated[existingIndex].quantity > 1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity - 1
          };
        } else {
          updated.splice(existingIndex, 1);
        }
        return updated;
      }
      return prev;
    });
  };

  const handleNotesSave = () => {
    if (activeItemForNotes) {
      addToCart(activeItemForNotes, tempNotes);
      setActiveItemForNotes(null);
      setTempNotes('');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSendOrder = async (autoPrint = false) => {
    if (!selectedTableId) {
      alert('Selecione uma mesa!');
      return;
    }
    if (cart.length === 0) {
      alert('Adicione pelo menos um produto ao pedido!');
      return;
    }

    setIsSubmitting(true);
    localStorage.setItem('waiterName', waiterName);

    try {
      await onSubmitOrder({
        tableId: selectedTableId,
        waiterName,
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          notes: item.notes,
          destination: item.product.printDestination
        }))
      }, autoPrint);

      setOrderSuccess(true);
      setCart([]);
      setTimeout(() => {
        setOrderSuccess(false);
        if (onCancel) onCancel();
      }, 1500);
    } catch (err) {
      alert('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 text-slate-100 min-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
      {/* Mobile Header Bar */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onCancel && (
            <button onClick={onCancel} className="p-1 text-slate-400 hover:text-white mr-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Smartphone className="w-5 h-5 text-amber-400" />
          <div className="flex flex-col">
            <span className="font-extrabold text-xs tracking-wide text-amber-400 uppercase">RANCHEIRO'S BAR</span>
            <span className="text-[10px] text-slate-400">Rua Pres. Café Filho, 355</span>
          </div>
        </div>
        <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
          Atendimento Mobile
        </span>
      </div>

      {/* Table & Waiter Selection */}
      <div className="bg-slate-900 p-3 border-b border-slate-800/80 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mesa / Local</label>
          <select
            value={selectedTableId}
            onChange={e => setSelectedTableId(e.target.value)}
            className="w-full bg-slate-950 text-white text-xs font-bold p-2 rounded-xl border border-slate-700 focus:border-amber-400 outline-none"
          >
            {tables.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.status === 'FREE' ? 'Livre' : 'Ocupada'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Garçom</label>
          <input
            type="text"
            value={waiterName}
            onChange={e => setWaiterName(e.target.value)}
            placeholder="Seu Nome"
            className="w-full bg-slate-950 text-white text-xs font-bold p-2 rounded-xl border border-slate-700 focus:border-amber-400 outline-none"
          />
        </div>
      </div>

      {/* Category Horizontal Filter Chips & Accordion Controls */}
      <div className="bg-slate-950/80 p-2 overflow-x-auto flex items-center justify-between no-scrollbar border-b border-slate-800">
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1 pl-2 border-l border-slate-800 text-[10px] whitespace-nowrap">
          <button
            onClick={expandAll}
            className="text-slate-400 hover:text-amber-400 font-semibold px-1.5 py-1"
          >
            Expandir
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={collapseAll}
            className="text-slate-400 hover:text-amber-400 font-semibold px-1.5 py-1"
          >
            Recolher
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-slate-900 border-b border-slate-800/60">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar item no cardápio..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-amber-400 outline-none"
          />
        </div>
      </div>

      {/* Vertical Category Accordion Product List (Takeat Style) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {categoryGroups.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-medium">
            Nenhum produto encontrado nesta categoria.
          </div>
        ) : (
          categoryGroups.map(({ category, items }) => {
            const isCollapsed = searchQuery.trim() === '' && (collapsedCategories[category] ?? false);
            const totalCartInCategory = items.reduce((sum, item) => {
              const cartEntries = cart.filter(c => c.product.id === item.id);
              return sum + cartEntries.reduce((s, c) => s + c.quantity, 0);
            }, 0);

            return (
              <div
                key={category}
                className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg transition"
              >
                {/* Accordion Category Header */}
                <button
                  onClick={() => toggleCategoryCollapse(category)}
                  className="w-full p-3.5 bg-slate-900/90 hover:bg-slate-800/90 flex items-center justify-between text-left transition border-b border-slate-800/60"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                    <div>
                      <h3 className="font-black text-xs text-white uppercase tracking-wider">{category}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">{items.length} {items.length === 1 ? 'opção' : 'opções'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {totalCartInCategory > 0 && (
                      <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                        {totalCartInCategory} no pedido
                      </span>
                    )}
                    {!isCollapsed ? (
                      <ChevronUp className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Collapsible Product List */}
                {!isCollapsed && (
                  <div className="p-2 space-y-2 divide-y divide-slate-800/50">
                    {items.map(product => {
                      const cartEntries = cart.filter(c => c.product.id === product.id);
                      const totalInCart = cartEntries.reduce((sum, c) => sum + c.quantity, 0);

                      return (
                        <div
                          key={product.id}
                          className="pt-2.5 first:pt-1 flex items-center justify-between p-2 rounded-xl hover:bg-slate-900/40 transition"
                        >
                          <div className="flex-1 pr-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-slate-100">{product.name}</span>
                              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                                {product.printDestination === 'KITCHEN' ? 'Cozinha' : 'Bar'}
                              </span>
                            </div>
                            {product.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">{product.description}</p>
                            )}
                            <div className="text-amber-400 font-extrabold text-xs mt-1">
                              R$ {product.price.toFixed(2).replace('.', ',')}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                setActiveItemForNotes(product);
                                setTempNotes('');
                              }}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition"
                              title="Adicionar com observação (ex: Ponto, sem cebola)"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {totalInCart > 0 ? (
                              <div className="flex items-center bg-amber-500 rounded-xl p-0.5 shadow-sm">
                                <button
                                  onClick={() => removeFromCart(product)}
                                  className="bg-slate-950 hover:bg-slate-900 text-amber-400 p-1.5 rounded-lg transition active:scale-90"
                                  title="Diminuir quantidade"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-black text-xs text-slate-950 px-2.5">
                                  {totalInCart}
                                </span>
                                <button
                                  onClick={() => addToCart(product)}
                                  className="bg-slate-950 hover:bg-slate-900 text-amber-400 p-1.5 rounded-lg transition active:scale-90"
                                  title="Aumentar quantidade"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(product)}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 shadow-sm active:scale-95 transition"
                                title="Adicionar ao pedido"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Floating Order Summary Drawer */}
      {cart.length > 0 && (
        <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-3">
          <div className="max-h-28 overflow-y-auto space-y-1.5 text-xs text-slate-300 pr-1">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-900 p-2 rounded-xl">
                <div className="truncate flex-1 pr-2">
                  <span className="font-bold text-white">{item.quantity}x {item.product.name}</span>
                  {item.notes && <span className="block text-[10px] text-amber-400 italic">Obs: {item.notes}</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-300">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                  <button onClick={() => removeFromCart(item.product, item.notes)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2 border-t border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Total do Pedido</span>
              <span className="text-xl font-black text-white">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSendOrder(false)}
                disabled={isSubmitting}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-3 rounded-2xl flex items-center justify-center space-x-1.5 transition border border-slate-700 disabled:opacity-50"
                title="Enviar apenas para produção"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Enviar</span>
              </button>

              <button
                onClick={() => handleSendOrder(true)}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs px-4 py-3 rounded-2xl flex items-center justify-center space-x-1.5 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                title="Enviar pedido e imprimir a comanda direto na impressora"
              >
                <Printer className="w-4 h-4" />
                <span>{isSubmitting ? 'ENVIANDO...' : 'Enviar e Imprimir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner Overlay */}
      {orderSuccess && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40 mb-3 animate-bounce">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">Pedido Enviado com Sucesso!</h3>
          <p className="text-xs text-slate-400 mt-1">A comanda já foi enviada para a impressora da cozinha.</p>
        </div>
      )}

      {/* Item Notes Modal */}
      {activeItemForNotes && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-xs w-full p-5 border border-slate-800 shadow-2xl">
            <h4 className="text-sm font-extrabold text-white mb-1">Adicionar Observação</h4>
            <p className="text-xs text-amber-400 font-bold mb-3">{activeItemForNotes.name}</p>

            <textarea
              value={tempNotes}
              onChange={e => setTempNotes(e.target.value)}
              placeholder="Ex: Sem cebola, ponto bem passado, gelo e limão..."
              className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-amber-400 outline-none h-24 mb-4"
            />

            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => setActiveItemForNotes(null)}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleNotesSave}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
