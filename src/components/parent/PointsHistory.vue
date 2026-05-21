<script setup lang="ts">
import type { Record } from '../../types'

defineProps<{
  records: Record[]
}>()

function formatDate(iso: string) {
  return iso.slice(0, 10)
}

function groupByDate(records: Record[]): [string, Record[]][] {
  const map = new Map<string, Record[]>()
  for (const r of records) {
    const date = formatDate(r.completedAt)
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(r)
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
}
</script>

<template>
  <div class="points-history" v-if="records.length > 0">
    <div v-for="[date, dayRecords] in groupByDate(records)" :key="date" class="mb-4">
      <div class="text-sm text-gray-400 font-bold mb-2">{{ date }}</div>
      <div class="space-y-1">
        <div
          v-for="r in dayRecords"
          :key="r.id"
          class="bg-white rounded-xl px-3 py-2 flex justify-between items-center text-sm shadow-sm"
        >
          <span class="text-gray-600">{{ r.taskName }}</span>
          <span class="text-green-500 font-bold">+{{ r.points }}</span>
        </div>
      </div>
      <div class="text-right text-xs text-gray-400 mt-1">
        本日合计: {{ dayRecords.reduce((s, r) => s + r.points, 0) }} 分
      </div>
    </div>
  </div>
  <div v-else class="text-center text-gray-400 py-8">
    暂无打卡记录
  </div>
</template>
