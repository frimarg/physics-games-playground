import { GameState, GameConfig, BlackHoleEffect } from '../types'
import { createBird, updateBird, jumpBird, isBirdOutOfBounds } from './bird'
import { createPipe, updatePipes, shouldSpawnPipe, checkAnyCollision, countPassedPipes } from './pipes'
import { GAME_CONFIG, CANVAS } from '../config/constants'
import {
  createInitialChaos,
  updateChaos,
  checkChaosCollision,
  checkElectricPipeCollision,
  applyVortexForce,
  checkGravityFlipTrigger,
  applySchrodingerEffect,
  revealSchrodingerPipe,
  makeElectricPipe,
  updateElectricPipe,
} from './chaos'

// Black hole animation settings
const BLACK_HOLE_DURATION = 150 // frames (~2.5 seconds at 60fps)
const PULL_PHASE = 0.4    // 0-40% of animation (bird pulled toward hole, spinning)
const STRETCH_PHASE = 1.0 // 40-100% of animation (spaghettification through center)

// Frame counter for chaos spawning
let frameCount = 0

function createInitialBlackHole(): BlackHoleEffect {
  return {
    active: false,
    progress: 0,
    phase: 'none',
    hasTriggeredThisGame: false,
    waitingToResume: false,
  }
}

function getBlackHolePhase(progress: number): BlackHoleEffect['phase'] {
  if (progress < PULL_PHASE) return 'pulling'
  if (progress < STRETCH_PHASE) return 'stretching'
  return 'none'
}

export function createInitialState(bestScore: number = 0): GameState {
  return {
    bird: createBird(),
    pipes: [],
    score: 0,
    bestScore,
    status: 'ready',
    config: {
      speed: GAME_CONFIG.speed.default,
      jumpHeight: GAME_CONFIG.jumpHeight.default,
      gravity: GAME_CONFIG.gravity.default,
      physicsType: 'parabolic',
      pipeGap: GAME_CONFIG.pipeGap.default,
      pipeSpacing: GAME_CONFIG.pipeSpacing.default,
      pipeWidth: GAME_CONFIG.pipeWidth,
      chaosEnabled: false,
      chaosHazards: {
        electricPillars: true,
        gammaRays: true,
        vortexes: true,
        particles: true,
        schrodingerPipes: true,
      },
    },
    blackHole: createInitialBlackHole(),
    chaos: createInitialChaos(),
  }
}

export function startGame(state: GameState): GameState {
  frameCount = 0 // Reset frame counter
  return {
    ...state,
    status: 'playing',
    bird: jumpBird(state.bird, state.config.jumpHeight, state.config.physicsType),
    chaos: {
      ...createInitialChaos(),
      enabled: state.config.chaosEnabled,
    },
  }
}

export function restartGame(state: GameState): GameState {
  return {
    ...createInitialState(state.bestScore),
    config: state.config, // Keep current config
  }
}

export function handleJump(state: GameState): GameState {
  // Don't allow jumps during black hole animation
  if (state.blackHole.active) {
    return state
  }

  // Resume after black hole - player clicked to continue
  if (state.blackHole.waitingToResume) {
    return {
      ...state,
      bird: jumpBird(state.bird, state.config.jumpHeight, state.config.physicsType),
      blackHole: {
        ...state.blackHole,
        waitingToResume: false,
      },
    }
  }

  if (state.status === 'ready') {
    return startGame(state)
  }

  if (state.status === 'playing') {
    return {
      ...state,
      bird: jumpBird(state.bird, state.config.jumpHeight, state.config.physicsType),
    }
  }

  // Click to restart when game is over
  if (state.status === 'over') {
    return startGame(restartGame(state))
  }

  return state
}

