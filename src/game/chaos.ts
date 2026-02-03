/**
 * Physics Chaos System
 *
 * Spawns and manages physics-themed obstacles:
 * - Electric Pillars: Timing-based electricity gaps
 * - Gamma Ray Burst: Horizontal beam with warning
 * - Gravity Flip: Reverses gravity temporarily
 * - Vortex: Pulls bird into circular orbit
 * - Particles: Fast projectiles to dodge
 * - Schrödinger's Pipe: One real, one fake
 */

import {
  ChaosState,
  ChaosHazards,
  GammaRay,
  Vortex,
  Particle,
  Bird,
  Pipe,
} from '../types'
import { CANVAS } from '../config/constants'

// Spawn configuration - more forgiving timing
const SPAWN_INTERVAL = 400 // Frames between possible spawns (was 300)
const SPAWN_CHANCE = 0.3 // 30% chance each interval (was 40%)

// Generate unique IDs
let idCounter = 0
const generateId = () => `chaos-${++idCounter}`

// ============ INITIALIZATION ============

export function createInitialChaos(): ChaosState {
  return {
    enabled: false,
    electricPillars: [],
    gammaRays: [],
    gravityFlips: [],
    vortexes: [],
    particles: [],
    schrodingerMode: false,
    gravityMultiplier: 1,
    lastSpawnTime: 0,
  }
}

// ============ SPAWNING ============

// Make a pipe electric (called when spawning pipes in chaos mode)
export function makeElectricPipe(pipe: Pipe): Pipe {
  return {
    ...pipe,
    isElectric: true,
    electricActive: false, // Start off so player can see it coming
    electricCycleTime: 0,
    electricOnDuration: 50, // ~0.8 seconds on
    electricOffDuration: 120, // 2 seconds off - good window to pass
  }
}

// Update electric state on a pipe
export function updateElectricPipe(pipe: Pipe): Pipe {
  if (!pipe.isElectric) return pipe

  const cycleTime = (pipe.electricCycleTime || 0) + 1
  const onDuration = pipe.electricOnDuration || 50
  const offDuration = pipe.electricOffDuration || 120
  const cycleDuration = onDuration + offDuration
  const cyclePosition = cycleTime % cycleDuration

  return {
    ...pipe,
    electricCycleTime: cycleTime,
    electricActive: cyclePosition < onDuration,
  }
}

function spawnGammaRay(): GammaRay {
  return {
    id: generateId(),
    y: 100 + Math.random() * (CANVAS.height - 280),
    width: CANVAS.width,
    height: 15, // Thinner beam (was 20)
    warningTime: 240, // 4 seconds warning (was 3)
    activeTime: 30, // 0.5 second lethal (was 1)
    state: 'warning',
    progress: 0,
  }
}

function spawnVortex(): Vortex {
  return {
    id: generateId(),
    x: CANVAS.width + 50,
    y: 150 + Math.random() * (CANVAS.height - 380),
    radius: 60, // Smaller pull area (was 80)
    strength: 0.15, // Much weaker pull (was 0.3)
    rotation: 0,
  }
}

function spawnParticle(): Particle {
  const fromLeft = Math.random() > 0.5
  const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#FF6600']

  return {
    id: generateId(),
    x: fromLeft ? -20 : CANVAS.width + 20,
    y: 100 + Math.random() * (CANVAS.height - 280),
    vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 3), // Slower (was 8-14, now 4-7)
    vy: (Math.random() - 0.5) * 2, // Less vertical movement (was 4)
    radius: 4 + Math.random() * 2, // Smaller (was 6-10, now 4-6)
    color: colors[Math.floor(Math.random() * colors.length)],
  }
}

// ============ UPDATE LOGIC ============

export function updateChaos(
  chaos: ChaosState,
  speed: number,
  frameCount: number,
  hazards: ChaosHazards
): ChaosState {
  if (!chaos.enabled) return chaos

  let newChaos = { ...chaos }

  // Electric pillars are now part of pipes, not separate obstacles
  newChaos.electricPillars = []

  // Update gamma rays
  newChaos.gammaRays = chaos.gammaRays
    .map(ray => {
      let newProgress = ray.progress + (1 / (ray.state === 'warning' ? ray.warningTime : ray.activeTime))
      let newState = ray.state

      if (newProgress >= 1) {
        if (ray.state === 'warning') {
          newState = 'active'
          newProgress = 0
        } else if (ray.state === 'active') {
          newState = 'fading'
          newProgress = 0
        } else {
          return null // Remove faded rays
        }
      }

      return { ...ray, state: newState, progress: newProgress }
    })
    .filter((r): r is GammaRay => r !== null)

  // Update gravity flips
  newChaos.gravityFlips = chaos.gravityFlips
    .map(flip => ({
      ...flip,
      x: flip.x - speed,
      progress: flip.isActive ? flip.progress + (1 / flip.duration) : flip.progress,
      isActive: flip.isActive && flip.progress < 1,
    }))
    .filter(f => f.x > -f.width)

  // Calculate gravity multiplier from active flips
  const activeFlip = newChaos.gravityFlips.find(f => f.isActive)
  newChaos.gravityMultiplier = activeFlip ? -1 : 1

  // Update vortexes
  newChaos.vortexes = chaos.vortexes
    .map(v => ({
      ...v,
      x: v.x - speed * 0.5, // Vortexes move slower
      rotation: v.rotation + 0.1,
    }))
    .filter(v => v.x > -v.radius * 2)

  // Update particles
  newChaos.particles = chaos.particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
    }))
    .filter(p => p.x > -50 && p.x < CANVAS.width + 50 && p.y > -50 && p.y < CANVAS.height + 50)

  // Build list of enabled hazard types (electric pillars are now on pipes, not separate)
  const enabledHazards: string[] = []
  if (hazards.gammaRays) enabledHazards.push('gamma')
  if (hazards.vortexes) enabledHazards.push('vortex')
  if (hazards.particles) enabledHazards.push('particles')

  // Spawn new obstacles based on enabled hazards
  if (enabledHazards.length > 0 && frameCount - chaos.lastSpawnTime > SPAWN_INTERVAL && Math.random() < SPAWN_CHANCE) {
    const hazardType = enabledHazards[Math.floor(Math.random() * enabledHazards.length)]

    switch (hazardType) {
      case 'gamma':
        if (newChaos.gammaRays.length < 1) { // Max 1 gamma ray at a time
          newChaos.gammaRays.push(spawnGammaRay())
        }
        break
      case 'vortex':
        newChaos.vortexes.push(spawnVortex())
        break
      case 'particles':
        // Spawn fewer particles (was 3, now 2)
        for (let i = 0; i < 2; i++) {
          newChaos.particles.push(spawnParticle())
        }
        break
    }

    newChaos.lastSpawnTime = frameCount
  }

  // Schrödinger mode based on toggle (not random anymore)
  newChaos.schrodingerMode = hazards.schrodingerPipes

  return newChaos
}

