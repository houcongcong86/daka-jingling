<script setup lang="ts">
defineProps<{
  todayPoints: number
  totalPoints: number
}>()
</script>

<template>
  <div class="flex justify-between items-center px-2 py-3">
    <div class="bg-white rounded-2xl px-4 py-2 shadow-sm">
      <div class="text-xs text-gray-400">今日积分</div>
      <div class="text-2xl font-bold text-orange-400">{{ todayPoints }}</div>
    </div>
    <div class="bg-white rounded-2xl px-4 py-2 shadow-sm">
      <div class="text-xs text-gray-400">总积分</div>
      <div class="text-2xl font-bold text-amber-500">{{ totalPoints }}</div>
    </div>
  </div>
</template>
