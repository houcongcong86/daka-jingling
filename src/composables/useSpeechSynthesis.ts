import { ref, onUnmounted } from 'vue'

export function useSpeechSynthesis() {
  const isSupported = ref(false)
  const isSpeaking = ref(false)

  if ('speechSynthesis' in window) {
    isSupported.value = true
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

  return { isSupported, isSpeaking, speak, stop }
}
