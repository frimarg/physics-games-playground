export const themes = {
  light: {
    background: 'bg-cream',
    text: 'text-navy',
    border: 'border-border',
    surface: 'bg-white',
  },
  dark: {
    background: 'bg-dark-bg',
    text: 'text-white',
    border: 'border-dark-surface',
    surface: 'bg-dark-surface',
  }
} as const

export type Theme = keyof typeof themes
