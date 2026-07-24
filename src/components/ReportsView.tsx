import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Calendar, QrCode, CreditCard, Banknote, Award, Download, RefreshCw } from 'lucide-react';
import { PaymentMethod } from '../types';

interface ReportsViewProps {
  onRefreshData?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = () => {
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<'DAILY' | 'MONTHLY' | 'PRODUCTS'>('DAILY');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reports/summary');
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (isLoading || !reportData) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">Carregando dados financeiros e relatórios de vendas...</p>
      </div>
    );
  }

  const { today, monthly, dailyChart, topProducts, recentTransactions } = reportData;

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span>Relatório Financeiro & Métricas de Vendas</span>
          </h2>
          <p className="text-xs text-slate-500">Acompanhe faturamento diário, mensal, formas de pagamento e produtos de maior saída.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchReports}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Imprimir Resumo</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden border border-slate-800">
          <div className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">Vendas Hoje</div>
          <div className="text-2xl font-black text-white">R$ {today.revenue.toFixed(2).replace('.', ',')}</div>
          <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
            <span>{today.ordersCount} comandas encerradas</span>
            <span>TM: R$ {today.averageTicket.toFixed(2).replace('.', ',')}</span>
          </div>
          <DollarSign className="w-16 h-16 absolute -right-3 -bottom-3 text-amber-500/10 pointer-events-none" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Faturamento Mensal</div>
          <div className="text-2xl font-black text-slate-900">R$ {monthly.totalRevenue.toFixed(2).replace('.', ',')}</div>
          <div className="text-[11px] text-slate-500 mt-2">
            <span>{monthly.ordersCount} vendas no total de 30 dias</span>
          </div>
          <Calendar className="w-16 h-16 absolute -right-3 -bottom-3 text-slate-200/50 pointer-events-none" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Ticket Médio Geral</div>
          <div className="text-2xl font-black text-slate-900">R$ {monthly.averageTicket.toFixed(2).replace('.', ',')}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-2">
            <span>Médio por mesa encerrada</span>
          </div>
          <ShoppingBag className="w-16 h-16 absolute -right-3 -bottom-3 text-slate-200/50 pointer-events-none" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Forma Predominante (Hoje)</div>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
            <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100 text-emerald-800">
              <span className="block text-[10px] text-emerald-600 font-bold">PIX</span>
              <span>R$ {today.byPayment.PIX.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100 text-blue-800">
              <span className="block text-[10px] text-blue-600 font-bold">Crédito</span>
              <span>R$ {today.byPayment.CREDIT.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart (30 Days) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Evolução de Vendas Diárias (Últimos 30 dias)</h3>
            <p className="text-xs text-slate-500">Histórico dia a dia de faturamento acumulado em Reais (R$)</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyChart}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={val => `R$${val}`} />
              <Tooltip
                formatter={(val: any) => [`R$ ${Number(val).toFixed(2).replace('.', ',')}`, 'Faturamento']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Section: Top Products & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-base">Produtos Mais Vendidos</h3>
          </div>

          <div className="space-y-3">
            {topProducts.map((prod: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{prod.name}</span>
                    <span className="text-[11px] text-slate-500">{prod.qty} unidades vendidas</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-xs text-slate-900 block">R$ {prod.revenue.toFixed(2).replace('.', ',')}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Faturamento gerado</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-base mb-4">Últimas Vendas Encerradas</h3>
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {recentTransactions.map((tx: any) => (
              <div key={tx.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span>{tx.tableName}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 rounded font-mono">{tx.paymentMethod}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Garçom: {tx.waiterName} • {new Date(tx.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="text-right font-black text-slate-900 text-sm">
                  R$ {tx.total.toFixed(2).replace('.', ',')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
