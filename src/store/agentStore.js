import { create } from "zustand";

const useAgentStore = create((set) => ({
  activeAgents: [],
  currentAgent: null,
  executionTrace: [],

  setActiveAgents: (activeAgents) => {
    set({ activeAgents });
  },

  setCurrentAgent: (currentAgent) => {
    set({ currentAgent });
  },

  addExecutionEvent: (event) => {
    set((state) => ({
      executionTrace: [...state.executionTrace, event],
    }));
  },

  clearExecutionTrace: () => {
    set({
      executionTrace: [],
    });
  },
}));

export default useAgentStore; 