'use client';

import React from 'react';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import Simulation from '@/components/Simulation';
import ExpandablePanel from '@/components/ExpandablePanel';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Header com Telemetria e Indicadores */}
      <Header />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Painel Central das Lixeiras */}
        <Dashboard />

        {/* Painel de Expansão (Módulos IoT Opcionais) */}
        <ExpandablePanel />

        {/* Painel de Simulação de Sinais MQTT */}
        <Simulation />

      </main>

      {/* Rodapé */}
      <footer className="w-full bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 MRS System. Licenciado para fins acadêmicos e industriais.</p>
        </div>
      </footer>
    </div>
  );
}
