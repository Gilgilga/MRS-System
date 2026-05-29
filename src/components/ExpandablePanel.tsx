'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  Map, 
  ScanFace, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  Thermometer, 
  Flame, 
  Wind, 
  Unlock 
} from 'lucide-react';
import { useBinStore } from '@/store/useBinStore';

export default function ExpandablePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'maps' | 'analytics' | 'facial' | 'sensors'>('maps');
  const bins = useBinStore((state) => state.bins);
  const binList = Object.values(bins);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header clicável para colapsar/expandir */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors focus:outline-none"
      >
        <div className="flex items-center space-x-2.5 text-left">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Cpu className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recursos de Expansão (Módulos IoT)</h3>
            <p className="text-xs text-slate-400">Clique para visualizar mapas, gráficos históricos, verificação facial e telemetria adicional</p>
          </div>
        </div>
        
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Conteúdo Expansível */}
      {isOpen && (
        <div className="border-t border-slate-50">
          
          {/* Menu de Tabs */}
          <div className="flex border-b border-slate-50 bg-slate-50/40 p-2 gap-1 overflow-x-auto">
            
            <button
              onClick={() => setActiveTab('maps')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'maps'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Mapa de Disposição</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Histórico</span>
            </button>

            <button
              onClick={() => setActiveTab('facial')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'facial'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Reconhecimento Facial</span>
            </button>

            <button
              onClick={() => setActiveTab('sensors')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'sensors'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Sensores Adicionais</span>
            </button>

          </div>

          {/* Área das Views */}
          <div className="p-6">
            
            {/* 1. MAPAS */}
            {activeTab === 'maps' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Geolocalização das Lixeiras</h4>
                  <span className="text-[10px] text-slate-400">Coordenadas integradas via GPS simulado</span>
                </div>
                
                {/* SVG Map Layout Mock */}
                <div className="relative w-full h-[250px] bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center">
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
                  
                  {/* Styled Roads/Blocks in SVG */}
                  <svg className="absolute inset-0 w-full h-full text-slate-200" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0,100 L 600,100 M 0,200 L 600,200 M 150,0 L 150,300 M 450,0 L 450,300" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    <rect x="40" y="20" width="80" height="60" rx="6" fill="currentColor" fillOpacity="0.4" />
                    <rect x="200" y="20" width="200" height="60" rx="6" fill="currentColor" fillOpacity="0.4" />
                    <rect x="40" y="120" width="80" height="60" rx="6" fill="currentColor" fillOpacity="0.4" />
                    <rect x="200" y="120" width="200" height="60" rx="6" fill="currentColor" fillOpacity="0.4" />
                  </svg>

                  {/* Pin Markers */}
                  {binList.length === 0 ? (
                    <span className="text-xs text-slate-400 z-10">Nenhuma lixeira ativa encontrada no mapa</span>
                  ) : (
                    binList.map((bin, index) => {
                      // Coordenadas estáticas baseadas no index para distribuir os marcadores
                      const xPositions = [25, 65, 45, 15, 80];
                      const yPositions = [30, 45, 75, 60, 20];
                      const left = `${xPositions[index % xPositions.length]}%`;
                      const top = `${yPositions[index % yPositions.length]}%`;
                      
                      const isCritical = bin.nivel >= 90;
                      const isAlert = bin.nivel >= 70 && bin.nivel < 90;
                      
                      const pinColor = isCritical 
                        ? 'bg-rose-500' 
                        : isAlert 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-500';

                      return (
                        <div
                          key={bin.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                          style={{ left, top }}
                        >
                          {/* Pulse animation for critical */}
                          {isCritical && (
                            <span className="absolute inline-flex h-6 w-6 rounded-full bg-rose-400 opacity-75 animate-ping -left-1.5 -top-1.5" />
                          )}
                          
                          <div className={`w-3.5 h-3.5 rounded-full ${pinColor} border-2 border-white shadow-md z-10`} />
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                            {bin.id}: {Math.round(bin.nivel)}%
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  <span className="absolute bottom-3 right-3 bg-white/90 border border-slate-100 shadow-sm py-1 px-2.5 rounded-md text-[9px] text-slate-500 font-bold z-10">
                    Campus Mackenzie - Higienópolis
                  </span>
                </div>
              </div>
            )}

            {/* 2. ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Volume Acumulado das últimas 12 horas</h4>
                  <span className="text-[10px] text-slate-400">Atualizado dinamicamente</span>
                </div>
                
                {/* Mock Chart */}
                <div className="w-full bg-slate-50 rounded-xl border border-slate-100 p-5 flex flex-col justify-between h-[200px]">
                  <div className="flex-1 flex items-end justify-between space-x-2 pt-6">
                    {/* Columns representing fill levels over times */}
                    {[22, 28, 41, 55, 30, 48, 62, 75, 80, 45, 60, binList[0]?.nivel || 70].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center space-y-2 group">
                        <span className="text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {Math.round(val)}%
                        </span>
                        <div
                          className={`w-full rounded-t transition-all duration-500 ${
                            val >= 90 
                              ? 'bg-rose-400/80 hover:bg-rose-400' 
                              : val >= 70 
                              ? 'bg-amber-400/80 hover:bg-amber-400' 
                              : 'bg-emerald-400/80 hover:bg-emerald-400'
                          }`}
                          style={{ height: `${Math.max(10, val)}%` }}
                        />
                        <span className="text-[8px] text-slate-400 font-mono">
                          {19 - (11 - i)}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. RECONHECIMENTO FACIAL */}
            {activeTab === 'facial' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Verificação de Descarte Autorizado</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Módulo de autenticação biométrica acoplado à lixeira para detectar e verificar a identidade do operador de coleta ou do usuário que realiza o descarte de resíduos recicláveis para pontuação/gamificação.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md border border-emerald-100">
                      Câmera Integrada
                    </span>
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md border border-indigo-100">
                      Mapeamento Facial
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-50 text-slate-500 px-2.5 py-1 rounded-md border border-slate-200">
                      Histórico Coleta
                    </span>
                  </div>
                </div>

                {/* Mock Camera Stream */}
                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner group">
                  
                  {/* Camera Grid Lines */}
                  <div className="absolute inset-0 border border-emerald-500/20 m-4 pointer-events-none" />
                  
                  {/* Corners of face scan square */}
                  <div className="absolute top-8 left-16 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-8 right-16 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-8 left-16 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-8 right-16 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  
                  {/* Moving scanner line */}
                  <div className="absolute left-16 right-16 h-0.5 bg-emerald-400 opacity-60 shadow-md shadow-emerald-400 animate-[pulse_2s_infinite] top-1/2" />

                  {/* Face Outline Silhouette */}
                  <svg className="w-20 h-20 text-emerald-500/30 group-hover:text-emerald-400/50 transition-colors duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C13.66 4 15 5.34 15 7C15 8.66 13.66 10 12 10C10.34 10 9 8.66 9 7C9 5.34 10.34 4 12 4ZM12 20C9.33 20 7.02 18.67 5.66 16.64C5.69 14.53 9.89 13.37 12 13.37C14.1 13.37 18.3 14.53 18.35 16.64C16.98 18.67 14.67 20 12 20Z" />
                  </svg>

                  <span className="absolute bottom-3 left-3 flex items-center space-x-1.5 text-[9px] text-emerald-400 font-bold bg-slate-950/80 py-0.5 px-2 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>FEED: CÂMERA INTEGRADA [LIXEIRA-01]</span>
                  </span>
                </div>
              </div>
            )}

            {/* 4. SENSORES ADICIONAIS */}
            {activeTab === 'sensors' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Temperatura</span>
                    <Thermometer className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-xl font-extrabold text-slate-800">26.4</span>
                    <span className="text-xs font-bold text-slate-500 ml-0.5">°C</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-semibold mt-1">Normal / Seguro</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Gás Metano</span>
                    <Wind className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-xl font-extrabold text-slate-800">12</span>
                    <span className="text-xs font-bold text-slate-500 ml-0.5">ppm</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-semibold mt-1">Nível de odor: Baixo</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Detecção Incêndio</span>
                    <Flame className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-md font-bold text-slate-700">Ausente</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-semibold mt-1">Sistema Antichama Ativo</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Aberturas de Tampa</span>
                    <Unlock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-xl font-extrabold text-slate-800">42</span>
                    <span className="text-xs font-bold text-slate-500 ml-0.5">ciclos</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1">Acumulado diário</span>
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
