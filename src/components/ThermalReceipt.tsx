import React from 'react';
import { PrintJob } from '../types';

interface ThermalReceiptProps {
  job: PrintJob | null;
  storeName?: string;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ job, storeName = "Rancheiro's Bar" }) => {
  if (!job) return null;

  // Safe price calculation
  const getItemPrice = (price?: number) => {
    const p = Number(price);
    return isNaN(p) ? 0 : p;
  };

  const total = job.items.reduce((sum, item) => {
    return sum + (getItemPrice(item.price) * item.quantity);
  }, 0);

  const formattedDate = new Date(job.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ' - ' + new Date(job.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const getDestinationTitle = (dest: string) => {
    switch (dest) {
      case 'KITCHEN': return 'VIA DE PRODUÇÃO / COMANDA';
      case 'BAR': return 'VIA DO BAR';
      case 'DESSERT': return 'VIA DA SOBREMESA';
      default: return `VIA DE ${dest.toUpperCase()}`;
    }
  };

  return (
    <div id="thermal-receipt-printable" className="hidden print:block font-sans text-black p-1 max-w-[72mm] mx-auto text-[12px] leading-tight bg-white">
      {/* Header */}
      <div className="text-center font-bold">
        <div className="text-sm font-extrabold">{storeName}</div>
        <div className="text-[12px] font-black uppercase mt-0.5">{getDestinationTitle(job.destination)}</div>
        <div className="text-[10px] font-normal text-gray-800">{formattedDate}</div>
      </div>

      {/* Table & Order Row */}
      <div className="flex justify-between items-center font-bold text-[13px] py-1 border-t border-b border-black my-1">
        <span className="uppercase">{job.tableName}</span>
        <span>Senha #{job.orderNumber}</span>
      </div>

      {/* Waiter */}
      {job.waiterName && (
        <div className="text-center text-[11px] font-medium my-0.5">
          Garçom: <strong className="font-bold">{job.waiterName}</strong>
        </div>
      )}

      {/* Table Header */}
      <div className="flex justify-between font-bold text-[11px] border-b border-dashed border-black pb-0.5 mb-1 mt-1">
        <span>QTD ITENS</span>
        <span>TOTAL</span>
      </div>

      {/* Items List */}
      <div className="space-y-1 mb-1">
        {job.items.map((item, idx) => {
          const itemPrice = getItemPrice(item.price);
          const itemTotal = itemPrice * item.quantity;
          return (
            <div key={idx} className="text-[12px]">
              <div className="flex justify-between font-medium">
                <span>
                  <strong className="font-bold">{item.quantity}x</strong> {item.name}
                </span>
                <span>
                  {itemPrice > 0 ? `R$ ${itemTotal.toFixed(2).replace('.', ',')}` : '---'}
                </span>
              </div>
              {item.notes && (
                <div className="text-[10px] font-bold text-black pl-2 mt-0.5 uppercase">
                  * OBS: {item.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total section (if prices exist) */}
      {total > 0 && (
        <div className="text-right font-bold text-[12px] border-t border-dashed border-black pt-1 mb-1">
          TOTAL: R$ {total.toFixed(2).replace('.', ',')}
        </div>
      )}

      {/* Footer */}
      <div className="text-center border-t border-dashed border-black pt-1 mt-1 text-[10px] text-gray-700 space-y-0.5">
        <div>Rancheiro's Bar • Chopp & Petiscos</div>
        <div>Rua Pres. Café Filho, 355 - Vila Almeida</div>
      </div>
    </div>
  );
};
