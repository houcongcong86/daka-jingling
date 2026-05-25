import { ref, onUnmounted } from 'vue'

export function useSpeechSynthesis() {
  const isSupported = ref(false)
  const isSpeaking = ref(false)
  let primed = false
  let resumeTimer: ReturnType<typeof setInterval> | null = null
  let currentUtterance: SpeechSynthesisUtterance | null = null

  if ('speechSynthesis' in window) {
    isSupported.value = true
  }

  /** 选择中文语音，优先网络语音（iOS 上通常质量更好） */
  function getChineseVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices()
    return (
      voices.find(v => v.lang === 'zh-CN' && !v.localService)
      || voices.find(v => v.lang === 'zh-CN')
      || voices.find(v => v.lang.startsWith('zh'))
      || null
    )
  }

  /**
   * iOS Safari 的 speechSynthesis 在播报约 15 秒后会自动进入 paused 状态，
   * 导致长文本播报中途静音。需要定时调用 resume() 来保持播报。
   */
  function startResumeKeeper() {
    stopResumeKeeper()
    resumeTimer = setInterval(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    }, 3000)
  }

  function stopResumeKeeper() {
    if (resumeTimer) {
      clearInterval(resumeTimer)
      resumeTimer = null
    }
  }

  /**
   * 在用户手势上下文中预触发语音合成。
   * iOS Safari 要求首次 speak() 必须在用户手势同步代码中执行，
   * 否则后续异步调用不会发声。
   * 同时加载语音列表，确保 getVoices() 可用。
   */
  function prime() {
    if (!isSupported.value || primed) return
    window.speechSynthesis.cancel()

    // 触发语音列表加载（iOS Safari 异步加载 voices）
    window.speechSynthesis.getVoices()

    const silent = new SpeechSynthesisUtterance('')
    silent.volume = 0
    silent.lang = 'zh-CN'
    window.speechSynthesis.speak(silent)
    primed = true
  }

  function speak(text: string, rate: number = 0.9): Promise<void> {
    return new Promise((resolve) => {
      if (!isSupported.value) {
        resolve()
        return
      }

      // 停止之前的播报和保活定时器
      stopResumeKeeper()
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = rate
      utterance.pitch = 1.2
      utterance.volume = 1

      // 显式选择中文语音（iOS Safari 不设置 voice 可能使用默认无声音）
      const voice = getChineseVoice()
      if (voice) {
        utterance.voice = voice
      }

      utterance.onstart = () => {
        isSpeaking.value = true
        // 启动保活定时器，防止 iOS Safari 中途暂停
        startResumeKeeper()
      }
      utterance.onend = () => {
        isSpeaking.value = false
        stopResumeKeeper()
        currentUtterance = null
        resolve()
      }
      utterance.onerror = () => {
        isSpeaking.value = false
        stopResumeKeeper()
        currentUtterance = null
        resolve()
      }

      currentUtterance = utterance

      // iOS Safari: cancel() 后需要短暂延迟再 speak，否则可能静默失败
      setTimeout(() => {
        window.speechSynthesis.speak(utterance)
        // 立即 resume，防止 iOS Safari speak 后进入 paused 状态
        window.speechSynthesis.resume()
      }, 100)
    })
  }

  function stop() {
    stopResumeKeeper()
    window.speechSynthesis.cancel()
    currentUtterance = null
    isSpeaking.value = false
  }

  onUnmounted(() => {
    stop()
  })

  return { isSupported, isSpeaking, speak, stop, prime }
}
