<script setup lang="ts">
import type { Task } from '../../types'

const props = defineProps<{
  tasks: Task[]
  completedNames: Set<string>
}>()

const emit = defineEmits<{
  complete: [taskName: string]
}>()

function handleClick(task: Task) {
  if (!props.completedNames.has(task.name)) {
    emit('complete', task.name)
  }
}
</script>

<template>
  <div class="task-list space-y-2">
    <div
      v-for="task in tasks"
      :key="task.id"
      class="task-item flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm cursor-pointer active:scale-98 transition-transform"
      :class="{ 'opacity-60': completedNames.has(task.name) }"
      @click="handleClick(task)"
    >
      <div
        class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all"
        :class="completedNames.has(task.name)
          ? 'bg-green-100 text-green-500'
          : 'bg-gray-100 text-gray-300'"
      >
        {{ completedNames.has(task.name) ? '✓' : '' }}
      </div>
      <div class="flex-1 text-lg font-medium" :class="completedNames.has(task.name) ? 'line-through text-gray-400' : 'text-gray-700'">
        {{ task.name }}
      </div>
      <div class="text-sm font-bold" :class="completedNames.has(task.name) ? 'text-green-400' : 'text-orange-300'">
        +{{ task.points }}
      </div>
    </div>
    <div v-if="tasks.length === 0" class="text-center text-gray-400 py-6 text-lg">
      还没有任务哦，让家长添加吧～
    </div>
  </div>
</template>
