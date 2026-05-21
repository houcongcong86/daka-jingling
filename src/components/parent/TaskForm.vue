<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Task } from '../../types'

const props = defineProps<{
  task: Task | null
}>()

const emit = defineEmits<{
  save: [{ name: string; points: number; schedule: Task['schedule']; daysOfWeek: number[] }]
  cancel: []
}>()

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const name = ref('')
const points = ref(3)
const schedule = ref<Task['schedule']>('daily')
const daysOfWeek = ref<number[]>([])

const quickModes = [
  { value: 'daily', label: '每天' },
  { value: 'weekday', label: '工作日' },
  { value: 'weekend', label: '周末' },
  { value: 'custom', label: '自定义' },
] as const

const isCustom = computed(() => schedule.value === 'custom')

function toggleDay(day: number) {
  const idx = daysOfWeek.value.indexOf(day)
  if (idx === -1) {
    daysOfWeek.value.push(day)
  } else {
    daysOfWeek.value.splice(idx, 1)
  }
}

function selectQuick(mode: Task['schedule']) {
  schedule.value = mode
  if (mode === 'custom' && daysOfWeek.value.length === 0) {
    // 默认选中周一至周五
    daysOfWeek.value = [1, 2, 3, 4, 5]
  }
}

watch(
  () => props.task,
  (t) => {
    if (t) {
      name.value = t.name
      points.value = t.points
      schedule.value = t.schedule
      daysOfWeek.value = [...(t.daysOfWeek || [])]
    } else {
      name.value = ''
      points.value = 3
      schedule.value = 'daily'
      daysOfWeek.value = []
    }
  },
  { immediate: true }
)

function submit() {
  if (!name.value.trim()) return
  if (schedule.value === 'custom' && daysOfWeek.value.length === 0) {
    return // 自定义模式至少选一天
  }
  emit('save', {
    name: name.value.trim(),
    points: points.value,
    schedule: schedule.value,
    daysOfWeek: schedule.value === 'custom' ? daysOfWeek.value : [],
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
      <div class="flex flex-wrap gap-2 mt-1">
        <button
          v-for="mode in quickModes"
          :key="mode.value"
          class="px-3 py-1.5 rounded-xl text-sm font-medium transition"
          :class="schedule === mode.value ? 'bg-orange-400 text-white shadow' : 'bg-gray-100 text-gray-500'"
          @click="selectQuick(mode.value)"
        >{{ mode.label }}</button>
      </div>
      <!-- 自定义：选具体星期 -->
      <div v-if="isCustom" class="flex flex-wrap gap-2 mt-2">
        <button
          v-for="day in 7"
          :key="day"
          class="w-9 h-9 rounded-full text-sm font-bold transition"
          :class="daysOfWeek.includes(day % 7)
            ? 'bg-orange-400 text-white shadow'
            : 'bg-gray-50 text-gray-400 border border-gray-200'"
          @click="toggleDay(day % 7)"
        >{{ ['日','一','二','三','四','五','六'][day % 7] }}</button>
      </div>
      <div v-if="isCustom && daysOfWeek.length === 0" class="text-xs text-red-400 mt-1">
        请至少选择一天
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
