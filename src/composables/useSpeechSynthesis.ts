import { ref, onUnmounted } from 'vue'

export function useSpeechSynthesis() {
  const isSupported = ref(false)
  const isSpeaking = ref(false)
  let primed = false

  if ('speechSynthesis' in window) {
    isSupported.value = true
  }

  /**
   * 在用户手势上下文中预触发语音合成。
   * iOS Safari 要求首次 speak() 必须在用户手势同步代码中执行，
   * 否则后续异步调用不会发声。
   */
  function prime() {
    if (!isSupported.value || primed) return
    window.speechSynthesis.cancel()
    const silent = new SpeechSynthesisUtterance(' ')
    silent.volume = 0
    window.speechSynthesis.speak(silent)
    primed = true
  }

  function speak(text: string, rate: number = 0.9): Promise<void> {
    return new Promise((resolve) => {
      if (!isSupported.value) {
        resolve()
        return
      }
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = rate
      utterance.pitch = 1.2

      utterance.onstart = () => {
        isSpeaking.value = true
      }
      utterance.onend = () => {
        isSpeaking.value = false
        resolve()
      }
      utterance.onerror = () => {
        isSpeaking.value = false
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }

  function stop() {
    window.speechSynthesis.cancel()
    isSpeaking.value = false
  }

  onUnmounted(() => {
    window.speechSynthesis.cancel()
  })

  return { isSupported, isSpeaking, speak, stop, prime }
}
