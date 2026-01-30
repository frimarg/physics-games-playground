export const translations = {
  en: {
    title: 'Flappy Physics',
    controls: 'Controls',
    speed: 'Speed',
    jumpHeight: 'Jump Height',
    score: 'Score',
    bestScore: 'Best',
    restart: 'Restart',
    gameOver: 'Game Over',
    clickToStart: 'Click to Start',
    pressSpace: 'or press Space',
  },
  is: {
    title: 'Flappy Eðlisfræði',
    controls: 'Stillingar',
    speed: 'Hraði',
    jumpHeight: 'Hopphæð',
    score: 'Stig',
    bestScore: 'Met',
    restart: 'Byrja aftur',
    gameOver: 'Leik lokið',
    clickToStart: 'Smelltu til að byrja',
    pressSpace: 'eða ýttu á bil',
  }
} as const

export type Language = keyof typeof translations
