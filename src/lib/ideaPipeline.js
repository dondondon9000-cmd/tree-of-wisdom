import { createSpeechRecognizer } from './speechRecognizer'
import { useGardenStore } from './store'

// Orchestrates one capture: live speech-to-text -> Haiku summary -> a
// draft the user can discard or keep. Nothing here ever writes a seed
// directly — commitDraft() (in the store) is the only path from draft
// to a real idea.
let recognizer = null
let startingUp = null

export async function beginCapture() {
  // Optimistic: show "listening" the instant you tap, don't make the
  // seed wait on the mic permission prompt to resolve before reacting
  // — that lag reads as an unresponsive button otherwise. Roll back if
  // it actually fails.
  useGardenStore.getState().startRecording()
  useGardenStore.getState().setDraft({ status: 'listening', transcript: '' })

  const activeRecognizer = createSpeechRecognizer({
    onInterim: (text) => {
      // Only apply if this recognizer is still the active one — an
      // old one's late callback shouldn't stomp a newer capture.
      if (recognizer === activeRecognizer) {
        useGardenStore.getState().setDraft({ status: 'listening', transcript: text })
      }
    },
    onError: (err) => {
      // A fatal error mid-capture (not during startup) — without this,
      // the bubble would just get stuck showing "listening" forever
      // with no way out.
      if (recognizer === activeRecognizer) {
        recognizer = null
        useGardenStore.getState().stopRecording()
        useGardenStore.getState().setDraft({ status: 'error', error: err.message })
      }
    },
  })

  if (!activeRecognizer) {
    useGardenStore.getState().stopRecording()
    useGardenStore.getState().setDraft({
      status: 'error',
      error: 'Speech recognition is not supported in this browser — try Chrome.',
    })
    return
  }

  recognizer = activeRecognizer
  startingUp = activeRecognizer.start()

  try {
    await startingUp
  } catch (err) {
    if (recognizer === activeRecognizer) recognizer = null
    useGardenStore.getState().stopRecording()
    useGardenStore.getState().setDraft({ status: 'error', error: err.message })
  } finally {
    startingUp = null
  }
}

export async function endCapture() {
  useGardenStore.getState().stopRecording()
  const activeRecognizer = recognizer
  const pendingStartup = startingUp
  recognizer = null
  if (!activeRecognizer) return

  try {
    if (pendingStartup) await pendingStartup // don't stop() before start() actually finished
    const transcript = await activeRecognizer.stop()
    if (!transcript) {
      useGardenStore.getState().setDraft({ status: 'error', error: "Didn't catch anything — try again." })
      return
    }

    useGardenStore.getState().setDraft({ status: 'summarizing', transcript })
    const summary = await summarizeTranscript(transcript)
    useGardenStore.getState().setDraft({ status: 'ready', transcript, ...summary })
  } catch (err) {
    useGardenStore.getState().setDraft({ status: 'error', error: err.message })
  }
}

async function summarizeTranscript(transcript) {
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Summarization failed')
  return data
}
