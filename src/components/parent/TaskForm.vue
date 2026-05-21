<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Task } from '../../types'

const props = defineProps<{
  task: Task | null
}>()

const emit = defineEmits<{
  save: [{ name: string; points: number; schedule: Task['schedule'] }]
  cancel: []
}>()

const name = ref('')
const points = ref(3)
const schedule = ref<Task['schedule']>('daily')

watch(
  () => props.task,
  (t) => {
    if (t) {
      name.value = t.name
      points.value = t.points
      schedule.value = t.schedule
    } else {
      name.value = ''
      points.value = 3
      schedule.value = 'daily'
    }
  },
  { immediate: true }
)

function submit() {
  if (!name.value.trim()) return
  emit('save', {
    name: name.value.trim(),
    points: points.value,
    schedule: schedule.value,
  })
}
</script>

<template>
  <div class="task-form space-y-3">
    <div>
      <label class="text-sm text-gray-500">任务名称</label>
      <input
        v-model="name"
        class="border rounded-xl px-3 py-2 w-full mt-1 outline-none focus:border-orange-400"
        placeholder="如：背古诗"
      />
    </div>
    <div>
      <label class="text-sm text-gray-500">积分值</label>
      <div class="flex items-center gap-2 mt-1">
        <button
          class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold"
          @click="points = Math.max(1, points - 1)"
        >−</button>
        <span class="text-xl font-bold w-8 text-center text-orange-400">{{ points }}</span>
        <button
          class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold"
          @click="points = Math.min(100, points + 1)"
        >+</button>
      </div>
    </div>
    <div>
      <label class="text-sm text-gray-500">执行日期</label>
      <div class="flex gap-2 mt-1">
        <button
          class="px-3 py-1 rounded-xl text-sm"
          :class="schedule === 'daily' ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'"
          @click="schedule = 'daily'"
        >每天</button>
        <button
          class="px-3 py-1 rounded-xl text-sm"
          :class="schedule === 'weekday' ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'"
          @click="schedule = 'weekday'"
        >工作日</button>
        <button
          class="px-3 py-1 rounded-xl text-sm"
          :class="schedule === 'weekend' ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'"
          @click="schedule = 'weekend'"
        >周末</button>
      </div>
    </div>
    <div class="flex gap-3 pt-2">
      <button
        class="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold"
        @click="emit('cancel')"
      >取消</button>
      <button
        class="flex-1 bg-orange-400 text-white py-3 rounded-xl font-bold shadow"
        @click="submit"
      >保存</button>
    </div>
  </div>
</template>