// ============ COLLISION DETECTION ============

// Check if bird is hit by electricity in a pipe gap
export function checkElectricPipeCollision(bird: Bird, pipes: Pipe[]): boolean {
  for (const pipe of pipes) {
    if (pipe.isElectric && pipe.electricActive) {
      const birdRight = bird.x + bird.width
      const birdLeft = bird.x

      // Check if bird is in the pipe's X range
      if (birdRight > pipe.x && birdLeft < pipe.x + pipe.width) {
        // Bird is in the pipe gap area (between top and bottom pipes)
        const birdTop = bird.y
        const birdBottom = bird.y + bird.height

        if (birdTop > pipe.topHeight && birdBottom < pipe.bottomY) {
          return true // Zapped in the gap!
        }
      }
    }
  }
  return false
}

export function checkChaosCollision(bird: Bird, chaos: ChaosState): boolean {
  if (!chaos.enabled) return false

  // Electric pipe collision is checked separately in engine.ts

  // Check gamma rays
  for (const ray of chaos.gammaRays) {
    if (ray.state === 'active') {
      const birdTop = bird.y
      const birdBottom = bird.y + bird.height

      if (birdBottom > ray.y && birdTop < ray.y + ray.height) {
        return true // Hit by gamma ray!
      }
    }
  }

  // Check particles
  for (const particle of chaos.particles) {
    const dx = bird.x + bird.width / 2 - particle.x
    const dy = bird.y + bird.height / 2 - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < particle.radius + Math.min(bird.width, bird.height) / 2) {
      return true // Hit by particle!
    }
  }

  return false
}

// ============ VORTEX EFFECT ============

export function applyVortexForce(bird: Bird, chaos: ChaosState): { vx: number; vy: number } {
  if (!chaos.enabled) return { vx: 0, vy: 0 }

  let totalVx = 0
  let totalVy = 0

  for (const vortex of chaos.vortexes) {
    const dx = vortex.x - (bird.x + bird.width / 2)
    const dy = vortex.y - (bird.y + bird.height / 2)
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < vortex.radius && distance > 10) {
      // Pull toward vortex center
      const force = vortex.strength * (1 - distance / vortex.radius)
      totalVx += (dx / distance) * force
      totalVy += (dy / distance) * force

      // Add tangential force (circular motion)
      const tangentX = -dy / distance
      const tangentY = dx / distance
      totalVx += tangentX * force * 0.5
      totalVy += tangentY * force * 0.5
    }
  }

  return { vx: totalVx, vy: totalVy }
}

// ============ GRAVITY FLIP CHECK ============

export function checkGravityFlipTrigger(bird: Bird, chaos: ChaosState): ChaosState {
  if (!chaos.enabled) return chaos

  const updatedFlips = chaos.gravityFlips.map(flip => {
    if (!flip.isActive && bird.x > flip.x && bird.x < flip.x + flip.width) {
      return { ...flip, isActive: true, progress: 0 }
    }
    return flip
  })

  return { ...chaos, gravityFlips: updatedFlips }
}

// ============ SCHRÖDINGER PIPE ============

export function applySchrodingerEffect(pipe: Pipe, chaos: ChaosState): Pipe {
  if (!chaos.enabled || !chaos.schrodingerMode) return pipe

  // 50% chance each pipe is a ghost (but only decide once)
  if (pipe.isGhost === undefined) {
    return {
      ...pipe,
      isGhost: Math.random() > 0.5,
      isRevealed: false,
    }
  }

  return pipe
}

export function revealSchrodingerPipe(pipe: Pipe, bird: Bird): Pipe {
  if (pipe.isGhost === undefined || pipe.isRevealed) return pipe

  // Reveal when bird gets close
  if (bird.x + bird.width > pipe.x - 50) {
    return { ...pipe, isRevealed: true }
  }

  return pipe
}
