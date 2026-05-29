import { create } from 'zustand';

export interface BinHistoryEntry {
  nivel: number;
  timestamp: number; // millisecond timestamp
}

export interface BinData {
  id: string;
  nivel: number;
  timestamp: string; // Original timestamp from payload
  lastSeen: number; // Arrival time locally (ms)
  history: BinHistoryEntry[];
  isOnline: boolean;
  ratePerHour: number; // Rate of filling in % per hour
  estimatedHoursToFull: number | null; // Hours remaining to 100% capacity
}

interface BinStore {
  bins: Record<string, BinData>;
  mqttConnected: boolean;
  networkConnected: boolean;
  simulationActive: boolean;
  lastSimulatedUpdate: number;
  
  // Actions
  setMqttConnected: (connected: boolean) => void;
  setNetworkConnected: (connected: boolean) => void;
  toggleSimulation: () => void;
  updateBin: (id: string, nivel: number, payloadTimestamp?: string) => void;
  checkTimeouts: () => void;
  removeBin: (id: string) => void;
  clearBins: () => void;
}

const OFFLINE_TIMEOUT = 25000; // 25 seconds without messages => offline
const REMOVE_TIMEOUT = 60000;  // 60 seconds without messages => auto-remove from UI
const HISTORY_LIMIT = 6;       // Keep last 6 readings for rate estimation

export const useBinStore = create<BinStore>((set, get) => ({
  bins: {},
  mqttConnected: false,
  networkConnected: typeof window !== 'undefined' ? window.navigator.onLine : true,
  simulationActive: false,
  lastSimulatedUpdate: 0,

  setMqttConnected: (mqttConnected) => set({ mqttConnected }),
  
  setNetworkConnected: (networkConnected) => set({ networkConnected }),
  
  toggleSimulation: () => set((state) => ({ simulationActive: !state.simulationActive })),

  updateBin: (id, nivel, payloadTimestamp) => {
    // Garante que o nível está entre 0 e 100
    const clampedNivel = Math.max(0, Math.min(100, nivel));
    const now = Date.now();
    const tsStr = payloadTimestamp || new Date(now).toISOString();

    set((state) => {
      const existingBin = state.bins[id];
      let history: BinHistoryEntry[] = existingBin ? [...existingBin.history] : [];
      
      // Adiciona novo registro ao histórico
      history.push({ nivel: clampedNivel, timestamp: now });
      
      // Limita o tamanho do histórico
      if (history.length > HISTORY_LIMIT) {
        history.shift();
      }

      // Calcula a taxa de enchimento (% por hora)
      let ratePerHour = 0;
      let estimatedHoursToFull: number | null = null;

      if (history.length >= 2) {
        const oldest = history[0];
        const latest = history[history.length - 1];
        const timeDiffMs = latest.timestamp - oldest.timestamp;
        const levelDiff = latest.nivel - oldest.nivel;

        if (timeDiffMs > 2000) { // pelo menos 2 segundos de diferença para cálculo estável
          const ratePerMs = levelDiff / timeDiffMs;
          ratePerHour = ratePerMs * 1000 * 60 * 60; // converter para % por hora

          if (ratePerHour > 0.01 && clampedNivel < 100) {
            const percentRemaining = 100 - clampedNivel;
            estimatedHoursToFull = percentRemaining / ratePerHour;
          }
        }
      } else if (existingBin) {
        // Preserva a taxa anterior caso só tenhamos uma leitura nova para evitar oscilações
        ratePerHour = existingBin.ratePerHour;
        estimatedHoursToFull = existingBin.estimatedHoursToFull;
      }

      const updatedBin: BinData = {
        id,
        nivel: clampedNivel,
        timestamp: tsStr,
        lastSeen: now,
        history,
        isOnline: true,
        ratePerHour,
        estimatedHoursToFull
      };

      return {
        bins: {
          ...state.bins,
          [id]: updatedBin
        }
      };
    });
  },

  checkTimeouts: () => {
    const now = Date.now();
    let changed = false;

    set((state) => {
      const updatedBins = { ...state.bins };

      for (const id in updatedBins) {
        const bin = updatedBins[id];
        const elapsed = now - bin.lastSeen;

        if (elapsed > REMOVE_TIMEOUT) {
          // Remover lixeira da tela após timeout completo
          delete updatedBins[id];
          changed = true;
        } else if (elapsed > OFFLINE_TIMEOUT && bin.isOnline) {
          // Marcar lixeira como offline
          updatedBins[id] = {
            ...bin,
            isOnline: false,
            ratePerHour: 0,
            estimatedHoursToFull: null
          };
          changed = true;
        }
      }

      return changed ? { bins: updatedBins } : {};
    });
  },

  removeBin: (id) => {
    set((state) => {
      const updatedBins = { ...state.bins };
      delete updatedBins[id];
      return { bins: updatedBins };
    });
  },

  clearBins: () => set({ bins: {} })
}));