export function updateGame(state: GameState): GameState {
  if (state.status !== 'playing') {
    return state
  }

  // Waiting for player to click after black hole
  if (state.blackHole.waitingToResume) {
    return state
  }

  frameCount++

  // Handle black hole animation
  if (state.blackHole.active) {
    const newProgress = state.blackHole.progress + (1 / BLACK_HOLE_DURATION)

    // Animation complete - bird reappears in center, wait for player click
    if (newProgress >= 1) {
      return {
        ...state,
        pipes: [], // Clear all pipes to give player space
        bird: {
          ...state.bird,
          velocity: 0, // No movement until player clicks
          y: CANVAS.height / 2, // Center of screen
          x: 80, // Normal x position
        },
        blackHole: {
          ...state.blackHole,
          active: false,
          progress: 0,
          phase: 'none',
          waitingToResume: true, // Wait for player to click
        },
        chaos: {
          ...state.chaos,
          // Clear chaos obstacles too
          electricPillars: [],
          gammaRays: [],
          vortexes: [],
          particles: [],
        },
      }
    }

    // Continue animation (game paused)
    return {
      ...state,
      blackHole: {
        ...state.blackHole,
        progress: newProgress,
        phase: getBlackHolePhase(newProgress),
      },
    }
  }

  // Normal gameplay continues...

  // Update chaos state
  let newChaos = state.config.chaosEnabled
    ? updateChaos(state.chaos, state.config.speed, frameCount, state.config.chaosHazards)
    : state.chaos

  // Check gravity flip trigger
  if (state.config.chaosEnabled) {
    newChaos = checkGravityFlipTrigger(state.bird, newChaos)
  }

  // Calculate effective gravity (may be flipped!)
  const effectiveGravity = state.config.gravity * newChaos.gravityMultiplier

  // Update bird position with effective gravity
  let newBird = updateBird(
    state.bird,
    effectiveGravity,
    state.config.physicsType,
    state.config.jumpHeight
  )

  // Apply vortex force if chaos enabled
  if (state.config.chaosEnabled) {
    const vortexForce = applyVortexForce(newBird, newChaos)
    newBird = {
      ...newBird,
      x: Math.max(20, Math.min(newBird.x + vortexForce.vx, 150)), // Keep bird in playable area
      velocity: newBird.velocity + vortexForce.vy,
    }
  }

  // Update pipes
  let newPipes = updatePipes(state.pipes, state.config.speed)

  // Spawn new pipes
  if (shouldSpawnPipe(newPipes, state.config.pipeSpacing)) {
    let newPipe = createPipe(CANVAS.width + 50, state.config.pipeGap)

    // Apply Schrödinger effect if chaos mode
    if (state.config.chaosEnabled && newChaos.schrodingerMode) {
      newPipe = applySchrodingerEffect(newPipe, newChaos)
    }

    // Make some pipes electric if enabled (40% chance)
    if (state.config.chaosEnabled && state.config.chaosHazards.electricPillars && Math.random() < 0.4) {
      newPipe = makeElectricPipe(newPipe)
    }

    newPipes = [...newPipes, newPipe]
  }

  // Update electric pipes
  if (state.config.chaosEnabled && state.config.chaosHazards.electricPillars) {
    newPipes = newPipes.map(updateElectricPipe)
  }

  // Reveal Schrödinger pipes as bird approaches
  if (state.config.chaosEnabled) {
    newPipes = newPipes.map(pipe => revealSchrodingerPipe(pipe, newBird))
  }

  // Check for scoring
  const { pipes: scoredPipes, scored } = countPassedPipes(newBird, newPipes)
  newPipes = scoredPipes

  const newScore = state.score + scored
  const newBestScore = Math.max(newScore, state.bestScore)

  // Check if we just beat the best score (trigger black hole!)
  const justBeatBestScore =
    newScore > state.bestScore &&
    state.bestScore > 0 && // Must have a previous best
    !state.blackHole.hasTriggeredThisGame

  if (justBeatBestScore) {
    return {
      ...state,
      bird: newBird,
      pipes: newPipes,
      score: newScore,
      bestScore: newBestScore,
      chaos: newChaos,
      blackHole: {
        active: true,
        progress: 0,
        phase: 'pulling',
        hasTriggeredThisGame: true,
      },
    }
  }

  // Check for pipe collisions (excluding ghost pipes)
  const realPipes = newPipes.filter(p => !p.isGhost || !p.isRevealed)
  const hitPipe = checkAnyCollision(newBird, realPipes)
  const hitBounds = isBirdOutOfBounds(newBird)
  const hitChaos = checkChaosCollision(newBird, newChaos)
  const hitElectric = state.config.chaosEnabled && checkElectricPipeCollision(newBird, newPipes)

  if (hitPipe || hitBounds || hitChaos || hitElectric) {
    return {
      ...state,
      bird: newBird,
      pipes: newPipes,
      score: newScore,
      bestScore: newBestScore,
      chaos: newChaos,
      status: 'over',
    }
  }

  return {
    ...state,
    bird: newBird,
    pipes: newPipes,
    score: newScore,
    bestScore: newBestScore,
    chaos: newChaos,
  }
}

export function updateConfig(state: GameState, updates: Partial<GameConfig>): GameState {
  const newConfig = {
    ...state.config,
    ...updates,
  }

  // Sync chaos enabled state
  const newChaos = {
    ...state.chaos,
    enabled: newConfig.chaosEnabled,
  }

  return {
    ...state,
    config: newConfig,
    chaos: newChaos,
  }
}
