<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<template>
  <div class="celebration fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
    <div class="text-6xl font-bold text-green-400 animate-bounce drop-shadow-lg">
      {{ text }}
    </div>
    <div class="confetti absolute inset-0">
      <div v-for="i in 20" :key="i" class="confetti-piece" :style="{
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 0.5 + 's',
        animationDuration: 1 + Math.random() * 1 + 's',
        background: ['#FF6B6B','#4ECDC4','#FFB347','#66BB6A','#42A5F5','#AB47BC'][i % 6],
      }" />
    </div>
  </div>
</template>

<style scoped>
.confetti-piece {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: fall linear forwards;
}

@keyframes fall {
  to {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
</style>
