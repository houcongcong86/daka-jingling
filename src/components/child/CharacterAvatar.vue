<script setup lang="ts">
defineProps<{
  isListening: boolean
  isSpeaking: boolean
}>()
</script>

<template>
  <div class="character-avatar flex flex-col items-center">
    <div
      class="avatar-icon w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all duration-300"
      :class="{
        'bg-orange-100 shadow-lg scale-110': isListening,
        'bg-blue-100 shadow-lg': isSpeaking,
        'bg-amber-50 shadow': !isListening && !isSpeaking,
      }"
    >
      🧚
    </div>
    <div class="mt-1 text-lg font-bold text-orange-400">
      打卡精灵
    </div>
  </div>
</template>

<style scoped>
.avatar-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
</style>
