import { create } from 'zustand'
import { supabase } from './supabase'
import { randomFieldPosition } from './randomFieldPosition'

// isRecording drives the visual "listening" state (veil, hint text,
// talk-seed breathing). draft is the idea currently being processed
// after you stop talking — its status walks through
// transcribing -> summarizing -> ready (or error), and it stays a
// draft (never a real seed) until you explicitly commit it. That's
// the point: a bad transcription never has to become a permanent seed.
export const useGardenStore = create((set, get) => ({
  isRecording: false,
  startRecording: () => set({ isRecording: true }),
  stopRecording: () => set({ isRecording: false }),

  draft: null,
  setDraft: (draft) => set({ draft }),
  discardDraft: () => set({ draft: null }),

  // Committed ideas. Always kept in memory so the floating field has
  // them immediately regardless of Supabase — persisted for real too
  // once VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are set, no other
  // code changes needed when that happens. Position/id are assigned
  // once here, at commit time, so a seed never jumps around later.
  ideas: [],
  commitDraft: async () => {
    const { draft } = get()
    if (!draft || draft.status !== 'ready') return

    const idea = { ...draft, id: crypto.randomUUID(), position: randomFieldPosition() }
    set((state) => ({ ideas: [...state.ideas, idea], draft: null }))

    if (supabase) {
      const { error } = await supabase.from('ideas').insert({
        transcript: idea.transcript,
        title: idea.title,
        summary: idea.summary,
        keywords: idea.keywords,
        category: idea.category,
        confidence: idea.confidence,
      })
      if (error) console.error('Failed to save idea to Supabase:', error.message)
    }
  },
}))
