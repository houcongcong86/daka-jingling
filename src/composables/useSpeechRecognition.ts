import { ref, onUnmounted } from 'vue'

export function useSpeechRecognition() {
  const isSupported = ref(false)
  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const error = ref<string | null>(null)

  let recognition: any = null
  let stopResolve: (() => void) | null = null

  const SpeechRecognitionAPI = (window as any).SpeechRecognition
    || (window as any).webkitSpeechRecognition

  if (SpeechRecognitionAPI) {
    isSupported.value = true
    recognition = new SpeechRecognitionAPI()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) transcript.value = final
      interimTranscript.value = interim
    }

    recognition.onerror = (event: any) => {
      error.value = event.error
      isListening.value = false
      // 出错时也 resolve，避免 Promise 挂起
      if (stopResolve) {
        stopResolve()
        stopResolve = null
      }
    }

    recognition.onend = () => {
      isListening.value = false
      // onend 在最后一次 onresult 之后触发，表示识别已完全结束
      if (stopResolve) {
        stopResolve()
        stopResolve = null
      }
    }
  }

  function start() {
    if (!recognition) return
    try {
      transcript.value = ''
      interimTranscript.value = ''
      error.value = null
      recognition.start()
      isListening.value = true
    } catch {
      // already started, ignore
    }
  }

  function stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!recognition) {
        resolve()
        return
      }
      stopResolve = resolve
      try {
        recognition.stop()
      } catch {
        // 如果 stop 失败（如未启动），立即 resolve
        isListening.value = false
        if (stopResolve) {
          stopResolve()
          stopResolve = null
        }
      }
    })
  }

  function toggle() {
    if (isListening.value) stop()
    else start()
  }

  onUnmounted(() => {
    if (recognition) {
      recognition.abort()
    }
  })

  return { isSupported, isListening, transcript, interimTranscript, error, start, stop, toggle }
}
