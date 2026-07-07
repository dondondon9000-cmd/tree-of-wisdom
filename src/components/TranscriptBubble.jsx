import { useGardenStore } from '../lib/store'
import './TranscriptBubble.css'

// A comic-book-style speech bubble showing what got heard, as soon as
// it's known — before the idea ever becomes a permanent seed. Speech
// recognition sometimes mishears you; this is the moment to catch that
// and throw it away instead of discovering a nonsense seed later.
export default function TranscriptBubble() {
  const draft = useGardenStore((s) => s.draft)
  const discardDraft = useGardenStore((s) => s.discardDraft)
  const commitDraft = useGardenStore((s) => s.commitDraft)

  if (!draft) return null

  return (
    <div className="transcript-bubble">
      <div className="transcript-bubble-body">
        {draft.status === 'transcribing' && <p className="transcript-status">hearing you out…</p>}

        {draft.status === 'summarizing' && (
          <>
            <p className="transcript-text">"{draft.transcript}"</p>
            <p className="transcript-status">thinking it over…</p>
          </>
        )}

        {draft.status === 'ready' && (
          <>
            <p className="transcript-text">"{draft.transcript}"</p>
            <p className="transcript-title">{draft.title}</p>
            <div className="transcript-actions">
              <button className="transcript-discard" onClick={discardDraft}>
                discard
              </button>
              <button className="transcript-keep" onClick={commitDraft}>
                keep it
              </button>
            </div>
          </>
        )}

        {draft.status === 'error' && (
          <>
            <p className="transcript-error">{draft.error}</p>
            <div className="transcript-actions">
              <button className="transcript-discard" onClick={discardDraft}>
                okay
              </button>
            </div>
          </>
        )}
      </div>
      <div className="transcript-bubble-tail" />
    </div>
  )
}
