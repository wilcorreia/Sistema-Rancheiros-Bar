import React, { useState } from 'react';
import { Table, Order, PaymentMethod } from '../types';
import { Receipt, DollarSign, Users, Percent, Check, Printer, CreditCard, QrCode, Banknote } from 'lucide-react';

interface CheckoutModalProps {
  table: Table & { activeOrders: Order[]; currentTotal: number };
  onClose: () => void;
  onConfirmCheckout: (checkoutData: {
    tableId: string;
    paymentMethod: PaymentMethod;
    serviceFee: number;
    discount: number;
    waiterName: string;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  table,
  onClose,
  onConfirmCheckout
}) => {
  const subtotal = table.currentTotal || 0;
  const activeOrders = table.activeOrders || [];
  const customerName = activeOrders.find(o => o.customerName)?.customerName;
  const [includeServiceFee, setIncludeServiceFee] = useState<boolean>(() => localStorage.getItem('defaultServiceFeeEnabled') === 'true');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [splitCount, setSplitCount] = useState<number>(table.customerCount || 1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);

  const serviceFee = includeServiceFee ? Math.round((subtotal * 0.1) * 100) / 100 : 0;
  const finalTotal = Math.max(0, subtotal + serviceFee - discountAmount);
  const perPersonAmount = splitCount > 0 ? finalTotal / splitCount : finalTotal;

  // Flatten all items across active orders for itemized bill, consolidated by name
  const consolidatedItems = activeOrders.flatMap(o => o.items || []).reduce((acc: any[], item) => {
    const price = Number(item.price) || 0;
    const existing = acc.find(i => i.name === item.name && (i.notes || '') === (item.notes || ''));
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({ ...item, price });
    }
    return acc;
  }, []);

