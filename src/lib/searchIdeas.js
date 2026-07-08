// Plain-text search over committed ideas — matches title, transcript,
// summary, and keywords. Kept as a pure function, separate from the
// search UI, so it's testable without mounting any component.
export function searchIdeas(ideas, query) {
  const q = query.trim().toLowerCase()
  if (!q) return ideas

  return ideas.filter((idea) => {
    const haystack = [idea.title, idea.transcript, idea.summary, ...(idea.keywords || [])]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
