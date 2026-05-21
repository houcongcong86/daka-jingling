<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '../stores/tasks'
import { useRecordsStore } from '../stores/records'
import { useSettingsStore } from '../stores/settings'
import TaskForm from '../components/parent/TaskForm.vue'
import TaskItem from '../components/parent/TaskItem.vue'
import PointsHistory from '../components/parent/PointsHistory.vue'
import type { Task } from '../types'

const router = useRouter()
const tasksStore = useTasksStore()
const recordsStore = useRecordsStore()
const settingsStore = useSettingsStore()

const password = ref('')
const authenticated = ref(false)
const passwordError = ref(false)
const showForm = ref(false)
const editingTask = ref<Task | null>(null)
const activeTab = ref<'tasks' | 'history' | 'settings'>('tasks')

function verify() {
  if (settingsStore.verifyPassword(password.value)) {
    authenticated.value = true
    passwordError.value = false
  } else {
    passwordError.value = true
  }
}

function goBack() {
  router.push('/')
}

function openAddForm() {
  editingTask.value = null
  showForm.value = true
}

function openEditForm(task: Task) {
  editingTask.value = task
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingTask.value = null
}

async function handleSave(data: { name: string; points: number; schedule: Task['schedule']; daysOfWeek: number[] }) {
  if (editingTask.value) {
    await tasksStore.updateTask(editingTask.value.id!, {
      name: data.name,
      points: data.points,
      schedule: data.schedule,
      daysOfWeek: data.schedule === 'custom' ? data.daysOfWeek : [],
    })
  } else {
    const maxOrder = Math.max(...tasksStore.tasks.map((t) => t.sortOrder), 0)
    await tasksStore.addTask({
      name: data.name,
      points: data.points,
      schedule: data.schedule,
      daysOfWeek: data.schedule === 'custom' ? data.daysOfWeek : [],
      sortOrder: maxOrder + 1,
      createdAt: new Date().toISOString(),
    })
  }
  closeForm()
}

async function handleDelete(id: number) {
  await tasksStore.deleteTask(id)
}
</script>

<template>
  <div class="parent-view min-h-screen p-4" style="background: #F5F5F5;">
    <!-- 顶部 -->
    <div class="flex items-center gap-3 mb-4">
      <button class="text-gray-500 text-xl p-1" @click="goBack">←</button>
      <div class="text-xl font-bold text-gray-700">打卡精灵管理</div>
    </div>

    <!-- 密码验证 -->
    <div v-if="!authenticated" class="flex flex-col items-center justify-center py-20">
      <div class="text-lg font-bold text-gray-600 mb-4">请输入家长密码</div>
      <input
        v-model="password"
        type="password"
        class="border rounded-xl px-4 py-3 text-center text-lg w-48 outline-none focus:border-orange-400"
        placeholder="输入密码"
        @keyup.enter="verify"
      />
      <button
        class="mt-4 bg-orange-400 text-white px-8 py-2 rounded-xl text-lg font-bold shadow"
        @click="verify"
      >
        确认
      </button>
      <div v-if="passwordError" class="text-red-400 mt-2">密码错误，请重试</div>
    </div>

    <!-- 管理内容 -->
    <div v-else>
      <!-- 标签切换 -->
      <div class="flex gap-2 mb-4">
        <button
          class="px-4 py-2 rounded-xl text-sm font-medium transition"
          :class="activeTab === 'tasks' ? 'bg-orange-400 text-white' : 'bg-white text-gray-500'"
          @click="activeTab = 'tasks'"
        >任务管理</button>
        <button
          class="px-4 py-2 rounded-xl text-sm font-medium transition"
          :class="activeTab === 'history' ? 'bg-orange-400 text-white' : 'bg-white text-gray-500'"
          @click="activeTab = 'history'"
        >积分记录</button>
        <button
          class="px-4 py-2 rounded-xl text-sm font-medium transition"
          :class="activeTab === 'settings' ? 'bg-orange-400 text-white' : 'bg-white text-gray-500'"
          @click="activeTab = 'settings'"
        >设置</button>
      </div>

      <!-- 任务管理 -->
      <div v-if="activeTab === 'tasks'">
        <div class="space-y-2 mb-4">
          <TaskItem
            v-for="task in tasksStore.tasks"
            :key="task.id"
            :task="task"
            @edit="openEditForm"
            @delete="handleDelete"
          />
        </div>
        <button
          class="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl py-3 text-gray-400 font-bold text-lg"
          @click="openAddForm"
        >
          + 添加任务
        </button>
      </div>

      <!-- 积分记录 -->
      <div v-if="activeTab === 'history'">
        <PointsHistory :records="recordsStore.allRecords" />
      </div>

      <!-- 设置 -->
      <div v-if="activeTab === 'settings'" class="bg-white rounded-2xl p-4 shadow-sm">
        <div class="mb-3">
          <label class="text-sm text-gray-500">孩子称呼</label>
          <input
            :value="settingsStore.settings.childName"
            class="border rounded-xl px-3 py-2 w-full mt-1 outline-none focus:border-orange-400"
            @input="(e) => settingsStore.updateSettings({ childName: (e.target as HTMLInputElement).value })"
          />
        </div>
        <div class="mb-3">
          <label class="text-sm text-gray-500">语音速度 ({{ settingsStore.settings.voiceSpeed }})</label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            :value="settingsStore.settings.voiceSpeed"
            class="w-full mt-1"
            @input="(e) => settingsStore.updateSettings({ voiceSpeed: parseFloat((e.target as HTMLInputElement).value) })"
          />
        </div>
        <div class="mb-3">
          <label class="text-sm text-gray-500">修改家长密码</label>
          <input
            type="password"
            class="border rounded-xl px-3 py-2 w-full mt-1 outline-none focus:border-orange-400"
            placeholder="新密码"
            @change="(e) => {
              const val = (e.target as HTMLInputElement).value
              if (val) settingsStore.updateSettings({ parentPassword: val })
            }"
          />
        </div>
      </div>

      <!-- 任务编辑弹窗 -->
      <div v-if="showForm" class="fixed inset-0 bg-black/30 z-40 flex items-end justify-center">
        <div class="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slide-up">
          <div class="flex justify-between items-center mb-4">
            <div class="text-lg font-bold text-gray-700">{{ editingTask ? '编辑任务' : '添加任务' }}</div>
            <button class="text-gray-400 text-xl" @click="closeForm">✕</button>
          </div>
          <TaskForm :task="editingTask" @save="handleSave" @cancel="closeForm" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parent-view {
  max-width: 500px;
  margin: 0 auto;
  min-height: 100dvh;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
