import { create } from 'zustand'
import { supabase } from './supabase'
import { randomFieldPosition } from './randomFieldPosition'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The Board tool replaced the old flat `tasks` list with `milestones`
// (phases of grouped tasks) — this runs once at load time so ideas
// planted before that change still show their existing tasks, folded
// into a single default milestone, instead of silently losing them.
function withMigratedMilestones(row) {
  if (row.milestones && row.milestones.length > 0) return row.milestones
  if (row.tasks && row.tasks.length > 0) return [{ id: 'migrated', title: 'Tasks', tasks: row.tasks }]
  return []
}

// Shared by the desk tools' write-through-to-Supabase actions below —
// each one already updated its own in-memory copy of `field` via
// `set()`, so this just re-reads that same value back off the store
// and pushes it to the matching column.
function persistIdeaField(get, ideaId, field) {
  if (!supabase) return
  const idea = get().plantedIdeas.find((i) => i.id === ideaId)
  if (!idea) return
  supabase
    .from('ideas')
    .update({ [field]: idea[field] })
    .eq('id', ideaId)
    .then(({ error }) => {
      if (error) console.error(`Failed to save ${field} to Supabase:`, error.message)
    })
}

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
      plan: row.plan || null,
      bloomed: row.bloomed || false,
      notes: row.notes || [],
      brief: row.brief || null,
      tasks: row.tasks || [],
      planRevealed: row.plan_revealed || false,
      milestones: withMigratedMilestones(row),
      research: row.research || [],
      decisions: row.decisions || [],
      ledger: row.ledger || {},
      notebook: row.notebook || {},
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

  // The workspace for a single planted idea — opened by tapping its
  // bonsai in the Garden. The first time an idea's workspace opens
  // with no plan yet, generatePlan asks Haiku to sketch a short list
  // of concrete next steps, which get cached on the idea (in memory
  // and in Supabase) so they never regenerate on later visits.
  // Checking a step off via togglePlanStep is "working on the idea" —
  // BonsaiTree reads plan completion straight off the idea to decide
  // how big to render the tree, so there's no separate progress state
  // to keep in sync.
  workspaceIdea: null,
  openWorkspace: (idea) => set({ workspaceIdea: idea, planError: null }),
  closeWorkspace: () => set({ workspaceIdea: null }),

  generatingPlan: false,
  planError: null,
  generatePlan: async (idea) => {
    if (!idea || idea.plan || get().generatingPlan) return
    set({ generatingPlan: true, planError: null })
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          transcript: idea.transcript,
          title: idea.title,
          summary: idea.summary,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate a plan for this idea.')

      const plan = { steps: data.steps }
      set((state) => ({
        plantedIdeas: state.plantedIdeas.map((i) => (i.id === idea.id ? { ...i, plan } : i)),
        workspaceIdea:
          state.workspaceIdea?.id === idea.id ? { ...state.workspaceIdea, plan } : state.workspaceIdea,
      }))

      if (supabase) {
        const { error } = await supabase.from('ideas').update({ plan }).eq('id', idea.id)
        if (error) console.error('Failed to save plan to Supabase:', error.message)
      }
    } catch (err) {
      set({ planError: err.message })
    } finally {
      set({ generatingPlan: false })
    }
  },

  togglePlanStep: (ideaId, stepIndex) => {
    const applyToggle = (i) => {
      if (i.id !== ideaId || !i.plan) return i
      const steps = i.plan.steps.map((step, idx) => (idx === stepIndex ? { ...step, done: !step.done } : step))
      return { ...i, plan: { ...i.plan, steps } }
    }
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyToggle),
      workspaceIdea: state.workspaceIdea ? applyToggle(state.workspaceIdea) : state.workspaceIdea,
    }))

    // Bloom is a one-way milestone — once every step in the plan is
    // checked off, the idea blooms and stays bloomed even if a step
    // gets unchecked again later.
    const idea = get().plantedIdeas.find((i) => i.id === ideaId)
    const justBloomed = idea?.plan?.steps?.length > 0 && idea.plan.steps.every((s) => s.done) && !idea.bloomed
    if (justBloomed) {
      const applyBloom = (i) => (i.id === ideaId ? { ...i, bloomed: true } : i)
      set((state) => ({
        plantedIdeas: state.plantedIdeas.map(applyBloom),
        workspaceIdea: state.workspaceIdea ? applyBloom(state.workspaceIdea) : state.workspaceIdea,
        justBloomedId: ideaId,
      }))
      setTimeout(() => {
        if (get().justBloomedId === ideaId) set({ justBloomedId: null })
      }, 3000)
    }

    if (supabase) {
      const updated = get().plantedIdeas.find((i) => i.id === ideaId)
      if (updated?.plan) {
        supabase
          .from('ideas')
          .update({ plan: updated.plan, bloomed: updated.bloomed })
          .eq('id', ideaId)
          .then(({ error }) => {
            if (error) console.error('Failed to save step progress to Supabase:', error.message)
          })
      }
    }
  },

  justBloomedId: null,

  // A journal entry logged in the Workshop — either typed or spoken
  // (see noteCapture.js), just plain text plus a timestamp. Feeds into
  // both generateBrief and checkIn below as extra context.
  addNote: (ideaId, text) => {
    const note = { text, createdAt: new Date().toISOString() }
    const applyAdd = (i) => (i.id === ideaId ? { ...i, notes: [...(i.notes || []), note] } : i)
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyAdd),
      workspaceIdea: state.workspaceIdea ? applyAdd(state.workspaceIdea) : state.workspaceIdea,
      roomIdea: state.roomIdea ? applyAdd(state.roomIdea) : state.roomIdea,
    }))
    if (supabase) {
      const idea = get().plantedIdeas.find((i) => i.id === ideaId)
      if (idea) {
        supabase
          .from('ideas')
          .update({ notes: idea.notes })
          .eq('id', ideaId)
          .then(({ error }) => {
            if (error) console.error('Failed to save note to Supabase:', error.message)
          })
      }
    }
  },

  // The "well reviewed plan" — unlike generatePlan, this is explicitly
  // user-triggered (a button in the dashboard) and re-runnable any
  // time, since more notes might get added after the first brief.
  generatingBrief: false,
  briefError: null,
  generateBrief: async (idea) => {
    if (!idea || get().generatingBrief) return
    set({ generatingBrief: true, briefError: null })
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          transcript: idea.transcript,
          title: idea.title,
          summary: idea.summary,
          steps: idea.plan?.steps || [],
          notes: idea.notes || [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate a plan for this idea.')

      const brief = data.brief
      set((state) => ({
        plantedIdeas: state.plantedIdeas.map((i) => (i.id === idea.id ? { ...i, brief } : i)),
        workspaceIdea:
          state.workspaceIdea?.id === idea.id ? { ...state.workspaceIdea, brief } : state.workspaceIdea,
        roomIdea: state.roomIdea?.id === idea.id ? { ...state.roomIdea, brief } : state.roomIdea,
      }))

      if (supabase) {
        const { error } = await supabase.from('ideas').update({ brief }).eq('id', idea.id)
        if (error) console.error('Failed to save plan brief to Supabase:', error.message)
      }
    } catch (err) {
      set({ briefError: err.message })
    } finally {
      set({ generatingBrief: false })
    }
  },

  // The Workshop is a third top-level scene (view: 'workshop'), one
  // idea's own room — reached by walking through the door that
  // appears on a bloomed bonsai. roomIdea is which idea's room is
  // showing; workshopTransition drives a plain fade-to-black cut (see
  // WorkshopTransition.jsx) for both entering and leaving, the same
  // "hide the swap behind a cut" trick plantWithTransition uses
  // between World and Garden.
  roomIdea: null,
  workshopTransition: null, // 'entering' | 'exiting' | null
  enterWorkshop: async (idea) => {
    if (get().workshopTransition) return
    set({ workshopTransition: 'entering' })
    await sleep(500)
    set({ view: 'workshop', roomIdea: idea })
    await sleep(400)
    set({ workshopTransition: null })
  },
  exitWorkshop: async () => {
    if (get().workshopTransition) return
    set({ workshopTransition: 'exiting' })
    await sleep(500)
    set({ view: 'garden', roomIdea: null })
    await sleep(400)
    set({ workshopTransition: null })
  },

  // The Workshop's living task list — unlike `plan` (the frozen
  // pre-bloom checklist that got the idea to bloom), this has no
  // fixed length and no finish line: add to it as you go, check things
  // off as real work gets done. checkIn's suggestedTasks feed into
  // this the same way addTask does.
  addTask: (ideaId, text) => {
    const task = { text, done: false }
    const applyAdd = (i) => (i.id === ideaId ? { ...i, tasks: [...(i.tasks || []), task] } : i)
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyAdd),
      roomIdea: state.roomIdea ? applyAdd(state.roomIdea) : state.roomIdea,
    }))
    if (supabase) {
      const idea = get().plantedIdeas.find((i) => i.id === ideaId)
      if (idea) {
        supabase
          .from('ideas')
          .update({ tasks: idea.tasks })
          .eq('id', ideaId)
          .then(({ error }) => {
            if (error) console.error('Failed to save task to Supabase:', error.message)
          })
      }
    }
  },

  toggleTask: (ideaId, taskIndex) => {
    const applyToggle = (i) => {
      if (i.id !== ideaId || !i.tasks) return i
      const tasks = i.tasks.map((task, idx) => (idx === taskIndex ? { ...task, done: !task.done } : task))
      return { ...i, tasks }
    }
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyToggle),
      roomIdea: state.roomIdea ? applyToggle(state.roomIdea) : state.roomIdea,
    }))
    if (supabase) {
      const idea = get().plantedIdeas.find((i) => i.id === ideaId)
      if (idea?.tasks) {
        supabase
          .from('ideas')
          .update({ tasks: idea.tasks })
          .eq('id', ideaId)
          .then(({ error }) => {
            if (error) console.error('Failed to save task progress to Supabase:', error.message)
          })
      }
    }
  },

  // The recurring AI check-in (api/checkin.js) — unlike generateBrief,
  // this is meant to be called again and again as work continues, so
  // its result is kept in memory only (lastCheckin), not persisted;
  // the journal entries and task list it's built from are what's
  // actually durable.
  generatingCheckin: false,
  checkinError: null,
  lastCheckin: null,
  checkIn: async (idea) => {
    if (!idea || get().generatingCheckin) return
    set({ generatingCheckin: true, checkinError: null })
    try {
      const flattenedTasks = (idea.milestones || []).flatMap((m) => m.tasks)
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          brief: idea.brief,
          tasks: flattenedTasks,
          notes: idea.notes || [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to check in on this idea.')
      set({ lastCheckin: data })
    } catch (err) {
      set({ checkinError: err.message })
    } finally {
      set({ generatingCheckin: false })
    }
  },

  // Whether an idea's plan-reveal ceremony has been completed —
  // PlanReveal.jsx shows first, every visit, until this flips true;
  // after that, walking through the door goes straight to
  // WorkshopDashboard instead. A one-time gate per idea, not a repeat
  // "read the brief again" step.
  revealPlan: (ideaId) => {
    const applyReveal = (i) => (i.id === ideaId ? { ...i, planRevealed: true } : i)
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyReveal),
      roomIdea: state.roomIdea ? applyReveal(state.roomIdea) : state.roomIdea,
    }))
    if (supabase) {
      supabase
        .from('ideas')
        .update({ plan_revealed: true })
        .eq('id', ideaId)
        .then(({ error }) => {
          if (error) console.error('Failed to save plan-reveal state to Supabase:', error.message)
        })
    }
  },

  // --- The Board: phases of grouped tasks, replacing the old flat
  // `tasks` list as the primary work surface (see
  // withMigratedMilestones above for how existing flat tasks arrive
  // here).
  addMilestone: (ideaId, title) => {
    const milestone = { id: crypto.randomUUID(), title, tasks: [] }
    const applyAdd = (i) => (i.id === ideaId ? { ...i, milestones: [...(i.milestones || []), milestone] } : i)
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyAdd),
      roomIdea: state.roomIdea ? applyAdd(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'milestones')
  },

  addMilestoneTask: (ideaId, milestoneIndex, text) => {
    const applyAdd = (i) => {
      if (i.id !== ideaId) return i
      const milestones = (i.milestones || []).map((m, idx) =>
        idx === milestoneIndex ? { ...m, tasks: [...m.tasks, { text, done: false }] } : m
      )
      return { ...i, milestones }
    }
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyAdd),
      roomIdea: state.roomIdea ? applyAdd(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'milestones')
  },

  toggleMilestoneTask: (ideaId, milestoneIndex, taskIndex) => {
    const applyToggle = (i) => {
      if (i.id !== ideaId) return i
      const milestones = (i.milestones || []).map((m, mIdx) => {
        if (mIdx !== milestoneIndex) return m
        const tasks = m.tasks.map((t, tIdx) => (tIdx === taskIndex ? { ...t, done: !t.done } : t))
        return { ...m, tasks }
      })
      return { ...i, milestones }
    }
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyToggle),
      roomIdea: state.roomIdea ? applyToggle(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'milestones')
  },

  // Used by the Logbook's "add" button on an AI check-in suggestion —
  // there's no "current milestone" concept to target, so this creates
  // a default one on first use rather than forcing you to have already
  // built out the Board before check-in suggestions are useful.
  addTaskToFirstMilestone: (ideaId, text) => {
    const idea = get().plantedIdeas.find((i) => i.id === ideaId)
    if (!idea) return
    if (!idea.milestones || idea.milestones.length === 0) {
      get().addMilestone(ideaId, 'Tasks')
    }
    get().addMilestoneTask(ideaId, 0, text)
  },

  // --- Research: reference notes, links, and open questions.
  addResearchNote: (ideaId, text) => {
    const entry = { text, createdAt: new Date().toISOString() }
    const applyAdd = (i) => (i.id === ideaId ? { ...i, research: [...(i.research || []), entry] } : i)
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyAdd),
      roomIdea: state.roomIdea ? applyAdd(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'research')
  },

  // --- Decisions: pros/cons, risks, and alternatives considered —
  // kept as one list tagged by `kind` rather than three separate
  // columns, since they're all "a reasoning note about the idea" and
  // the UI just filters by kind per section.
  addDecision: (ideaId, kind, text) => {
    const entry = { kind, text, createdAt: new Date().toISOString() }
    const applyAdd = (i) => (i.id === ideaId ? { ...i, decisions: [...(i.decisions || []), entry] } : i)
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyAdd),
      roomIdea: state.roomIdea ? applyAdd(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'decisions')
  },

  // --- Ledger: resources, people, and a simple budget.
  addLedgerResource: (ideaId, text) => {
    const applyAdd = (i) => {
      if (i.id !== ideaId) return i
      const ledger = i.ledger || {}
      return { ...i, ledger: { ...ledger, resources: [...(ledger.resources || []), { text, have: false }] } }
    }
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyAdd),
      roomIdea: state.roomIdea ? applyAdd(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'ledger')
  },

  toggleLedgerResource: (ideaId, index) => {
    const applyToggle = (i) => {
      if (i.id !== ideaId) return i
      const ledger = i.ledger || {}
      const resources = (ledger.resources || []).map((r, idx) => (idx === index ? { ...r, have: !r.have } : r))
      return { ...i, ledger: { ...ledger, resources } }
    }
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyToggle),
      roomIdea: state.roomIdea ? applyToggle(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'ledger')
  },

  addLedgerPerson: (ideaId, text) => {
    const applyAdd = (i) => {
      if (i.id !== ideaId) return i
      const ledger = i.ledger || {}
      return { ...i, ledger: { ...ledger, people: [...(ledger.people || []), { text }] } }
    }
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyAdd),
      roomIdea: state.roomIdea ? applyAdd(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'ledger')
  },

  setLedgerBudget: (ideaId, field, value) => {
    const applySet = (i) => {
      if (i.id !== ideaId) return i
      const ledger = i.ledger || {}
      return { ...i, ledger: { ...ledger, [field]: value } }
    }
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applySet),
      roomIdea: state.roomIdea ? applySet(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'ledger')
  },

  // --- Notebook: the idea's foundation — goal, constraints, success
  // criteria. Just three plain text fields, saved together.
  updateNotebook: (ideaId, updates) => {
    const applyUpdate = (i) => (i.id === ideaId ? { ...i, notebook: { ...(i.notebook || {}), ...updates } } : i)
    set((state) => ({
      plantedIdeas: state.plantedIdeas.map(applyUpdate),
      roomIdea: state.roomIdea ? applyUpdate(state.roomIdea) : state.roomIdea,
    }))
    persistIdeaField(get, ideaId, 'notebook')
  },
}))
