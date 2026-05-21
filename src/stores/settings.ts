import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings } from '../types'
import * as db from '../db'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    childName: '宝宝',
    voiceSpeed: 0.9,
    parentPassword: '1234',
  })
  const loaded = ref(false)

  async function loadSettings() {
    settings.value = await db.getSettings()
    loaded.value = true
  }

  async function updateSettings(s: Partial<Settings>) {
    Object.assign(settings.value, s)
    await db.saveSettings(settings.value)
  }

  function verifyPassword(input: string): boolean {
    return input === settings.value.parentPassword
  }

  return { settings, loaded, loadSettings, updateSettings, verifyPassword }
})
