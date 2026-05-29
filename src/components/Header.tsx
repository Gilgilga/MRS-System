'use client';

import React from 'react';
import { useBinStore } from '@/store/useBinStore';
import { Wifi, WifiOff, Database, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Header() {
  const { bins, mqttConnected, networkConnected, simulationActive, toggleSimulation } = useBinStore();

  const binList = Object.values(bins);
  const totalBins = binList.length;
  const criticalBins = binList.filter((b) => b.nivel >= 90).length;
  const alertBins = binList.filter((b) => b.nivel >= 70 && b.nivel < 90).length;
  
  const avgFill = totalBins > 0 
    ? Math.round(binList.reduce((acc, b) => acc + b.nivel, 0) / totalBins)
    : 0;

  return (
    <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 space-y-4 md:space-y-0">
          
          {/* Logo & Status da Rede */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                MRS System
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">v1.0.0</span>
              </h1>
              <p className="text-xs text-slate-500">Monitoramento de IoT em tempo real</p>
            </div>
          </div>

          {/* Telemetria de Conexão e Simulação */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status do Navegador */}
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              networkConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}>
              {networkConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>Rede: {networkConnected ? 'Conectado' : 'Sem Internet'}</span>
            </div>

            {/* Status do Broker MQTT */}
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              mqttConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <Database className={`w-3.5 h-3.5 ${mqttConnected ? 'animate-pulse' : ''}`} />
              <span>Broker MQTT: {mqttConnected ? 'Conectado' : 'Conectando...'}</span>
            </div>

            {/* Alternador de Simulação */}
            <button
              onClick={toggleSimulation}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
                simulationActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${simulationActive ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
              <span>{simulationActive ? 'Modo Simulação' : 'Ativar Simulação'}</span>
            </button>
          </div>

        </div>

        {/* Painel Rápido de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-50">
          
          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Lixeiras Ativas</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{totalBins}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-rose-50/30 p-3 rounded-xl border border-rose-100/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-600 uppercase">Estado Crítico</p>
              <h3 className="text-xl font-bold text-rose-700 mt-1">{criticalBins}</h3>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${criticalBins > 0 ? 'bg-rose-100 text-rose-600 animate-bounce' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-amber-50/30 p-3 rounded-xl border border-amber-100/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase">Estado Alerta</p>
              <h3 className="text-xl font-bold text-amber-700 mt-1">{alertBins}</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Média Ocupação</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{avgFill}%</h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
