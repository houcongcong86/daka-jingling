import { openDB, type IDBPDatabase } from 'idb'
import type { Task, Record, Settings } from '../types'

const DB_NAME = 'daka精灵'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', {
            keyPath: 'id',
            autoIncrement: true,
          })
          taskStore.createIndex('sortOrder', 'sortOrder')
        }
        if (!db.objectStoreNames.contains('records')) {
          const recordStore = db.createObjectStore('records', {
            keyPath: 'id',
            autoIncrement: true,
          })
          recordStore.createIndex('date', 'date')
          recordStore.createIndex('taskId', 'taskId')
          recordStore.createIndex('dateTaskId', ['date', 'taskId'], { unique: true })
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// ---- Tasks ----

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB()
  const tasks = await db.getAll('tasks')
  return tasks.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function addTask(task: Omit<Task, 'id'>): Promise<number> {
  const db = await getDB()
  return (await db.add('tasks', task)) as number
}

export async function updateTask(id: number, data: Partial<Task>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('tasks', id)
  if (existing) {
    await db.put('tasks', { ...existing, ...data })
  }
}

export async function deleteTask(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('tasks', id)
}

// ---- Records ----

export async function getRecordsByDate(date: string): Promise<Record[]> {
  const db = await getDB()
  const index = db.transaction('records').store.index('date')
  return index.getAll(date)
}

export async function addRecord(record: Omit<Record, 'id'>): Promise<number> {
  const db = await getDB()
  return (await db.add('records', record)) as number
}

export async function deleteRecord(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('records', id)
}

export async function getRecordsByDateRange(start: string, end: string): Promise<Record[]> {
  const db = await getDB()
  const all = await db.getAll('records')
  return all.filter((r) => r.date >= start && r.date <= end).sort((a, b) => b.completedAt.localeCompare(a.completedAt))
}

export async function isTaskCompletedToday(taskId: number): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10)
  const db = await getDB()
  const index = db.transaction('records').store.index('dateTaskId')
  const result = await index.get([today, taskId])
  return !!result
}

// ---- Settings ----

export async function getSetting(key: string): Promise<unknown> {
  const db = await getDB()
  const result = await db.get('settings', key)
  return result?.value
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB()
  await db.put('settings', { key, value })
}

const defaultSettings: Settings = {
  childName: '宝宝',
  voiceSpeed: 0.9,
  parentPassword: '1234',
}

export async function getSettings(): Promise<Settings> {
  const childName = (await getSetting('childName')) as string | undefined
  const voiceSpeed = (await getSetting('voiceSpeed')) as number | undefined
  const parentPassword = (await getSetting('parentPassword')) as string | undefined
  return {
    childName: childName ?? defaultSettings.childName,
    voiceSpeed: voiceSpeed ?? defaultSettings.voiceSpeed,
    parentPassword: parentPassword ?? defaultSettings.parentPassword,
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await setSetting('childName', s.childName)
  await setSetting('voiceSpeed', s.voiceSpeed)
  await setSetting('parentPassword', s.parentPassword)
}
