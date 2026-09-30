/**
 * TerraRise — SR Zustand Store
 *
 * Manages the full state of the super-resolution workstation.
 * All business logic lives in the store; UI components read state and
 * call actions — they do NOT make direct API calls.
 *
 * Processing stages (status):
 *   idle → preprocessing → loading_model → running → building → ready
 *   Any stage can transition to: error
 */

import { create } from "zustand";
import { enhanceImage } from "../services/api/srApi";

// ── Status constants ──────────────────────────────────────────────────────────
export const SR_STATUS = {
  IDLE: "idle",
  PREPROCESSING: "preprocessing",
  LOADING_MODEL: "loading_model",
  RUNNING: "running",
  BUILDING: "building",
  READY: "ready",
  ERROR: "error",
};

export const SR_STATUS_LABEL = {
  idle: "Workspace Idle",
  preprocessing: "Preprocessing Input…",
  loading_model: "Loading FSRCNN Model…",
  running: "Running Neural Reconstruction…",
  building: "Building Result…",
  ready: "Ready",
  error: "Error",
};

// ──────────────────────────────────────────────────────────────────────────────

const useSRStore = create((set, get) => ({
  // ── Input ──────────────────────────────────────────────────────────────────
  inputFile: null,          // File object
  inputSrc: null,           // Object URL for preview
  referenceFile: null,      // Optional File object
  referenceSrc: null,       // Object URL for reference preview

  // ── Model config ───────────────────────────────────────────────────────────
  scale: 2,                 // Default 2× (4× available but slower)
  modelName: "FSRCNN",
  showBaseline: false,      // Baseline OFF by default — must be explicitly enabled

  // ── Processing state ───────────────────────────────────────────────────────
  status: SR_STATUS.IDLE,
  statusLabel: SR_STATUS_LABEL.idle,
  error: null,
  processingTime: null,

  // ── Result ─────────────────────────────────────────────────────────────────
  result: null,             // Full backend response
  outputUrl: null,          // Enhanced image URL
  bicubicUrl: null,         // Bicubic baseline URL (or null)

  // ── Metrics & metadata ─────────────────────────────────────────────────────
  validation: null,
  uncertainty: null,
  spectralValidation: null,
  limitations: [],
  inputMeta: null,
  outputMeta: null,

  // ────────────────────────────────────────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────────────────────────────────────────

  setInputFile: (file) => {
    // Revoke previous object URL to avoid memory leaks
    const prev = get().inputSrc;
    if (prev) URL.revokeObjectURL(prev);

    set({
      inputFile: file,
      inputSrc: file ? URL.createObjectURL(file) : null,
      // Reset result when a new image is uploaded
      result: null,
      outputUrl: null,
      bicubicUrl: null,
      validation: null,
      uncertainty: null,
      status: SR_STATUS.IDLE,
      statusLabel: SR_STATUS_LABEL.idle,
      error: null,
    });
  },

  setReferenceFile: (file) => {
    const prev = get().referenceSrc;
    if (prev) URL.revokeObjectURL(prev);
    set({
      referenceFile: file,
      referenceSrc: file ? URL.createObjectURL(file) : null,
    });
  },

  setScale: (scale) => set({ scale }),

  setShowBaseline: (show) => set({ showBaseline: show }),

  clearError: () => set({ error: null, status: SR_STATUS.IDLE, statusLabel: SR_STATUS_LABEL.idle }),

  // ── Main action: run SR pipeline ─────────────────────────────────────────
  runSuperResolution: async () => {
    const { inputFile, referenceFile, scale, showBaseline } = get();

    if (!inputFile) {
      set({ error: "Please upload an image first.", status: SR_STATUS.ERROR, statusLabel: SR_STATUS_LABEL.error });
      return;
    }

    // Stage 1: Preprocessing
    set({ status: SR_STATUS.PREPROCESSING, statusLabel: SR_STATUS_LABEL.preprocessing, error: null, result: null, outputUrl: null, bicubicUrl: null });

    await new Promise((r) => setTimeout(r, 120)); // Allow React to re-render

    // Stage 2: Loading model (happens server-side, but we show the stage)
    set({ status: SR_STATUS.LOADING_MODEL, statusLabel: SR_STATUS_LABEL.loading_model });
    await new Promise((r) => setTimeout(r, 80));

    // Stage 3: Running inference
    set({ status: SR_STATUS.RUNNING, statusLabel: SR_STATUS_LABEL.running });

    let data;
    try {
      data = await enhanceImage({
        image: inputFile,
        scale,
        reference: referenceFile || null,
        baseline: showBaseline,
      });
    } catch (err) {
      console.error("[SR Store] inference error:", err);
      set({
        status: SR_STATUS.ERROR,
        statusLabel: SR_STATUS_LABEL.error,
        error: err.message || "Super-resolution failed. Check console for details.",
      });
      return;
    }

    // Stage 4: Building result
    set({ status: SR_STATUS.BUILDING, statusLabel: SR_STATUS_LABEL.building });
    await new Promise((r) => setTimeout(r, 80));

    // Stage 5: Ready
    set({
      status: SR_STATUS.READY,
      statusLabel: SR_STATUS_LABEL.ready,
      result: data,
      outputUrl: data.output?.download_url || null,
      bicubicUrl: data.output?.bicubic_url || null,
      processingTime: data.processing_time,
      validation: data.validation,
      uncertainty: data.uncertainty,
      spectralValidation: data.spectral_validation,
      limitations: data.limitations || [],
      inputMeta: data.input,
      outputMeta: data.output,
      error: null,
    });
  },

  reset: () => {
    const { inputSrc, referenceSrc } = get();
    if (inputSrc) URL.revokeObjectURL(inputSrc);
    if (referenceSrc) URL.revokeObjectURL(referenceSrc);
    set({
      inputFile: null,
      inputSrc: null,
      referenceFile: null,
      referenceSrc: null,
      scale: 2,
      showBaseline: false,
      status: SR_STATUS.IDLE,
      statusLabel: SR_STATUS_LABEL.idle,
      error: null,
      result: null,
      outputUrl: null,
      bicubicUrl: null,
      processingTime: null,
      validation: null,
      uncertainty: null,
      spectralValidation: null,
      limitations: [],
      inputMeta: null,
      outputMeta: null,
    });
  },
}));

export default useSRStore;
