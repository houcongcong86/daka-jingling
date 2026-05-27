import { ref, onUnmounted } from 'vue'

export function useSpeechSynthesis() {
  const isSupported = ref(false)
  const isSpeaking = ref(false)
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
   * 创建并配置一个 SpeechSynthesisUtterance，但不立即 speak。
   * 用于在用户手势同步栈中提前创建，确保 iOS Safari 能正确发声。
   */
  function createUtterance(text: string, rate: number = 0.9): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = rate
    utterance.pitch = 1.2
    utterance.volume = 1

    const voice = getChineseVoice()
    if (voice) {
      utterance.voice = voice
    }

    utterance.onstart = () => {
      isSpeaking.value = true
      startResumeKeeper()
    }
    utterance.onend = () => {
      isSpeaking.value = false
      stopResumeKeeper()
      currentUtterance = null
    }
    utterance.onerror = () => {
      isSpeaking.value = false
      stopResumeKeeper()
      currentUtterance = null
    }

    return utterance
  }

  /**
   * 在用户手势上下文中预激活语音合成引擎。
   * iOS Safari 要求首次 speak 必须在用户手势同步代码中执行，
   * 否则后续异步调用不会发声。
   * 加载语音列表，确保 getVoices() 可用。
   */
  function prime() {
    if (!isSupported.value) return
    window.speechSynthesis.getVoices()

    // 用非空内容激活音频引擎，音量为 0 用户听不到
    const silent = new SpeechSynthesisUtterance('\u0000')
    silent.volume = 0
    silent.lang = 'zh-CN'
    const voice = getChineseVoice()
    if (voice) silent.voice = voice
    window.speechSynthesis.speak(silent)
  }

  /**
   * 在用户手势同步栈中立即开始播报。
   * 关键：必须在用户手势回调中同步调用，iOS Safari 才会发声。
   * 返回 Promise 在播报结束时 resolve。
   */
  function speakNow(text: string, rate: number = 0.9): Promise<void> {
    return new Promise((resolve) => {
      if (!isSupported.value) {
        resolve()
        return
      }

      stopResumeKeeper()

      // 停止之前的播报
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel()
      }

      const utterance = createUtterance(text, rate)
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
      isSpeaking.value = true

      // 同步调用 speak()，必须在用户手势栈中
      window.speechSynthesis.speak(utterance)
      window.speechSynthesis.resume()
    })
  }

  /**
   * 异步播报（兼容旧调用方式）。
   * 注意：在 iOS Safari 上如果不在用户手势上下文中调用，可能无声。
   */
  function speak(text: string, rate: number = 0.9): Promise<void> {
    return speakNow(text, rate)
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

  return { isSupported, isSpeaking, speak, speakNow, stop, prime }
}
