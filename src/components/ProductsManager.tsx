import React, { useState } from 'react';
import { Product, PrintDestination } from '../types';
import { Plus, Search, Edit2, Trash2, Check, X, Utensils, Printer } from 'lucide-react';

interface ProductsManagerProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Lanches');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [available, setAvailable] = useState(true);
  const [printDestination, setPrintDestination] = useState<PrintDestination>('KITCHEN');

  const categories = ['TODOS', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleResetForm = () => {
    setName('');
    setCategory('Lanches');
    setPrice('');
    setDescription('');
    setAvailable(true);
    setPrintDestination('KITCHEN');
    setEditingProductId(null);
    setShowAddModal(false);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price);
    setDescription(product.description);
    setAvailable(product.available);
    setPrintDestination(product.printDestination);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '') return;

    if (editingProductId) {
      onUpdateProduct(editingProductId, {
        name,
        category,
        price: Number(price),
        description,
        available,
        printDestination
      });
    } else {
      onAddProduct({
        name,
        category,
        price: Number(price),
        description,
        available,
        printDestination
      });
    }

    handleResetForm();
  };

  const [serviceFeeEnabled, setServiceFeeEnabled] = useState<boolean>(() => localStorage.getItem('defaultServiceFeeEnabled') === 'true');
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCatNewName, setEditingCatNewName] = useState('');

  const categoriesList: string[] = Array.from<string>(new Set(products.map(p => (p.category || 'Geral'))));

  const toggleServiceFee = (enabled: boolean) => {
    setServiceFeeEnabled(enabled);
    localStorage.setItem('defaultServiceFeeEnabled', enabled ? 'true' : 'false');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      setCategory(newCatName.trim());
      setNewCatName('');
      setShowCategoryManager(false);
      window.location.reload();
    } catch (err) {
      alert('Erro ao criar categoria.');
    }
  };

  const handleRenameCategory = async (oldName: string) => {
    if (!editingCatNewName.trim() || editingCatNewName.trim() === oldName) {
      setEditingCategory(null);
      return;
    }

    try {
      await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: editingCatNewName.trim() })
      });
      setEditingCategory(null);
      setEditingCatNewName('');
      window.location.reload();
    } catch (err) {
      alert('Erro ao redefinir nome da categoria.');
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (confirm(`Deseja remover a categoria "${catName}"? Os produtos vinculados a ela passarão para a categoria "Geral".`)) {
      try {
        await fetch(`/api/categories/${encodeURIComponent(catName)}`, {
          method: 'DELETE'
        });
        window.location.reload();
      } catch (err) {
        alert('Erro ao excluir categoria.');
      }
    }
  };

  const handleClearSalesData = async () => {
    if (confirm('Atenção: Deseja realmente excluir todas as vendas, comandas e relatórios fictícios? O cardápio de produtos será mantido.')) {
      try {
        const res = await fetch('/api/admin/clear-sales', { method: 'POST' });
        if (res.ok) {
          setClearStatus('Vendas e histórico fictícios limpos com sucesso!');
          setTimeout(() => setClearStatus(null), 3000);
          window.location.reload();
        }
      } catch (err) {
        alert('Erro ao limpar vendas fictícias.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* System Settings & Administrative Panel */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-amber-400 uppercase tracking-wider">Painel Administrativo & Configurações</h3>
            <p className="text-xs text-slate-400">Ajustes gerais do sistema de caixa e atendimento.</p>
          </div>
          {clearStatus && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
              {clearStatus}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Service Fee Default Setting */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="pr-2">
              <span className="font-extrabold text-white block">Taxa de Serviço (10%) por Padrão</span>
              <span className="text-[11px] text-slate-400">
                {serviceFeeEnabled ? 'Ativada por padrão no caixa.' : 'Desativada por padrão (recomendado se não cobra taxa).'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={serviceFeeEnabled}
                onChange={e => toggleServiceFee(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Clear Sales History */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="pr-2">
              <span className="font-extrabold text-white block">Limpar Histórico & Vendas Fictícias</span>
              <span className="text-[11px] text-slate-400">Zera todas as vendas/comandas e libera as mesas.</span>
            </div>
            <button
              onClick={handleClearSalesData}
              className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold px-3.5 py-2 rounded-xl border border-red-500/30 transition text-xs whitespace-nowrap"
            >
              Zerar Vendas
            </button>
          </div>
        </div>

        {/* Categories Manager List */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-extrabold text-amber-400 text-xs block uppercase tracking-wider">Gerenciar Categorias do Cardápio</span>
              <span className="text-[11px] text-slate-400">Crie, renomeie ou exclua categorias do sistema ({categoriesList.length} ativas).</span>
            </div>
            <button
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className="bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 transition text-xs"
            >
              {showCategoryManager ? 'Ocultar' : '+ Nova Categoria'}
            </button>
          </div>

          {showCategoryManager && (
            <form onSubmit={handleAddCategory} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Nome da nova categoria (ex: Sucos Naturais)..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs"
              >
                Adicionar
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {categoriesList.map(cat => (
              <div key={cat} className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2 text-xs">
                {editingCategory === cat ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={editingCatNewName}
                      onChange={e => setEditingCatNewName(e.target.value)}
                      className="bg-slate-950 text-white text-xs px-2 py-1 rounded border border-amber-400 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameCategory(cat)}
                      className="text-emerald-400 hover:text-emerald-300 font-bold px-1"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="text-slate-400 hover:text-white px-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-slate-200">{cat}</span>
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setEditingCatNewName(cat);
                      }}
                      className="text-slate-400 hover:text-amber-400 text-[11px] font-medium ml-1"
                      title="Renomear Categoria"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-slate-500 hover:text-red-400 text-[11px] font-medium ml-1"
                      title="Excluir Categoria"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <Utensils className="w-5 h-5 text-amber-500" />
            <span>Gerenciamento de Cardápio & Preços</span>
          </h2>
          <p className="text-xs text-slate-500">Cadastre produtos, altere valores, disponibilidade e impressora de destino.</p>
        </div>

        <button
          onClick={() => {
            handleResetForm();
            setShowAddModal(true);
          }}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 flex-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar item..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Products Table/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className={`p-4 rounded-2xl border transition-all ${
              product.available ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200/60 opacity-60'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] bg-slate-100 font-bold text-slate-600 uppercase px-2 py-0.5 rounded-full border border-slate-200">
                  {product.category}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-1">{product.name}</h3>
              </div>
              <span className="text-base font-black text-amber-600">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{product.description}</p>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateProduct(product.id, { available: !product.available })}
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    product.available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.available ? '● Disponível' : '● Esgotado'}
                </button>

                <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">
                  {product.printDestination === 'KITCHEN' ? 'Cozinha' : product.printDestination === 'BAR' ? 'Bar' : 'Sobremesa'}
                </span>
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                  title="Editar produto"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Excluir o produto ${product.name}?`)) {
                      onDeleteProduct(product.id);
                    }
                  }}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition"
                  title="Excluir produto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">
              {editingProductId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: X-Salada Especial"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    placeholder="Lanches, Bebidas, Porções..."
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="29.90"
                    value={price}
                    onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  placeholder="Ingredientes e detalhes..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destino de Impressão</label>
                  <select
                    value={printDestination}
                    onChange={e => setPrintDestination(e.target.value as PrintDestination)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                  >
                    <option value="KITCHEN">Cozinha</option>
                    <option value="BAR">Bar / Bebidas</option>
                    <option value="DESSERT">Sobremesas</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="avail-check"
                    checked={available}
                    onChange={e => setAvailable(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <label htmlFor="avail-check" className="font-bold text-slate-700 cursor-pointer">
                    Disponível no menu
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold px-5 py-2 rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
