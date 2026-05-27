<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '../stores/tasks'
import { useRecordsStore } from '../stores/records'
import { useSettingsStore } from '../stores/settings'
import { useVoiceStore } from '../stores/voice'
import { useSpeechRecognition } from '../composables/useSpeechRecognition'
import { useSpeechSynthesis } from '../composables/useSpeechSynthesis'
import { parseVoiceCommand, executeVoiceCommand } from '../composables/useVoiceCommands'
import type { VoiceCommand } from '../types'
import PointsDisplay from '../components/child/PointsDisplay.vue'
import CharacterAvatar from '../components/child/CharacterAvatar.vue'
import TaskList from '../components/child/TaskList.vue'
import VoiceButton from '../components/child/VoiceButton.vue'
import VoiceDialog from '../components/child/VoiceDialog.vue'
import CelebrationEffect from '../components/child/CelebrationEffect.vue'

const router = useRouter()
const tasksStore = useTasksStore()
const recordsStore = useRecordsStore()
const settingsStore = useSettingsStore()
const voiceStore = useVoiceStore()
const { isSupported, start, stop, transcript } = useSpeechRecognition()
const { speak, speakNow, prime, isSpeaking } = useSpeechSynthesis()

const showCelebration = ref(false)
const celebrationText = ref('')
const currentTranscript = ref('')

const todayTasks = computed(() => tasksStore.getTodayTasks())

const completedNames = computed(() =>
  new Set(recordsStore.todayRecords.map((r) => r.taskName))
)

const pendingTasks = computed(() =>
  todayTasks.value.filter((t) => !completedNames.value.has(t.name))
)

async function onVoiceStart() {
  // 在用户手势中预激活语音合成引擎（iOS Safari 需要）
  prime()

  voiceStore.setListening(true)
  transcript.value = ''
  start()
}

function onVoiceEnd() {
  // 同步停止识别（不需要 await，stop 内部的 onend 回调会异步触发）
  stop()
  voiceStore.setListening(false)

  // 关键：在用户手势同步栈中立即处理并播报
  // iOS Safari 要求 speechSynthesis.speak() 在用户手势同步调用栈中执行才能发声
  const text = transcript.value
  if (text) {
    voiceStore.lastTranscript = text
    currentTranscript.value = text
    voiceStore.addDialog('user', text)

    const command = parseVoiceCommand(text)

    // 对于非 complete_task 的命令，executeVoiceCommand 是同步的，可以立即获取回复
    // 对于 complete_task，先同步播报一个确认，异步完成后再播报详细结果
    if (command.type !== 'complete_task') {
      const response = getSyncResponse(command)
      voiceStore.lastResponse = response
      voiceStore.addDialog('assistant', response)
      voiceStore.setSpeaking(true)
      speakNow(response, settingsStore.settings.voiceSpeed).then(() => {
        voiceStore.setSpeaking(false)
      })
    } else {
      // 完成任务命令：先播报即时确认（保持手势栈），再异步写入记录
      const taskName = command.taskName || ''
      const confirmMsg = taskName ? `好的，${taskName}完成！` : '好的！'
      voiceStore.addDialog('assistant', confirmMsg)
      voiceStore.setSpeaking(true)

      // 先在用户手势栈中同步 speak，激活音频引擎
      speakNow(confirmMsg, settingsStore.settings.voiceSpeed).then(() => {
        voiceStore.setSpeaking(false)
        // 异步写入记录并获取完整回复
        executeVoiceCommand(command).then((response) => {
          voiceStore.lastResponse = response
          voiceStore.addDialog('assistant', response)

          celebrationText.value = `+${todayTasks.value.find((t) => t.name === taskName)?.points || 0}`
          showCelebration.value = true
          setTimeout(() => { showCelebration.value = false }, 2000)

          // 此时 prime 已激活，后续 speak 应该可以发声
          voiceStore.setSpeaking(true)
          speak(response, settingsStore.settings.voiceSpeed).then(() => {
            voiceStore.setSpeaking(false)
          })
        })
      })
    }
  } else {
    // 没有识别到语音时也给用户反馈
    const msg = '我没有听到声音，请按住按钮说话哦'
    voiceStore.addDialog('assistant', msg)
    voiceStore.setSpeaking(true)
    speakNow(msg, settingsStore.settings.voiceSpeed).then(() => {
      voiceStore.setSpeaking(false)
    })
  }
}

