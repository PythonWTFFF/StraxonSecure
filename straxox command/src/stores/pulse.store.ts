import { create } from "zustand";

export interface PulseMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
  latencyMs: number;
  lastUpdated: number;
}

interface PulseStore {
  metrics: PulseMetrics;
  updateMetrics: (newMetrics: Partial<PulseMetrics>) => void;
  isConnected: boolean;
  setConnected: (status: boolean) => void;
}

export const usePulseStore = create<PulseStore>((set) => ({
  metrics: {
    cpuUsage: 0,
    memoryUsage: 0,
    activeConnections: 0,
    requestsPerSecond: 0,
    latencyMs: 0,
    lastUpdated: Date.now(),
  },
  isConnected: false,
  updateMetrics: (newMetrics) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        ...newMetrics,
        lastUpdated: Date.now(),
      },
    })),
  setConnected: (status) => set({ isConnected: status }),
}));
