import type { VoiceCommand } from '../types'
import { useTasksStore } from '../stores/tasks'
import { useRecordsStore } from '../stores/records'

const QUERY_TASK_PATTERNS = [
  '今天有什么任务',
  '今天要做什么',
  '有什么任务',
  '今天的任务',
  '任务是什么',
  '我要做什么',
  '今天做什么',
]

const QUERY_REMAINING_PATTERNS = [
  '还剩几个',
  '还没做什么',
  '剩余任务',
  '还有几个',
  '没完成',
  '还有任务',
]

const QUERY_POINTS_PATTERNS = [
  '多少积分',
  '多少分',
  '积分',
  '我有几分',
  '看看积分',
  '我的积分',
]

const COMPLETE_KEYWORDS = [
  '已完成',
  '完成了',
  '做完了',
  '做好了',
  '搞定',
  '打卡',
  '做完了',
  '做完',
]

export function parseVoiceCommand(text: string): VoiceCommand {
  if (!text) return { type: 'unknown', text }

  // 查询任务
  if (QUERY_TASK_PATTERNS.some((p) => text.includes(p))) {
    return { type: 'query_tasks' }
  }

  // 查询剩余
  if (QUERY_REMAINING_PATTERNS.some((p) => text.includes(p))) {
    return { type: 'query_remaining' }
  }

  // 查询积分
  if (QUERY_POINTS_PATTERNS.some((p) => text.includes(p))) {
    return { type: 'query_points' }
  }

  // 完成任务: 找到任务名 + 完成关键词
  const tasksStore = useTasksStore()
  const todayTasks = tasksStore.getTodayTasks()

  for (const task of todayTasks) {
    const matched = COMPLETE_KEYWORDS.some((kw) => {
      // "背古诗已完成" 或 "背古诗打卡" 或 "已完成背古诗"
      return text.includes(task.name) && text.includes(kw)
    })
    if (matched) {
      return { type: 'complete_task', taskName: task.name }
    }
  }

  return { type: 'unknown', text }
}

export async function executeVoiceCommand(command: VoiceCommand): Promise<string> {
  const tasksStore = useTasksStore()
  const recordsStore = useRecordsStore()

  switch (command.type) {
    case 'query_tasks': {
      const tasks = tasksStore.getTodayTasks()
      if (tasks.length === 0) {
        return '你今天没有任务，可以好好玩啦！'
      }
      const completed = recordsStore.todayRecords.map((r) => r.taskName)
      const pending = tasks.filter((t) => !completed.includes(t.name))
      if (pending.length === 0) {
        return '你今天的所有任务都已经完成啦！太棒了！'
      }
      const names = pending.map((t) => t.name).join('、')
      const totalPoints = pending.reduce((s, t) => s + t.points, 0)
      return `你今天有 ${pending.length} 个任务：${names}。完成可以获得 ${totalPoints} 积分，加油哦！`
    }

    case 'complete_task': {
      if (!command.taskName) return '我没听清楚是什么任务，可以再说一遍吗？'
      const tasksStore_ = useTasksStore()
      const recordsStore_ = useRecordsStore()
      const task = tasksStore_.getTodayTasks().find((t) => t.name === command.taskName)
      if (!task) return `我没有找到"${command.taskName}"这个任务哦`
      if (recordsStore_.isTaskCompletedToday(task.id!)) {
        return `${command.taskName}已经完成过了，真棒！`
      }
      await recordsStore_.addRecord({
        taskId: task.id!,
        taskName: task.name,
        points: task.points,
        date: new Date().toISOString().slice(0, 10),
        completedAt: new Date().toISOString(),
      })
      const remaining = recordsStore_.getRemainingTaskNames(
        tasksStore_.getTodayTasks().map((t) => t.name)
      )
      if (remaining.length === 0) {
        return `太棒了！${command.taskName}完成，获得 ${task.points} 积分！你今天的所有任务都完成啦，太厉害了！`
      }
      const remainStr = remaining.join('、')
      return `太棒了！${command.taskName}完成，获得 ${task.points} 积分！你还有 ${remaining.length} 个任务哦：${remainStr}。继续加油！`
    }

    case 'query_remaining': {
      const tasksStore_ = useTasksStore()
      const recordsStore_ = useRecordsStore()
      const tasks = tasksStore_.getTodayTasks()
      const remaining = recordsStore_.getRemainingTaskNames(tasks.map((t) => t.name))
      if (remaining.length === 0) {
        return '你今天的所有任务都已经完成啦！太棒了！'
      }
      const remainStr = remaining.join('、')
      return `你今天还有 ${remaining.length} 个任务没完成：${remainStr}。加油，你可以的！`
    }

    case 'query_points': {
      const total = useRecordsStore().totalPoints
      const today = useRecordsStore().todayPoints
      return `你现在一共有 ${total} 积分，今天获得了 ${today} 积分。继续加油攒积分吧！`
    }

    default:
      return '我没听明白，可以再说一遍吗？'
  }
}
