<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../../types'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  edit: [task: Task]
  delete: [id: number]
}>()

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const scheduleLabel: Record<string, string> = {
  daily: '每天',
  weekday: '工作日',
  weekend: '周末',
  custom: '自定义',
}

const scheduleText = computed(() => {
  if (props.task.schedule === 'custom' && props.task.daysOfWeek?.length) {
    const days = props.task.daysOfWeek.map((d) => DAY_NAMES[d]).join(' ')
    return `+${props.task.points}分 · ${days}`
  }
  return `+${props.task.points}分 · ${scheduleLabel[props.task.schedule] || props.task.schedule}`
})
</script>

<template>
  <div class="task-item bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
    <div class="flex-1">
      <div class="font-bold text-gray-700">{{ task.name }}</div>
      <div class="text-xs text-gray-400">{{ scheduleText }}</div>
    </div>
    <button class="text-blue-400 text-sm px-2" @click="emit('edit', task)">编辑</button>
    <button class="text-red-400 text-sm px-2" @click="emit('delete', task.id!)">删除</button>
  </div>
</template>
