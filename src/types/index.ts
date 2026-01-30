export type PhysicsType = 'parabolic' | 'linear' | 'exponential' | 'sine'

export interface Bird {
  x: number
  y: number
  velocity: number
  width: number
  height: number
  jumpTime: number // Frames since last jump (for physics calculations)
}

// Spaghettification effect state (black hole event)
export interface BlackHoleEffect {
  active: boolean
  progress: number // 0 to 1 (animation progress)
  phase: 'pulling' | 'stretching' | 'none'
  hasTriggeredThisGame: boolean
  waitingToResume: boolean // After black hole, wait for player click
}

export interface Pipe {
  x: number
  topHeight: number
  bottomY: number
  width: number
  passed: boolean
  isGhost?: boolean // For Schrödinger's Pipe - true = fake pipe
  isRevealed?: boolean // Whether the ghost status has been revealed
  // Electric pipe properties
  isElectric?: boolean
  electricActive?: boolean // Is electricity currently on?
  electricCycleTime?: number
  electricOnDuration?: number
  electricOffDuration?: number
}

// ============ PHYSICS CHAOS OBSTACLES ============

// Electric Pillars - bolts of electricity between two pillars
export interface ElectricPillar {
  id: string
  x: number
  topY: number
  bottomY: number
  width: number
  isActive: boolean // Is electricity flowing?
  cycleTime: number // Current position in on/off cycle
  onDuration: number // Frames electricity is on
  offDuration: number // Frames electricity is off (safe to pass)
}

// Gamma Ray Burst - horizontal beam with warning
export interface GammaRay {
  id: string
  y: number
  width: number // Full screen width
  height: number // Beam thickness
  warningTime: number // Frames of warning (flashing)
  activeTime: number // Frames beam is lethal
  state: 'warning' | 'active' | 'fading'
  progress: number // 0 to 1 within current state
}

// Gravity Flip Zone
export interface GravityFlip {
  id: string
  x: number
  width: number
  isActive: boolean
  duration: number // How long the flip lasts
  progress: number
}

// Vortex - pulls bird into circular orbit
export interface Vortex {
  id: string
  x: number
  y: number
  radius: number // Pull radius
  strength: number // Pull force
  rotation: number // Current rotation angle for visual
}

// Particle - fast-moving projectile
export interface Particle {
  id: string
  x: number
  y: number
  vx: number // Velocity X
  vy: number // Velocity Y
  radius: number
  color: string
}

// All chaos obstacles combined
export interface ChaosState {
  enabled: boolean
  electricPillars: ElectricPillar[]
  gammaRays: GammaRay[]
  gravityFlips: GravityFlip[]
  vortexes: Vortex[]
  particles: Particle[]
  schrodingerMode: boolean // Affects pipe generation
  gravityMultiplier: number // For gravity flip effect
  lastSpawnTime: number // To control spawn rate
}

// ============ GAME CONFIG & STATE ============

// Individual chaos hazard toggles
export interface ChaosHazards {
  electricPillars: boolean
  gammaRays: boolean
  vortexes: boolean
  particles: boolean
  schrodingerPipes: boolean
}

export interface GameConfig {
  speed: number
  jumpHeight: number
  gravity: number
  physicsType: PhysicsType
  pipeGap: number
  pipeSpacing: number
  pipeWidth: number
  chaosEnabled: boolean
  chaosHazards: ChaosHazards
}

export type GameStatus = 'ready' | 'playing' | 'over'

export interface GameState {
  bird: Bird
  pipes: Pipe[]
  score: number
  bestScore: number
  status: GameStatus
  config: GameConfig
  blackHole: BlackHoleEffect
  chaos: ChaosState
}
