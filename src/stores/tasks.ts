import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task } from '../types'
import * as db from '../db'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loaded = ref(false)

  async function fetchTasks() {
    tasks.value = await db.getAllTasks()
    loaded.value = true
  }

  async function addTask(task: Omit<Task, 'id'>) {
    const id = await db.addTask(task)
    tasks.value.push({ ...task, id })
    tasks.value.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async function updateTask(id: number, data: Partial<Task>) {
    await db.updateTask(id, data)
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...data }
    }
  }

  async function deleteTask(id: number) {
    await db.deleteTask(id)
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  function getTodayTasks(): Task[] {
    const today = new Date()
    const day = today.getDay()
    return tasks.value.filter((t) => {
      if (t.schedule === 'daily') return true
      if (t.schedule === 'weekday') return day >= 1 && day <= 5
      if (t.schedule === 'weekend') return day === 0 || day === 6
      return false
    })
  }

  return { tasks, loaded, fetchTasks, addTask, updateTask, deleteTask, getTodayTasks }
})
