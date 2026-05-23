// ============================================
// CreaPulse V2 — Upload State Management (Zustand)
// Manages uploaded files state across the app
// ============================================

import { create } from 'zustand'

// ─── Types ──────────────────────────────────

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
}

interface UploadStore {
  files: UploadedFile[]
  isUploading: boolean
  progress: number
  addFile: (file: UploadedFile) => void
  removeFile: (id: string) => void
  setUploading: (v: boolean) => void
  setProgress: (p: number) => void
  clearFiles: () => void
}

// ─── Store ──────────────────────────────────

export const useUploadStore = create<UploadStore>((set) => ({
  files: [],
  isUploading: false,
  progress: 0,

  addFile: (file) =>
    set((state) => ({ files: [...state.files, file] })),

  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),

  setUploading: (v) => set({ isUploading: v }),

  setProgress: (p) => set({ progress: p }),

  clearFiles: () => set({ files: [], progress: 0 }),
}))
