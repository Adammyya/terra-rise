import { create } from "zustand";

const demoImagery = {
  id: "nasa-demo-001",
  source: "NASA Earthdata",
  filename: "earthdata.jpeg",
  assetUrl: "/imagery/earthdata.jpeg",
  acquisitionDate: "2021-09-30",
  modality: "optical",
  file: null,
};

const useImageryStore = create((set) => ({
  image: demoImagery,
  temporalImage: null,
  sarImage: null,
  metadata: null,
  overlays: [],
  isLoading: false,

  setImage: (image) => {
    set({ image });
  },

  setTemporalImage: (temporalImage) => {
    set({ temporalImage });
  },

  setSarImage: (sarImage) => {
    set({ sarImage });
  },

  setMetadata: (metadata) => {
    set({ metadata });
  },

  setOverlays: (overlays) => {
    set({ overlays });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  clearImagery: () => {
    set({
      image: null,
      temporalImage: null,
      sarImage: null,
      metadata: null,
      overlays: [],
      isLoading: false,
    });
  },

  clearTemporalImage: () => {
    set({
      temporalImage: null,
    });
  },

  clearSarImage: () => {
    set({
      sarImage: null,
    });
  },
}));

export default useImageryStore;