/** 同步获取语音命令的回复（不涉及 IndexedDB 写入的命令） */
function getSyncResponse(command: VoiceCommand): string {
  const tasksStore_ = useTasksStore()
  const recordsStore_ = useRecordsStore()

  switch (command.type) {
    case 'query_tasks': {
      const tasks = tasksStore_.getTodayTasks()
      if (tasks.length === 0) return '你今天没有任务，可以好好玩啦！'
      const completed = recordsStore_.todayRecords.map((r) => r.taskName)
      const pending = tasks.filter((t) => !completed.includes(t.name))
      if (pending.length === 0) return '你今天的所有任务都已经完成啦！太棒了！'
      const names = pending.map((t) => t.name).join('、')
      const totalPoints = pending.reduce((s, t) => s + t.points, 0)
      return `你今天有 ${pending.length} 个任务：${names}。完成可以获得 ${totalPoints} 积分，加油哦！`
    }
    case 'query_remaining': {
      const tasks = tasksStore_.getTodayTasks()
      const remaining = recordsStore_.getRemainingTaskNames(tasks.map((t) => t.name))
      if (remaining.length === 0) return '你今天的所有任务都已经完成啦！太棒了！'
      const remainStr = remaining.join('、')
      return `你今天还有 ${remaining.length} 个任务没完成：${remainStr}。加油，你可以的！`
    }
    case 'query_points': {
      const total = recordsStore_.totalPoints
      const today = recordsStore_.todayPoints
      return `你现在一共有 ${total} 积分，今天获得了 ${today} 积分。继续加油攒积分吧！`
    }
    default:
      return '我没听明白，可以再说一遍吗？'
  }
}

async function onManualComplete(taskName: string) {
  // 在用户手势中预激活语音合成引擎（iOS Safari 需要）
  prime()

  voiceStore.lastTranscript = `${taskName}已完成`
  voiceStore.addDialog('user', `${taskName}已完成`)
  const command = parseVoiceCommand(`${taskName}已完成`)

  // 在用户手势同步栈中先播报即时确认
  const confirmMsg = `好的，${taskName}完成！`
  voiceStore.addDialog('assistant', confirmMsg)
  voiceStore.setSpeaking(true)

  speakNow(confirmMsg, settingsStore.settings.voiceSpeed).then(() => {
    voiceStore.setSpeaking(false)

    // 异步写入记录并获取完整回复
    executeVoiceCommand(command).then((response) => {
      voiceStore.lastResponse = response
      voiceStore.addDialog('assistant', response)

      celebrationText.value = `+${todayTasks.value.find((t) => t.name === taskName)?.points || 0}`
      showCelebration.value = true
      setTimeout(() => { showCelebration.value = false }, 2000)

      voiceStore.setSpeaking(true)
      speak(response, settingsStore.settings.voiceSpeed).then(() => {
        voiceStore.setSpeaking(false)
      })
    })
  })
}

function goToParent() {
  router.push('/parent')
}
</script>

<template>
  <div class="child-view min-h-screen flex flex-col p-4" style="background: #FFF8E7;">
    <!-- 顶部积分 -->
    <PointsDisplay
      :today-points="recordsStore.todayPoints"
      :total-points="recordsStore.totalPoints"
    />

    <!-- 打卡精灵角色 -->
    <div class="flex justify-center my-2">
      <CharacterAvatar
        :is-listening="voiceStore.isListening"
        :is-speaking="voiceStore.isSpeaking"
      />
    </div>

    <!-- 对话气泡 -->
    <div class="flex-1 overflow-y-auto mb-2 px-2">
      <VoiceDialog :dialog-history="voiceStore.dialogHistory" />
    </div>

    <!-- 任务列表 -->
    <div class="mb-3">
      <TaskList
        :tasks="todayTasks"
        :completed-names="completedNames"
        @complete="onManualComplete"
      />
    </div>

    <!-- 语音按钮 -->
    <div class="flex justify-center mb-2">
      <VoiceButton
        :is-supported="isSupported"
        :is-listening="voiceStore.isListening"
        :is-speaking="voiceStore.isSpeaking"
        @voice-start="onVoiceStart"
        @voice-end="onVoiceEnd"
      />
    </div>

    <!-- 底部文字提示 -->
    <div class="text-center text-sm text-gray-400 mb-2">
      按住说话，松手识别
    </div>

    <!-- 家长入口 -->
    <div class="text-center">
      <button
        class="text-gray-400 text-xs px-4 py-2"
        @click="goToParent"
      >
        ⚙️ 家长管理
      </button>
    </div>

    <!-- 庆祝特效 -->
    <CelebrationEffect v-if="showCelebration" :text="celebrationText" />
  </div>
</template>

<style scoped>
.child-view {
  max-width: 500px;
  margin: 0 auto;
  height: 100dvh;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}
</style>
