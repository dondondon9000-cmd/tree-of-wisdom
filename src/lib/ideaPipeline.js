import { createRecorder } from './recorder'
import { useGardenStore } from './store'

// Orchestrates one capture: mic recording -> Whisper transcript ->
// Haiku summary -> a draft the user can discard or keep. Nothing here
// ever writes a seed directly — commitDraft() (in the store) is the
// only path from draft to a real idea.
let recorder = null
let startingUp = null

export async function beginCapture() {
  // Optimistic: show "listening" the instant you tap, don't make the
  // seed wait on getUserMedia to resolve before reacting — that lag
  // (several hundred ms even with instant mic grants) reads as an
  // unresponsive button otherwise. Roll back if it actually fails.
  useGardenStore.getState().startRecording()

  const activeRecorder = createRecorder()
  recorder = activeRecorder
  startingUp = activeRecorder.start()

  try {
    await startingUp
  } catch (err) {
    if (recorder === activeRecorder) recorder = null
    useGardenStore.getState().stopRecording()
    useGardenStore.getState().setDraft({
      status: 'error',
      error: 'Could not access the microphone — check your browser permissions.',
    })
  } finally {
    startingUp = null
  }
}

export async function endCapture() {
  useGardenStore.getState().stopRecording()
  const activeRecorder = recorder
  const pendingStartup = startingUp
  recorder = null
  if (!activeRecorder) return

  try {
    if (pendingStartup) await pendingStartup // don't stop() before start() actually finished
    const blob = await activeRecorder.stop()
    useGardenStore.getState().setDraft({ status: 'transcribing' })

    const transcript = await transcribeAudio(blob)
    useGardenStore.getState().setDraft({ status: 'summarizing', transcript })

    const summary = await summarizeTranscript(transcript)
    useGardenStore.getState().setDraft({ status: 'ready', transcript, ...summary })
  } catch (err) {
    useGardenStore.getState().setDraft({ status: 'error', error: err.message })
  }
}

async function transcribeAudio(blob) {
  const audio = await blobToBase64(blob)
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio, mimeType: blob.type }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Transcription failed')
  return data.transcript
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
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
