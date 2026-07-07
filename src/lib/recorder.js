// Thin wrapper around the browser's mic recording APIs. One recorder
// instance per capture — start() asks for the mic and begins
// recording, stop() ends it and resolves with the recorded audio.
export function createRecorder() {
  let mediaRecorder = null
  let chunks = []
  let stream = null

  async function start() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks = []
    mediaRecorder = new MediaRecorder(stream)
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    mediaRecorder.start()
  }

  function stop() {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder) {
        reject(new Error('Recorder was never started'))
        return
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType })
        stream.getTracks().forEach((track) => track.stop())
        resolve(blob)
      }
      mediaRecorder.stop()
    })
  }

  return { start, stop }
}
