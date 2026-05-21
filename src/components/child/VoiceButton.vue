<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isSupported: boolean
  isListening: boolean
  isSpeaking: boolean
}>()

const emit = defineEmits<{
  voiceStart: []
  voiceEnd: []
}>()

const pressing = ref(false)

function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  pressing.value = true
  emit('voiceStart')
}

function onTouchEnd(e: TouchEvent) {
  e.preventDefault()
  pressing.value = false
  emit('voiceEnd')
}

function onClick() {
  // fallback for non-touch devices
  if (!pressing.value) {
    emit('voiceStart')
    setTimeout(() => emit('voiceEnd'), 3000)
  }
}
</script>

<template>
  <div v-if="!isSupported" class="text-sm text-gray-400 text-center">
    当前浏览器不支持语音识别，请使用 Safari 浏览器
  </div>
  <button
    v-else
    class="voice-btn w-20 h-20 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg transition-all duration-200 select-none"
    :class="{
      'bg-red-400 scale-110 shadow-xl': isListening,
      'bg-orange-400 hover:bg-orange-500': !isListening && !isSpeaking,
      'bg-blue-400': isSpeaking,
    }"
    @touchstart.prevent="onTouchStart"
    @touchend.prevent="onTouchEnd"
    @click="onClick"
  >
    <span class="text-2xl">{{ isListening ? '🔴' : isSpeaking ? '🔊' : '🎤' }}</span>
    <span class="text-xs mt-1">{{ isListening ? '聆听中' : isSpeaking ? '播报中' : '按住说' }}</span>
  </button>
</template>

<style scoped>
.voice-btn {
  -webkit-tap-highlight-color: transparent;
}
</style>
