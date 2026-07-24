import React, { useState } from 'react';
import { LayoutGrid, Smartphone, ChefHat, Receipt, BarChart3, UtensilsCrossed, RefreshCw, Printer, Share2, Check } from 'lucide-react';

export type AppMode = 'TABLES' | 'MOBILE_ORDER' | 'KITCHEN' | 'CHECKOUT' | 'REPORTS' | 'PRODUCTS';

interface HeaderProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  pendingKitchenCount: number;
  onResetDemo: () => void;
  isSyncing: boolean;
  onOpenPrinterModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  pendingKitchenCount,
  onResetDemo,
  isSyncing,
  onOpenPrinterModal
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyMobileUrl = () => {
    const mobileUrl = `${window.location.origin}${window.location.pathname}?mode=mobile`;
    navigator.clipboard.writeText(mobileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const navItems = [
    { id: 'TABLES' as AppMode, label: 'Mesas & Salão', icon: LayoutGrid },
    { id: 'MOBILE_ORDER' as AppMode, label: 'Lançar Pedido (Celular)', icon: Smartphone, highlight: true },
    { id: 'KITCHEN' as AppMode, label: 'Tela Cozinha (KDS)', icon: ChefHat, badge: pendingKitchenCount },
    { id: 'CHECKOUT' as AppMode, label: 'Caixa & Fechamento', icon: Receipt },
    { id: 'REPORTS' as AppMode, label: 'Vendas & Relatórios', icon: BarChart3 },
    { id: 'PRODUCTS' as AppMode, label: 'Cardápio & Preços', icon: UtensilsCrossed },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800 sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Status */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2 rounded-xl text-slate-950 font-black flex items-center justify-center shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-wider text-amber-400 uppercase">RANCHEIRO'S <span className="text-white">BAR</span></span>
                <span className="bg-amber-400/10 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/20 uppercase tracking-wider hidden sm:inline-block">
                  Chopp & Petiscos
                </span>
              </div>
              <div className="flex items-center text-[11px] text-slate-400 space-x-2">
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
                <span className="truncate max-w-[220px] sm:max-w-none">Rua Pres. Café Filho, 355 - Vila Almeida</span>
              </div>
            </div>
          </div>

          {/* Quick Actions / Printer Status & Mobile Link */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyMobileUrl}
              className="flex items-center space-x-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/30 transition"
              title="Copiar URL direta do garçom para abrir no celular"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span className="font-bold">{copiedLink ? 'Link Copiado!' : 'Link p/ Celular'}</span>
            </button>

            <button
              onClick={onOpenPrinterModal}
              className="hidden md:flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Fila de Impressão de Comandas"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Impressora</span>
            </button>

            <button
              onClick={onResetDemo}
              className="flex items-center space-x-1 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
              title="Restaurar dados iniciais para testes"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : item.highlight
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-red-500 text-white animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