  const handleFinishPayment = async () => {
    setIsProcessing(true);
    try {
      await onConfirmCheckout({
        tableId: table.id,
        paymentMethod,
        serviceFee,
        discount: discountAmount,
        waiterName: table.waiter || 'Atendente'
      });
      setCompletedReceipt({
        tableName: table.name,
        waiterName: table.waiter || 'Atendente',
        customerName: customerName,
        subtotal,
        serviceFee,
        discountAmount,
        finalTotal,
        paymentMethod,
        splitCount,
        perPersonAmount,
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' - ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        items: consolidatedItems
      });
    } catch (err) {
      alert('Erro ao processar pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintCustomerBill = () => {
    window.print();
  };

  // Receipt data structure for print (works both before & after payment confirmation)
  const printData = completedReceipt || {
    tableName: table.name,
    waiterName: table.waiter || 'Atendente',
    customerName: customerName,
    subtotal,
    serviceFee,
    discountAmount,
    finalTotal,
    paymentMethod,
    date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' - ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    items: consolidatedItems
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col border border-slate-200">
        {!completedReceipt ? (
          <>
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-slate-900 text-amber-400 rounded-2xl font-black">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Fechamento de Conta - {table.name}</h3>
                  <p className="text-xs text-slate-500">
                    Garçom: {table.waiter || 'Não informado'}
                    {customerName && <span className="ml-2 font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">Cliente: {customerName}</span>}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto py-4 space-y-5 flex-1 text-xs">
              {/* Itemized Bill List */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Itens Consumidos</h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {consolidatedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-800">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-mono font-semibold">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adjustments: Service Fee & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                  <div className="flex items-center space-x-2">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800">Taxa de Serviço (10%)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeServiceFee}
                    onChange={e => setIncludeServiceFee(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-700">Desconto (R$)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded-lg p-1 text-right font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Split Bill Calculator */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs">Dividir Conta</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                      className="bg-slate-800 hover:bg-slate-700 w-7 h-7 rounded-lg font-bold flex items-center justify-center text-slate-200"
                    >
                      -
                    </button>
                    <span className="font-black text-sm px-2">{splitCount} pss</span>
                    <button
                      onClick={() => setSplitCount(splitCount + 1)}
                      className="bg-slate-800 hover:bg-slate-700 w-7 h-7 rounded-lg font-bold flex items-center justify-center text-slate-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                {splitCount > 1 && (
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-amber-400 font-bold">
                    <span>Valor por Pessoa:</span>
                    <span className="text-base font-black">R$ {perPersonAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'PIX' as PaymentMethod, label: 'PIX', icon: QrCode },
                    { id: 'CREDIT' as PaymentMethod, label: 'Crédito', icon: CreditCard },
                    { id: 'DEBIT' as PaymentMethod, label: 'Débito', icon: CreditCard },
                    { id: 'CASH' as PaymentMethod, label: 'Dinheiro', icon: Banknote },
                  ].map(method => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-2xl font-bold flex flex-col items-center space-y-1.5 transition border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-100 p-4 rounded-2xl space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {includeServiceFee && (
                  <div className="flex justify-between text-amber-700">
                    <span>Taxa de Serviço (10%):</span>
                    <span className="font-mono">+ R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Desconto:</span>
                    <span className="font-mono">- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                  <span>TOTAL FINAL:</span>
                  <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
              <button
                type="button"
                onClick={handlePrintCustomerBill}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Fechamento</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleFinishPayment}
                  disabled={isProcessing}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isProcessing ? 'PROCESSANDO...' : 'CONFIRMAR E RECEBER'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Receipt Completed Screen */
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900">Pagamento Concluído!</h3>
            <p className="text-xs text-slate-500">
              A {completedReceipt.tableName} foi encerrada com sucesso no caixa.
            </p>

            <div className="flex justify-center space-x-3 pt-4">
              <button
                onClick={handlePrintCustomerBill}
                className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs px-5 py-3 rounded-xl flex items-center space-x-2 shadow-lg"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimir Recibo / Fechamento</span>
              </button>

              <button
                onClick={onClose}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-6 py-3 rounded-xl"
              >
                Concluir
              </button>
            </div>
          </div>
        )}

        {/* Printable Customer Thermal Bill / Receipt */}
        <div id="customer-printable-receipt" className="hidden print:block font-sans text-black p-1 max-w-[72mm] mx-auto text-[12px] leading-tight bg-white">
          {/* Header */}
          <div className="text-center font-bold">
            <div className="text-sm font-extrabold text-black">Rancheiro's Bar</div>
            <div className="text-xs font-bold uppercase text-black mt-0.5">VIA DE FECHAMENTO</div>
            <div className="text-[10px] font-normal text-slate-700">{printData.date}</div>
          </div>

          {/* Table / Location Row */}
          <div className="flex justify-between items-center font-bold text-[13px] py-1 border-t border-b border-black my-1 text-black">
            <span className="uppercase">{printData.tableName}</span>
            <span>Garçom: {printData.waiterName}</span>
          </div>

          {printData.customerName && (
            <div className="text-center text-[12px] font-black uppercase my-0.5 py-0.5 border-b border-black text-black">
              Cliente: {printData.customerName}
            </div>
          )}

          {/* Table Header */}
          <div className="flex justify-between font-bold text-[11px] border-b border-dashed border-black pb-0.5 mb-1 text-black">
            <span>QTD ITENS</span>
            <span>TOTAL</span>
          </div>

          {/* Items List */}
          <div className="space-y-1 my-1 text-black">
            {printData.items.map((it: any, i: number) => {
              const itemPrice = Number(it.price) || 0;
              const itemTotal = itemPrice * it.quantity;
              return (
                <div key={i} className="text-[12px]">
                  <div className="flex justify-between font-medium">
                    <span>
                      <strong className="font-bold">{it.quantity}x</strong> {it.name}
                    </span>
                    <span>
                      {itemPrice > 0 ? `R$ ${itemTotal.toFixed(2).replace('.', ',')}` : '---'}
                    </span>
                  </div>
                  {it.notes && (
                    <div className="text-[10px] font-bold text-black pl-2 mt-0.5 uppercase">
                      * OBS: {it.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total Items Line */}
          <div className="text-right font-bold text-[12px] border-t border-dashed border-black pt-1 mb-1 text-black">
            TOTAL: R$ {printData.subtotal.toFixed(2).replace('.', ',')}
          </div>

          {/* Consumo Total Section */}
          <div className="border-t border-dashed border-black pt-1 mt-1 text-black">
            <div className="font-bold text-[11px] uppercase mb-0.5">Consumo Total</div>
            <div className="flex justify-between text-[11px]">
              <span>Valor dos Itens</span>
              <span>R$ {printData.subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            {printData.serviceFee > 0 && (
              <div className="flex justify-between text-[11px]">
                <span>Taxa de Serviço (10%)</span>
                <span>R$ {printData.serviceFee.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            {printData.discountAmount > 0 && (
              <div className="flex justify-between text-[11px]">
                <span>Desconto</span>
                <span>- R$ {printData.discountAmount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-[13px] mt-1 pt-1 border-t border-black">
              <span>TOTAL A PAGAR</span>
              <span>R$ {printData.finalTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            {completedReceipt && (
              <div className="flex justify-between text-[10px] mt-1 pt-0.5 text-slate-700">
                <span>Forma de Pagamento</span>
                <span className="font-bold">{printData.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center border-t border-dashed border-black pt-1.5 mt-2 text-[10px] text-slate-700 space-y-0.5">
            <div>Rancheiro's Bar • Chopp & Petiscos</div>
            <div>Rua Pres. Café Filho, 355 - Vila Almeida</div>
            <div>Delivery / Whats: (67) 99820-5749</div>
          </div>
        </div>
      </div>
    </div>
  );
};
