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
const { speak, prime, isSpeaking } = useSpeechSynthesis()

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

async function handleVoiceResult() {
  const text = voiceStore.lastTranscript
  if (!text) return

  currentTranscript.value = text
  voiceStore.addDialog('user', text)

  const command = parseVoiceCommand(text)
  const response = await executeVoiceCommand(command)
  voiceStore.lastResponse = response
  voiceStore.addDialog('assistant', response)

  // 触发庆祝效果
  if (command.type === 'complete_task') {
    celebrationText.value = `+${todayTasks.value.find((t) => t.name === command.taskName)?.points || 0}`
    showCelebration.value = true
    setTimeout(() => { showCelebration.value = false }, 2000)
  }

  voiceStore.setSpeaking(true)
  await speak(response, settingsStore.settings.voiceSpeed)
  voiceStore.setSpeaking(false)
}

async function onVoiceStart() {
  // 在用户手势中预触发语音合成（iOS Safari 需要）
  prime()

  voiceStore.setListening(true)
  transcript.value = ''
  start()
}

async function onVoiceEnd() {
  // 等待识别完全结束（onend 触发），确保转录结果已更新
  await stop()
  voiceStore.setListening(false)

  const text = transcript.value
  if (text) {
    voiceStore.lastTranscript = text
    await handleVoiceResult()
  } else {
    // 没有识别到语音时也给用户反馈
    const msg = '我没有听到声音，请按住按钮说话哦'
    voiceStore.addDialog('assistant', msg)
    voiceStore.setSpeaking(true)
    await speak(msg, settingsStore.settings.voiceSpeed)
    voiceStore.setSpeaking(false)
  }
}

async function onManualComplete(taskName: string) {
  // 在用户手势中预触发语音合成（iOS Safari 需要）
  prime()

  voiceStore.lastTranscript = `${taskName}已完成`
  voiceStore.addDialog('user', `${taskName}已完成`)
  const command = parseVoiceCommand(`${taskName}已完成`)
  const response = await executeVoiceCommand(command)
  voiceStore.lastResponse = response
  voiceStore.addDialog('assistant', response)

  celebrationText.value = `+${todayTasks.value.find((t) => t.name === taskName)?.points || 0}`
  showCelebration.value = true
  setTimeout(() => { showCelebration.value = false }, 2000)

  voiceStore.setSpeaking(true)
  await speak(response, settingsStore.settings.voiceSpeed)
  voiceStore.setSpeaking(false)
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
