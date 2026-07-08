import { useRef, useState } from 'react'
import { useGardenStore } from '../lib/store'
import { searchIdeas } from '../lib/searchIdeas'
import './SearchPanel.css'

// Tapping any ambient seed opens this — a single universal search over
// every idea you've kept, not a per-seed preview (every seed leads to
// the same place). Results render as small seed-shaped cards rather
// than generic list rows, matching the world's illustrated style.
//
// Two ways to plant an idea from here: tap a result for a full preview
// with a "Plant This Idea" button, or drag a result card straight down
// past a threshold — same action, just a more direct gesture for
// anyone who'd rather not open the preview first.
//
// The dragged card is rendered as a separate fixed-position "ghost"
// following the pointer, rather than translating the in-place grid
// item — the panel (and its results list) both clip overflow so a
// list scrolls properly, which meant a translated in-place item just
// visually vanished the moment it crossed that boundary instead of
// looking like it was being pulled out of the search bar.
const DRAG_PLANT_THRESHOLD = 90
const DRAG_CLICK_TOLERANCE = 6

export default function SearchPanel() {
  const searchOpen = useGardenStore((s) => s.searchOpen)
  const closeSearch = useGardenStore((s) => s.closeSearch)
  const ideas = useGardenStore((s) => s.ideas)
  const plantWithTransition = useGardenStore((s) => s.plantWithTransition)

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const dragStartY = useRef(0)
  const dragMoved = useRef(false)

  if (!searchOpen) return null

  const results = searchIdeas(ideas, query)

  function handleClose() {
    setQuery('')
    setSelected(null)
    closeSearch()
  }

  function handlePlant(idea) {
    plantWithTransition(idea)
    setSelected(null)
  }

  function handlePointerDown(e, idea) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStartY.current = e.clientY
    dragMoved.current = false
    setDragId(idea.id)
    setDragPos({ x: e.clientX, y: e.clientY })
  }

  function handlePointerMove(e) {
    if (dragId == null) return
    if (Math.abs(e.clientY - dragStartY.current) > DRAG_CLICK_TOLERANCE) dragMoved.current = true
    setDragPos({ x: e.clientX, y: e.clientY })
  }

  function handlePointerUp(e, idea) {
    if (dragId == null) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (e.clientY - dragStartY.current > DRAG_PLANT_THRESHOLD) {
      handlePlant(idea)
    } else if (!dragMoved.current) {
      setSelected(idea)
    }
    setDragId(null)
  }

  const dragDistance = dragId != null ? Math.max(0, dragPos.y - dragStartY.current) : 0

  return (
    <>
      <div className="search-backdrop" onClick={handleClose}>
        <div className="search-panel" onClick={(e) => e.stopPropagation()}>
          {!selected && (
            <>
              <div className="search-header">
                <input
                  autoFocus
                  className="search-input"
                  placeholder="search your ideas…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="search-close" onClick={handleClose} aria-label="Close search">
                  ✕
                </button>
              </div>

              <div className="search-results">
                {results.length === 0 && <p className="search-empty">no ideas found</p>}
                {results.map((idea) => (
                  <div
                    key={idea.id}
                    className="search-result"
                    style={dragId === idea.id ? { opacity: 0.2 } : undefined}
                    onPointerDown={(e) => handlePointerDown(e, idea)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(e) => handlePointerUp(e, idea)}
                  >
                    <div className="search-result-seed" />
                    <span className="search-result-title">{idea.title}</span>
                  </div>
                ))}
              </div>
              <p className="search-hint">tap an idea to preview it, or drag it down to plant</p>
            </>
          )}

          {selected && (
            <div className="search-preview">
              <button className="search-back" onClick={() => setSelected(null)}>
                ‹ back
              </button>
              <div className="search-result-seed search-preview-seed" />
              <h3 className="search-preview-title">{selected.title}</h3>
              <p className="search-preview-transcript">"{selected.transcript}"</p>
              {selected.summary && <p className="search-preview-summary">{selected.summary}</p>}
              <button className="search-plant" onClick={() => handlePlant(selected)}>
                Plant This Idea
              </button>
            </div>
          )}
        </div>
      </div>

      {dragId != null && (
        <div
          className="search-drag-ghost"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            opacity: Math.max(0.2, 1 - dragDistance / 260),
          }}
        >
          <div className="search-result-seed" />
        </div>
      )}
    </>
  )
}
