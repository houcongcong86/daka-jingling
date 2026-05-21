import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-xl font-bold',
    'card': 'bg-white rounded-2xl shadow-sm',
  },
  theme: {
    colors: {
      primary: '#FFB347',
      secondary: '#4FC3F7',
    },
  },
})
