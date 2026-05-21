import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DialogEntry } from '../types'

export const useVoiceStore = defineStore('voice', () => {
  const isListening = ref(false)
  const isSpeaking = ref(false)
  const lastTranscript = ref('')
  const lastResponse = ref('')
  const dialogHistory = ref<DialogEntry[]>([])

  function addDialog(role: 'user' | 'assistant', text: string) {
    dialogHistory.value.push({ role, text, time: new Date() })
    if (dialogHistory.value.length > 50) {
      dialogHistory.value = dialogHistory.value.slice(-50)
    }
  }

  function setListening(val: boolean) {
    isListening.value = val
  }

  function setSpeaking(val: boolean) {
    isSpeaking.value = val
  }

  function clearHistory() {
    dialogHistory.value = []
  }

  return {
    isListening,
    isSpeaking,
    lastTranscript,
    lastResponse,
    dialogHistory,
    addDialog,
    setListening,
    setSpeaking,
    clearHistory,
  }
})
