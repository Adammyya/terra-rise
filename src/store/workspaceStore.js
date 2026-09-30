import { create } from "zustand";

const useWorkspaceStore = create((set) => ({
  activeView: "workspace",

  setActiveView: (view) => {
    set({ activeView: view });
  },
}));

export default useWorkspaceStore;