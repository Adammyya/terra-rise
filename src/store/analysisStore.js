import { create } from "zustand";

const useAnalysisStore = create((set) => ({
  query: "",
  status: "idle",
  task: null,
  workflow: null,
  result: null,
  confidence: null,
  uncertainty: null,
  evidence: null,
  executionTrace: [],
  history: [],

  // Display settings
  showTrace: true,
  showConfidence: true,

  setQuery: (query) => {
    set({ query });
  },

  setStatus: (status) => {
    set({ status });
  },

  setTask: (task) => {
    set({ task });
  },

  setWorkflow: (workflow) => {
    set({ workflow });
  },

  setResult: (result) => {
    set({ result });
  },

  setConfidence: (confidence) => {
    set({ confidence });
  },

  setUncertainty: (uncertainty) => {
    set({ uncertainty });
  },

  setEvidence: (evidence) => {
    set({ evidence });
  },

  setShowTrace: (showTrace) => {
    set({ showTrace });
  },

  setShowConfidence: (showConfidence) => {
    set({ showConfidence });
  },

  setExecutionTrace: (executionTrace) => {
    set({ executionTrace });
  },

  addTraceEvent: (event) => {
    set((state) => ({
      executionTrace: [...state.executionTrace, event],
    }));
  },

  addHistoryEntry: (entry) => {
    set((state) => ({
      history: [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          ...entry,
        },
        ...state.history,
      ].slice(0, 20),
    }));
  },

  clearExecutionTrace: () => {
    set({ executionTrace: [] });
  },

  resetAnalysis: () => {
    set({
      query: "",
      status: "idle",
      task: null,
      workflow: null,
      result: null,
      confidence: null,
      uncertainty: null,
      evidence: null,
      executionTrace: [],
    });
  },
}));

export default useAnalysisStore;