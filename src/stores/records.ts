import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Record } from '../types'
import * as db from '../db'

export const useRecordsStore = defineStore('records', () => {
  const allRecords = ref<Record[]>([])
  const loaded = ref(false)

  const todayStr = computed(() => new Date().toISOString().slice(0, 10))

  const todayRecords = computed(() =>
    allRecords.value.filter((r) => r.date === todayStr.value)
  )

  const todayPoints = computed(() =>
    todayRecords.value.reduce((sum, r) => sum + r.points, 0)
  )

  const totalPoints = computed(() =>
    allRecords.value.reduce((sum, r) => sum + r.points, 0)
  )

  async function fetchRecords() {
    allRecords.value = await db.getRecordsByDateRange('2000-01-01', '2099-12-31')
    loaded.value = true
  }

  async function addRecord(record: Omit<Record, 'id'>) {
    const id = await db.addRecord(record)
    allRecords.value.push({ ...record, id })
  }

  function isTaskCompletedToday(taskId: number): boolean {
    return todayRecords.value.some((r) => r.taskId === taskId)
  }

  function getRemainingTaskNames(taskNames: string[]): string[] {
    const completedNames = new Set(todayRecords.value.map((r) => r.taskName))
    return taskNames.filter((n) => !completedNames.has(n))
  }

  return {
    allRecords,
    loaded,
    todayRecords,
    todayPoints,
    totalPoints,
    fetchRecords,
    addRecord,
    isTaskCompletedToday,
    getRemainingTaskNames,
  }
})
