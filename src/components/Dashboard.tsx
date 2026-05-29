'use client';

import React, { useEffect, useRef } from 'react';
import { useBinStore } from '@/store/useBinStore';
import { mqttService } from '@/services/mqttService';
import BinCard from './BinCard';
import toast, { Toaster } from 'react-hot-toast';
import { ShieldAlert, Info } from 'lucide-react';

export default function Dashboard() {
  const { bins, checkTimeouts, setNetworkConnected, mqttConnected } = useBinStore();
  const criticalTracker = useRef<Set<string>>(new Set());

  // 1. Efeito para registrar monitoramento de timeouts e rede local
  useEffect(() => {
    // Escuta estado de rede física do navegador
    const handleOnline = () => setNetworkConnected(true);
    const handleOffline = () => setNetworkConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Conecta ao broker MQTT no client-side
    mqttService.connect();

    // Roda verificação de inatividade de lixeiras a cada 3 segundos
    const timeoutInterval = setInterval(() => {
      checkTimeouts();
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timeoutInterval);
      mqttService.disconnect();
    };
  }, [checkTimeouts, setNetworkConnected]);

  // 2. Efeito para lançar Toasts/Popups ao vivo quando lixeiras entram em estado crítico (>=90%)
  useEffect(() => {
    const binList = Object.values(bins);
    
    binList.forEach((bin) => {
      // Apenas notifica se estiver online e em estado crítico
      if (bin.isOnline && bin.nivel >= 90) {
        if (!criticalTracker.current.has(bin.id)) {
          criticalTracker.current.add(bin.id);
          
          // Dispara o Toast vermelho customizado
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-rose-500/20 border-l-4 border-rose-500 p-4 transition-all duration-300`}
            >
              <div className="flex-1 w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5 text-rose-500">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      Coleta Necessária!
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      A <span className="font-bold text-slate-700">{bin.id}</span> atingiu o estado crítico de preenchimento ({Math.round(bin.nivel)}%).
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-slate-100 pl-3">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-2 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  Fechar
                </button>
              </div>
            </div>
          ), { duration: 6000, position: 'top-right' });
        }
      } else {
        // Se desceu do limite crítico ou foi esvaziada, remove do rastreador para permitir novos avisos futuros
        if (criticalTracker.current.has(bin.id) && bin.nivel < 90) {
          criticalTracker.current.delete(bin.id);
        }
      }
    });

    // Remove do rastreador lixeiras excluídas da store
    const currentIds = new Set(binList.map((b) => b.id));
    criticalTracker.current.forEach((id) => {
      if (!currentIds.has(id)) {
        criticalTracker.current.delete(id);
      }
    });
  }, [bins]);

  const binList = Object.values(bins);

  return (
    <div className="space-y-8">
      {/* Container do Toast */}
      <Toaster />

      {/* Seção das Lixeiras */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-md font-bold text-slate-800 uppercase tracking-wide">Status em Tempo Real</h2>
            <p className="text-xs text-slate-500">Detecção automatizada de dispositivos transmitindo no tópico base</p>
          </div>
          
          <span className="text-xs text-slate-400 font-medium">
            {binList.length} lixeira{binList.length !== 1 ? 's' : ''} detectada{binList.length !== 1 ? 's' : ''}
          </span>
        </div>

        {binList.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Aguardando sinais MQTT...</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Não há lixeiras ativas transmitindo telemetria no momento. Ative o painel de simulação abaixo para rodar o mock ou publique dados no tópico.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {binList.map((bin) => (
              <BinCard key={bin.id} bin={bin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
