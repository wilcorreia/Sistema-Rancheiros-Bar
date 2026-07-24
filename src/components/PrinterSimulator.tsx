import React, { useState } from 'react';
import { PrintJob } from '../types';
import { Printer, CheckCircle, Clock, Trash2, Eye } from 'lucide-react';

interface PrinterSimulatorProps {
  printJobs: PrintJob[];
  onClose: () => void;
  onPrintJob: (job: PrintJob) => void;
  onMarkPrinted: (jobId: string) => void;
}

export const PrinterSimulator: React.FC<PrinterSimulatorProps> = ({
  printJobs,
  onClose,
  onPrintJob,
  onMarkPrinted
}) => {
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(printJobs[0] || null);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col border border-slate-800">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-black">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Central de Impressão de Comandas</h3>
              <p className="text-xs text-slate-400">Fila de impressão térmica para Cozinha e Bar (80mm / 58mm)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold p-1">
            ✕
          </button>
        </div>

        {/* Body content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 overflow-y-auto flex-1">
          {/* Print Jobs Queue */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fila de Cupons ({printJobs.length})</h4>
            {printJobs.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 bg-slate-950 rounded-xl text-center border border-slate-800">
                Nenhum cupom pendente na fila.
              </p>
            ) : (
              printJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between text-xs ${
                    selectedJob?.id === job.id
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center space-x-2">
                      <span>{job.tableName}</span>
                      <span className="text-[10px] bg-slate-800 text-amber-400 font-mono px-1.5 rounded">#{job.orderNumber}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Destino: {job.destination} • {new Date(job.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    job.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {job.status === 'PENDING' ? 'Pendente' : 'Impresso'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Ticket Preview Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pré-visualização Térmica (80mm)</h4>
              {selectedJob ? (
                <div className="bg-white text-black p-3 font-sans text-[11px] leading-tight shadow-md max-w-[210px] mx-auto text-left space-y-1">
                  <div className="text-center font-bold">
                    <div className="text-xs font-extrabold">Rancheiro's Bar</div>
                    <div className="text-[10px] font-bold uppercase mt-0.5">
                      {selectedJob.destination === 'KITCHEN' ? 'VIA DA COZINHA' : selectedJob.destination === 'BAR' ? 'VIA DO BAR' : `VIA DE ${selectedJob.destination}`}
                    </div>
                    <div className="text-[9px] font-normal text-gray-600">
                      {new Date(selectedJob.createdAt).toLocaleDateString('pt-BR')} - {new Date(selectedJob.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center font-bold text-[11px] py-0.5 border-t border-b border-black my-1">
                    <span className="uppercase">{selectedJob.tableName}</span>
                    <span>Senha #{selectedJob.orderNumber}</span>
                  </div>

                  {selectedJob.customerName && (
                    <div className="text-center text-[10px] font-extrabold uppercase my-0.5 py-0.5 bg-gray-100 border border-black rounded">
                      Cliente: {selectedJob.customerName}
                    </div>
                  )}

                  <div className="text-center text-[10px] font-medium">
                    Garçom: <strong className="font-bold">{selectedJob.waiterName}</strong>
                  </div>

                  <div className="flex justify-between font-bold text-[10px] border-b border-dashed border-black pb-0.5 mt-1">
                    <span>QTD ITENS</span>
                    <span>TOTAL</span>
                  </div>

                  <div className="space-y-1 my-1">
                    {selectedJob.items.map((item, idx) => {
                      const p = Number(item.price) || 0;
                      return (
                        <div key={idx} className="text-[11px]">
                          <div className="flex justify-between font-medium">
                            <span>
                              <strong className="font-bold">{item.quantity}x</strong> {item.name}
                            </span>
                            <span>{p > 0 ? `R$ ${(p * item.quantity).toFixed(2).replace('.', ',')}` : '---'}</span>
                          </div>
                          {item.notes && (
                            <div className="text-[9px] font-bold text-black pl-2 uppercase">
                              * OBS: {item.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-right font-bold text-[11px] border-t border-dashed border-black pt-1">
                    TOTAL: R$ {selectedJob.items.reduce((s, i) => s + ((Number(i.price) || 0) * i.quantity), 0).toFixed(2).replace('.', ',')}
                  </div>

                  <div className="text-center border-t border-dashed border-black pt-1 mt-1 text-[9px] text-gray-500">
                    <div>Rancheiro's Bar • Chopp & Petiscos</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">Selecione um cupom para visualizar.</p>
              )}
            </div>

            {selectedJob && (
              <div className="pt-4 border-t border-slate-800 flex space-x-2">
                <button
                  onClick={() => {
                    onPrintJob(selectedJob);
                    onMarkPrinted(selectedJob.id);
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Agora</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
