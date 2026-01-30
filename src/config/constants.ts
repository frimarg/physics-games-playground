export const GAME_CONFIG = {
  speed: { min: 1, max: 10, default: 4 },
  jumpHeight: { min: 3, max: 11, default: 7 },
  gravity: { min: 0.05, max: 1.0, default: 0.4 },
  pipeGap: { min: 100, max: 250, default: 160 },
  pipeSpacing: { min: 150, max: 400, default: 280 },
  pipeWidth: 60,
}

export const CANVAS = {
  width: 480,
  height: 640,
}

export const BIRD = {
  x: 80,
  startY: 300,
  width: 34,
  height: 28,
}

export const COLORS = {
  sky: '#87CEEB',
  skyGradientTop: '#E8F4F8',
  skyGradientBottom: '#B8D4E8',
  ground: '#8B7355',
  groundDark: '#6B5344',
  pipe: '#102544',
  pipeHighlight: '#1a3a5c',
  bird: '#102544',
  birdEye: '#F7F0E6',
  birdBeak: '#E8A87C',
  grid: 'rgba(16, 37, 68, 0.06)',
}
