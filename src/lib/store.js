import { create } from 'zustand'

// Minimal global state for the floating world. Voice capture, the
// AI processing pipeline, and real seed data land in step 2 — this
// just gives the talk-seed something to toggle so the "environment
// fades while listening" behavior can be built and felt now.
export const useGardenStore = create((set) => ({
  isRecording: false,
  startRecording: () => set({ isRecording: true }),
  stopRecording: () => set({ isRecording: false }),
}))
