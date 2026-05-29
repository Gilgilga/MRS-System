'use client';

import React from 'react';
import { BinData } from '@/store/useBinStore';
import { getBinStatus, formatTimeRemaining, formatLastUpdated } from '@/utils/helpers';
import { AlertCircle, Trash2, ArrowUpRight, Signal, SignalZero, Clock } from 'lucide-react';
import { useBinStore } from '@/store/useBinStore';

interface BinCardProps {
  bin: BinData;
}

export default function BinCard({ bin }: BinCardProps) {
  const removeBin = useBinStore((state) => state.removeBin);
  const status = getBinStatus(bin.nivel);

  return (
    <div
      className={`relative bg-white/95 backdrop-blur-md rounded-2xl border ${status.borderColor} p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
        !bin.isOnline ? 'opacity-70 saturate-50' : ''
      }`}
    >
      {/* Background Status Glow for Critical/Alert items */}
      {bin.isOnline && status.type !== 'OK' && (
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-[40px] opacity-10 pointer-events-none -mr-10 -mt-10 transition-all duration-500 bg-current ${status.textColor}`} />
      )}

      <div>
        {/* Card Header (ID / Badge / Online Indicator) */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LIXEIRA</span>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-emerald-600 transition-colors">
              {bin.id}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status Badge */}
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${status.textColor} ${status.bgColor} ${status.borderColor}`}>
              {status.label}
            </span>
            
            {/* Online/Offline Badge */}
            <span
              title={bin.isOnline ? 'Dispositivo Online (Enviando batimentos)' : 'Dispositivo Sem Sinal'}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-medium border ${
                bin.isOnline 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {bin.isOnline ? (
                <>
                  <Signal className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <SignalZero className="w-3 h-3 text-slate-400" />
                  <span>Offline</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Fill Percentage & Progress Circle/Bar */}
        <div className="my-6">
          <div className="flex justify-between items-baseline mb-2">
            <div className="flex items-baseline space-x-1">
              <span className={`text-4xl font-extrabold tracking-tight ${status.textColor}`}>
                {bin.nivel}
              </span>
              <span className="text-lg font-bold text-slate-500">%</span>
            </div>
            {bin.isOnline && bin.ratePerHour > 0 && (
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{bin.ratePerHour.toFixed(1)}%/h
              </span>
            )}
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-50 relative">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${status.barColor} ${
                bin.isOnline && bin.nivel >= 90 ? 'animate-pulse' : ''
              }`}
              style={{ width: `${bin.nivel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Footer (Metadata & Forecast) */}
      <div className="border-t border-slate-50 pt-4 mt-2 flex flex-col space-y-3">
        
        {/* Estimativa de Lotação */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Est. para 100%:
          </span>
          <span className={`font-bold ${
            bin.nivel >= 100 
              ? 'text-rose-600'
              : bin.estimatedHoursToFull !== null && bin.estimatedHoursToFull < 2
              ? 'text-rose-500 animate-pulse'
              : 'text-slate-700'
          }`}>
            {bin.nivel >= 100 ? 'Totalmente Cheia' : formatTimeRemaining(bin.estimatedHoursToFull)}
          </span>
        </div>

        {/* Última atualização e Ação rápida */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Último sinal: {formatLastUpdated(bin.timestamp)}</span>
          
          <button
            onClick={() => removeBin(bin.id)}
            className="text-slate-300 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Remover lixeira do monitoramento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Alerta crítico no topo do card */}
      {bin.isOnline && bin.nivel >= 90 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 animate-pulse" />
      )}
    </div>
  );
}
