<script setup lang="ts">
import { onMounted } from 'vue'
import { useTasksStore } from './stores/tasks'
import { useRecordsStore } from './stores/records'
import { useSettingsStore } from './stores/settings'

const tasksStore = useTasksStore()
const recordsStore = useRecordsStore()
const settingsStore = useSettingsStore()

onMounted(async () => {
  await Promise.all([
    tasksStore.fetchTasks(),
    recordsStore.fetchRecords(),
    settingsStore.loadSettings(),
  ])
})
</script>

<template>
  <router-view />
</template>
