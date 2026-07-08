// Browser-native speech-to-text (Web Speech API) instead of recording
// audio and uploading it to Whisper — free, no API key or billing
// account needed. Trade-off: solid on Chrome/Android, unsupported or
// flaky on Safari/iOS — callers should treat a null return as "not
// supported here" and fall back to something else if that gap matters.
//
// One SpeechRecognition object is created once and reused for every
// capture, rather than a fresh one per capture. The underlying browser
// speech service takes a moment to actually release the previous
// session at the OS level, even after its JS-side onend has already
// fired — starting a brand-new instance right after almost always
// lands in that release window and fails with an "aborted" error.
// Reusing the same object avoids that teardown/recreate cycle entirely.
let sharedRecognition = null

function getRecognition() {
  if (sharedRecognition) return sharedRecognition
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognitionCtor) return null
  sharedRecognition = new SpeechRecognitionCtor()
  sharedRecognition.continuous = true
  sharedRecognition.interimResults = true
  sharedRecognition.lang = 'en-US'
  return sharedRecognition
}

export function createSpeechRecognizer({ onInterim, onError } = {}) {
  const recognition = getRecognition()
  if (!recognition) return null

  let finalTranscript = ''
  let stopping = false
  let ended = false
  let fatalError = null
  let startReject = null
  let stopResolve = null

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') return // just silence, keep listening
    fatalError = event.error
    const error = new Error(mapSpeechError(event.error))
    if (startReject) {
      // Still starting up — the caller's start() promise carries this.
      startReject(error)
    } else {
      // Already running — nothing is awaiting a promise for this, so the
      // caller needs an explicit callback or a mid-capture failure (e.g.
      // a network hiccup) would otherwise leave it stuck showing
      // "listening" forever with no way to surface what went wrong.
      onError?.(error)
    }
  }

  recognition.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      if (result.isFinal) finalTranscript += result[0].transcript + ' '
      else interim += result[0].transcript
    }
    onInterim?.((finalTranscript + interim).trim())
  }

  recognition.onend = () => {
    ended = true
    if (stopping) {
      stopResolve?.(finalTranscript.trim())
    } else if (!fatalError) {
      // Chrome ends the session after a pause even in continuous mode —
      // restart so listening continues until the user actually taps stop.
      // Deferred rather than called synchronously here — restarting
      // immediately, before the browser has fully torn down the
      // previous session, can throw/abort on some Chrome versions.
      setTimeout(() => {
        if (!stopping) {
          ended = false
          recognition.start()
        }
      }, 0)
    }
  }

  function start() {
    finalTranscript = ''
    stopping = false
    ended = false
    fatalError = null
    return new Promise((resolve, reject) => {
      recognition.onstart = () => {
        startReject = null
        resolve()
      }
      startReject = reject
      recognition.start()
    })
  }

  function stop() {
    return new Promise((resolve) => {
      // Set this unconditionally, first, before anything else — if
      // Chrome's own auto-end (see onend below) fires at nearly the same
      // moment as this call, the deferred restart it schedules checks
      // this flag afterward. Setting it only inside the branch below
      // left a window where that restart would still fire because it
      // ran the check before this line ever executed, resurrecting a
      // session the app already considered finished.
      stopping = true

      // A fatal error can end the session before stop() is ever called —
      // recognition.stop() on an already-ended recognizer won't fire
      // another onend, so waiting on one here would hang forever.
      if (ended) {
        resolve(finalTranscript.trim())
        return
      }
      stopResolve = resolve
      recognition.stop()
    })
  }

  return { start, stop }
}

function mapSpeechError(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Could not access the microphone — check your browser permissions.'
    case 'audio-capture':
      return 'No microphone found.'
    case 'network':
      return 'Speech recognition needs an internet connection.'
    case 'aborted':
      return 'Speech recognition was interrupted — try again.'
    default:
      // Included so an unfamiliar error code is diagnosable from a bug
      // report alone, instead of guessing blind at what actually failed.
      return `Speech recognition failed (${code}) — try again.`
  }
}
