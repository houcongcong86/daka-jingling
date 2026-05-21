<script setup lang="ts">
import type { Task } from '../../types'

defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  edit: [task: Task]
  delete: [id: number]
}>()

const scheduleLabel: Record<string, string> = {
  daily: '每天',
  weekday: '工作日',
  weekend: '周末',
}
</script>

<template>
  <div class="task-item bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
    <div class="flex-1">
      <div class="font-bold text-gray-700">{{ task.name }}</div>
      <div class="text-xs text-gray-400">+{{ task.points }}分 · {{ scheduleLabel[task.schedule] || task.schedule }}</div>
    </div>
    <button class="text-blue-400 text-sm px-2" @click="emit('edit', task)">编辑</button>
    <button class="text-red-400 text-sm px-2" @click="emit('delete', task.id!)">删除</button>
  </div>
</template>
