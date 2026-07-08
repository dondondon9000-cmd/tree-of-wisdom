import { create } from 'zustand'
import { supabase } from './supabase'
import { randomFieldPosition } from './randomFieldPosition'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  ideasLoaded: false,
  commitDraft: async () => {
    const { draft } = get()
    if (!draft || draft.status !== 'ready') return

    const idea = { ...draft, status: 'floating', id: crypto.randomUUID(), position: randomFieldPosition() }
    set((state) => ({ ideas: [...state.ideas, idea], draft: null }))

    if (supabase) {
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          transcript: idea.transcript,
          title: idea.title,
          summary: idea.summary,
          keywords: idea.keywords,
          category: idea.category,
          confidence: idea.confidence,
        })
        .select()
        .single()
      if (error) {
        console.error('Failed to save idea to Supabase:', error.message)
      } else {
        // Swap in the real database id so later actions (planting) can
        // find this row — the in-memory id was only ever a placeholder
        // until the insert round-tripped.
        set((state) => ({
          ideas: state.ideas.map((i) => (i.id === idea.id ? { ...i, id: data.id } : i)),
        }))
      }
    }
  },

  // Loads every not-yet-planted idea from Supabase once, on app start —
  // without this, ideas only ever existed in memory for the session
  // that created them, so search would only ever find what you said
  // today. Positions are assigned fresh each load, same as any other
  // seed entering the field for the first time.
  loadIdeas: async () => {
    if (!supabase || get().ideasLoaded) return
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('status', 'floating')
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Failed to load ideas from Supabase:', error.message)
      return
    }
    const loaded = data.map((row) => ({
      id: row.id,
      transcript: row.transcript,
      title: row.title,
      summary: row.summary,
      keywords: row.keywords || [],
      category: row.category,
      confidence: row.confidence,
      status: 'floating',
      position: randomFieldPosition(),
    }))
    set((state) => ({ ideas: [...loaded, ...state.ideas], ideasLoaded: true }))
  },

  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),

  // Which top-level scene is showing — the floating idea world, or the
  // Garden where planted ideas live as bonsai trees. The manual toggle
  // button uses this directly; plantWithTransition (below) also drives
  // it as part of the scripted plant-and-arrive sequence.
  view: 'world',
  setView: (view) => set({ view }),

  // Bonsai trees the Garden renders, one per planted idea. Kept
  // separate from `ideas` (the floating field's data) the same way
  // `ideas` itself is separate from placeholders — different scene,
  // different data. Position is assigned once at plant time so a
  // bonsai never jumps around on later renders.
  plantedIdeas: [],
  plantedIdeasLoaded: false,
  loadPlantedIdeas: async () => {
    if (!supabase || get().plantedIdeasLoaded) return
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('status', 'planted')
      .order('planted_at', { ascending: true })
    if (error) {
      console.error('Failed to load planted ideas from Supabase:', error.message)
      return
    }
    const loaded = data.map((row) => ({
      id: row.id,
      transcript: row.transcript,
      title: row.title,
      summary: row.summary,
      keywords: row.keywords || [],
      category: row.category,
      confidence: row.confidence,
      status: 'planted',
    }))
    set((state) => ({ plantedIdeas: [...loaded, ...state.plantedIdeas], plantedIdeasLoaded: true }))
  },

  // Planting removes a floating idea from the sky and adds it to the
  // Garden instead.
  plantIdea: async (id) => {
    set((state) => {
      const idea = state.ideas.find((i) => i.id === id)
      return {
        ideas: state.ideas.filter((i) => i.id !== id),
        plantedIdeas: idea ? [...state.plantedIdeas, { ...idea, status: 'planted' }] : state.plantedIdeas,
      }
    })
    if (supabase) {
      const { error } = await supabase
        .from('ideas')
        .update({ status: 'planted', planted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) console.error('Failed to mark idea planted in Supabase:', error.message)
    }
  },

  // The scripted cut connecting "plant this idea" to actually arriving
  // in the Garden. The two scenes are separate Canvases (their own
  // scene graphs, cameras, everything) — a real continuous 3D flight
  // between them would mean merging World and Garden into one shared
  // scene, a much bigger rearchitecture. This fakes the same beat with
  // a fade: drop/shrink the seed, cut to black, swap the scene
  // underneath while hidden, then reveal the Garden with the new
  // bonsai growing into place rather than just appearing full-size.
  //
  // `planting` drives the fade overlay (see PlantTransition.jsx);
  // `justPlantedId` tells that one bonsai in the Garden to play its
  // grow-in animation instead of rendering already full-size.
  planting: null,
  justPlantedId: null,
  plantWithTransition: async (idea) => {
    if (get().planting) return
    set({ planting: idea, searchOpen: false })
    await sleep(650) // let the fade fully cover the screen first

    get().plantIdea(idea.id) // not awaited - the Supabase write shouldn't hold up the reveal
    set({ view: 'garden', justPlantedId: idea.id })
    await sleep(400) // give the Garden a moment to mount before revealing it

    set({ planting: null })
    setTimeout(() => {
      if (get().justPlantedId === idea.id) set({ justPlantedId: null })
    }, 3000)
  },
}))
