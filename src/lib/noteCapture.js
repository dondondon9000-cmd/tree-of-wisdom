import { createSpeechRecognizer } from './speechRecognizer'

// A lighter-weight sibling of ideaPipeline.js's beginCapture/endCapture —
// used for adding brainstorm notes to an already-planted idea in the
// post-bloom dashboard. Just returns raw transcript text (no Haiku
// summarize step, no store draft state); callers pass their own
// onInterim/onDone/onError instead of this reaching into the store
// directly, since notes are scoped to whichever idea's workspace is
// open rather than a single global "draft."
//
// Same singleton-recognizer + silence-auto-stop pattern as
// ideaPipeline.js, kept as a separate module-level `recognizer`
// variable rather than sharing ideaPipeline's — the two never run at
// the same time in practice (recording a new idea happens in the
// World view, adding a note happens in the Garden's workspace overlay,
// and only one view is ever interactive at once) so there's no real
// collision risk despite both ultimately driving the same underlying
// SpeechRecognition singleton in speechRecognizer.js.
let recognizer = null
let startingUp = null

const SILENCE_TIMEOUT_MS = 1600
let silenceTimer = null

function clearSilenceTimer() {
  if (silenceTimer) {
    clearTimeout(silenceTimer)
    silenceTimer = null
  }
}

export function isNoteCapturing() {
  return !!recognizer
}

export function beginNoteCapture({ onInterim, onDone, onError }) {
  if (recognizer) return
  clearSilenceTimer()

  const activeRecognizer = createSpeechRecognizer({
    onInterim: (text) => {
      if (recognizer !== activeRecognizer) return
      onInterim?.(text)

      clearSilenceTimer()
      if (text.trim()) {
        silenceTimer = setTimeout(() => {
          if (recognizer === activeRecognizer) endNoteCapture(onDone)
        }, SILENCE_TIMEOUT_MS)
      }
    },
    onError: (err) => {
      if (recognizer === activeRecognizer) {
        recognizer = null
        onError?.(err.message)
      }
    },
  })

  if (!activeRecognizer) {
    onError?.('Speech recognition is not supported in this browser — try Chrome.')
    return
  }

  recognizer = activeRecognizer
  startingUp = activeRecognizer.start()
  startingUp
    .catch((err) => {
      if (recognizer === activeRecognizer) recognizer = null
      onError?.(err.message)
    })
    .finally(() => {
      startingUp = null
    })
}

export async function endNoteCapture(onDone) {
  clearSilenceTimer()
  const activeRecognizer = recognizer
  const pendingStartup = startingUp
  recognizer = null
  if (!activeRecognizer) return

  if (pendingStartup) await pendingStartup // don't stop() before start() actually finished
  const transcript = await activeRecognizer.stop()
  onDone?.(transcript)
}
