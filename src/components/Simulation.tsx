'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBinStore } from '@/store/useBinStore';
import { mqttService } from '@/services/mqttService';
import { Play, Pause, Plus, Trash2, Send, Sliders, RefreshCw } from 'lucide-react';

interface SimulatedBin {
  id: string;
  nivel: number;
  rate: number; // % increase per step
}

export default function Simulation() {
  const { simulationActive, mqttConnected, updateBin } = useBinStore();
  const [simulatedBins, setSimulatedBins] = useState<SimulatedBin[]>([
    { id: 'Lixeira-01', nivel: 45, rate: 1.5 },
    { id: 'Lixeira-02', nivel: 82, rate: 3.0 },
    { id: 'Lixeira-03', nivel: 15, rate: 0.5 },
  ]);

  const [newBinId, setNewBinId] = useState('');
  const [newBinRate, setNewBinRate] = useState(1);
  const [sendIntervalMs, setSendIntervalMs] = useState(5000); // Send data every 5 seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Efeito principal do loop de simulação
  useEffect(() => {
    if (simulationActive) {
      // Executa o primeiro envio imediatamente
      sendTelemetry();

      // Configura o intervalo
      intervalRef.current = setInterval(() => {
        // Atualiza os níveis e envia telemetria
        setSimulatedBins((prevBins) => {
          const nextBins = prevBins.map((bin) => {
            let nextNivel = bin.nivel + bin.rate;
            // Se passar de 100%, reseta para 0% (esvaziamento) após um tempo ou trava em 100%
            if (nextNivel > 100) {
              nextNivel = 0; // Esvaziou e recomeçou
            }
            return {
              ...bin,
              nivel: parseFloat(nextNivel.toFixed(1))
            };
          });
          
          return nextBins;
        });
      }, sendIntervalMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [simulationActive, sendIntervalMs]);

  // Efeito secundário para disparar os envios sempre que os bins simulados atualizarem
  useEffect(() => {
    if (simulationActive && simulatedBins.length > 0) {
      sendTelemetry();
    }
  }, [simulatedBins, simulationActive]);

  // Função para despachar mensagens MQTT ou atualizar localmente
  const sendTelemetry = () => {
    simulatedBins.forEach((bin) => {
      const timestamp = new Date().toISOString();
      const payload = JSON.stringify({
        id: bin.id,
        nivel: Math.round(bin.nivel),
        timestamp: timestamp
      });

      const topic = `mackenzie/mrs/nivel/${bin.id}`;

      if (mqttConnected) {
        // Envia mensagem real via MQTT WebSocket para o broker
        mqttService.publish(topic, payload);
      } else {
        // Se estiver offline do broker, atualiza o Zustand diretamente para permitir teste offline
        updateBin(bin.id, bin.nivel, timestamp);
      }
    });
  };

  const handleAddBin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBinId.trim()) return;
    
    // Evita duplicados na simulação
    if (simulatedBins.some((b) => b.id.toLowerCase() === newBinId.trim().toLowerCase())) {
      alert('Esta lixeira já está na lista de simulação.');
      return;
    }

    setSimulatedBins((prev) => [
      ...prev,
      {
        id: newBinId.trim(),
        nivel: Math.floor(Math.random() * 50) + 10, // 10% a 60% inicial
        rate: parseFloat(newBinRate.toString())
      }
    ]);
    setNewBinId('');
  };

  const handleRemoveSimulatedBin = (id: string) => {
    setSimulatedBins((prev) => prev.filter((b) => b.id !== id));
  };

  const handleNivelChange = (id: string, newNivel: number) => {
    setSimulatedBins((prev) =>
      prev.map((b) => (b.id === id ? { ...b, nivel: newNivel } : b))
    );
  };

  const forceSingleSend = (bin: SimulatedBin) => {
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({
      id: bin.id,
      nivel: Math.round(bin.nivel),
      timestamp: timestamp
    });
    const topic = `mackenzie/mrs/nivel/${bin.id}`;

    if (mqttConnected) {
      const success = mqttService.publish(topic, payload);
      if (success) {
        console.log(`Forced publish to ${topic}: ${payload}`);
      }
    } else {
      updateBin(bin.id, bin.nivel, timestamp);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            Painel de Simulação MQTT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mqttConnected 
              ? 'Publicando dados reais no Broker MQTT (HiveMQ)' 
              : 'MQTT Desconectado. Atualizando estado local do Dashboard.'}
          </p>
        </div>
        
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
          simulationActive 
            ? 'bg-indigo-50 text-indigo-700 animate-pulse border border-indigo-200' 
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {simulationActive ? 'Simulador Ativo' : 'Simulador Inativo'}
        </span>
      </div>

      {/* Formulário para Adicionar Lixeira na Simulação */}
      <form onSubmit={handleAddBin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nome/ID da Lixeira</label>
          <input
            type="text"
            placeholder="Ex: Lixeira-04"
            value={newBinId}
            onChange={(e) => setNewBinId(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Taxa de Enchimento (%/ciclo)</label>
          <input
            type="number"
            step="0.1"
            min="-10"
            max="20"
            value={newBinRate}
            onChange={(e) => setNewBinRate(parseFloat(e.target.value) || 0)}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" /> Adicionar Bateria
          </button>
        </div>
      </form>

      {/* Lista de Bins sob Simulação */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {simulatedBins.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Nenhuma lixeira sendo simulada. Adicione uma acima!</p>
        ) : (
          simulatedBins.map((bin) => (
            <div key={bin.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white/50 hover:bg-slate-50/50 transition-colors gap-4">
              
              {/* Nome e Taxa */}
              <div className="flex items-center justify-between sm:justify-start sm:space-x-4 min-w-[120px]">
                <span className="text-xs font-bold text-slate-700">{bin.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  bin.rate > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {bin.rate >= 0 ? `+${bin.rate}` : bin.rate}% / passo
                </span>
              </div>

              {/* Slider de Controle Manual */}
              <div className="flex-1 flex items-center space-x-3">
                <span className="text-[11px] text-slate-400 font-medium">Nível:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bin.nivel}
                  onChange={(e) => handleNivelChange(bin.id, parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-xs font-bold text-slate-600 w-10 text-right">{Math.round(bin.nivel)}%</span>
              </div>

              {/* Ações Individuais */}
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => forceSingleSend(bin)}
                  className="text-slate-400 hover:text-emerald-500 p-1.5 rounded-md hover:bg-emerald-50 transition-colors"
                  title="Forçar envio de payload único MQTT"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveSimulatedBin(bin.id)}
                  className="text-slate-300 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                  title="Excluir da simulação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Intervalo de Simulação */}
      <div className="mt-6 pt-4 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 text-slate-500">
          <RefreshCw className={`w-4 h-4 ${simulationActive ? 'animate-spin' : ''}`} />
          <span>Frequência de envio:</span>
          <select
            value={sendIntervalMs}
            onChange={(e) => setSendIntervalMs(parseInt(e.target.value))}
            className="border border-slate-200 rounded px-2 py-1 text-slate-700 bg-white focus:outline-none"
          >
            <option value="2000">2 segundos</option>
            <option value="5000">5 segundos</option>
            <option value="10000">10 segundos</option>
            <option value="30000">30 segundos</option>
          </select>
        </div>

        <div className="text-[10px] text-slate-400 max-w-sm leading-relaxed">
          * Quando ativa, a simulação simula o comportamento natural do preenchimento das lixeiras de acordo com as taxas selecionadas.
        </div>
      </div>
    </div>
  );
}
