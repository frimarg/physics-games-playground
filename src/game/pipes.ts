import { Pipe, Bird } from '../types'
import { CANVAS, GAME_CONFIG } from '../config/constants'

const MIN_PIPE_HEIGHT = 80
const GROUND_HEIGHT = 80

export function createPipe(x: number, gap: number): Pipe {
  // Calculate available space for pipes
  const availableHeight = CANVAS.height - GROUND_HEIGHT - gap - (MIN_PIPE_HEIGHT * 2)

  // Random top pipe height
  const topHeight = MIN_PIPE_HEIGHT + Math.random() * availableHeight

  return {
    x,
    topHeight,
    bottomY: topHeight + gap,
    width: GAME_CONFIG.pipeWidth,
    passed: false,
  }
}

export function updatePipes(pipes: Pipe[], speed: number): Pipe[] {
  return pipes
    .map(pipe => ({
      ...pipe,
      x: pipe.x - speed,
    }))
    .filter(pipe => pipe.x + pipe.width > -50) // Remove pipes that are off screen
}

export function shouldSpawnPipe(pipes: Pipe[], pipeSpacing: number): boolean {
  if (pipes.length === 0) return true

  const lastPipe = pipes[pipes.length - 1]

  return lastPipe.x < CANVAS.width - pipeSpacing
}

export function checkPipeCollision(bird: Bird, pipe: Pipe): boolean {
  // Bird boundaries
  const birdLeft = bird.x
  const birdRight = bird.x + bird.width
  const birdTop = bird.y
  const birdBottom = bird.y + bird.height

  // Pipe boundaries
  const pipeLeft = pipe.x
  const pipeRight = pipe.x + pipe.width

  // Check if bird is horizontally within pipe
  if (birdRight > pipeLeft && birdLeft < pipeRight) {
    // Check collision with top pipe
    if (birdTop < pipe.topHeight) {
      return true
    }
    // Check collision with bottom pipe
    if (birdBottom > pipe.bottomY) {
      return true
    }
  }

  return false
}

export function checkAnyCollision(bird: Bird, pipes: Pipe[]): boolean {
  return pipes.some(pipe => checkPipeCollision(bird, pipe))
}

export function countPassedPipes(bird: Bird, pipes: Pipe[]): { pipes: Pipe[], scored: number } {
  let scored = 0

  const updatedPipes = pipes.map(pipe => {
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      scored++
      return { ...pipe, passed: true }
    }
    return pipe
  })

  return { pipes: updatedPipes, scored }
}
