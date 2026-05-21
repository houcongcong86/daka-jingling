export interface Task {
  id?: number
  name: string
  points: number
  schedule: 'daily' | 'weekday' | 'weekend' | 'custom'
  daysOfWeek: number[]   // 0=周日, 1=周一, ..., 6=周六
  sortOrder: number
  createdAt: string
}

export interface Record {
  id?: number
  taskId: number
  taskName: string
  points: number
  date: string
  completedAt: string
}

export interface Settings {
  childName: string
  voiceSpeed: number
  parentPassword: string
}

export type VoiceCommandType =
  | 'query_tasks'
  | 'complete_task'
  | 'query_remaining'
  | 'query_points'
  | 'unknown'

export interface VoiceCommand {
  type: VoiceCommandType
  taskName?: string
  text?: string
}

export interface DialogEntry {
  role: 'user' | 'assistant'
  text: string
  time: Date
}
