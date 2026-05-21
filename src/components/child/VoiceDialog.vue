<script setup lang="ts">
import type { DialogEntry } from '../../types'

defineProps<{
  dialogHistory: DialogEntry[]
}>()
</script>

<template>
  <div class="voice-dialog space-y-2 px-1">
    <div
      v-for="(entry, idx) in dialogHistory"
      :key="idx"
      class="flex"
      :class="entry.role === 'user' ? 'justify-end' : 'justify-start'"
    >
      <div
        class="max-w-[80%] rounded-2xl px-4 py-2 text-base leading-relaxed"
        :class="entry.role === 'user'
          ? 'bg-orange-400 text-white rounded-br-md'
          : 'bg-white text-gray-700 shadow-sm rounded-bl-md'"
      >
        {{ entry.text }}
      </div>
    </div>
    <div v-if="dialogHistory.length === 0" class="text-center text-gray-400 py-4 text-sm">
      点击麦克风对我说："今天有什么任务"
    </div>
  </div>
</template>
