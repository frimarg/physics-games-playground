import { Bird, PhysicsType } from '../types'
import { BIRD, CANVAS } from '../config/constants'
import { applyGravity, applyJump, updatePosition } from './physics'

export function createBird(): Bird {
  return {
    x: BIRD.x,
    y: BIRD.startY,
    velocity: 0,
    width: BIRD.width,
    height: BIRD.height,
    jumpTime: 0,
  }
}

export function updateBird(
  bird: Bird,
  gravity: number,
  physicsType: PhysicsType,
  jumpHeight: number
): Bird {
  const newVelocity = applyGravity(
    bird.velocity,
    gravity,
    physicsType,
    bird.jumpTime,
    jumpHeight
  )
  const newY = updatePosition(bird.y, newVelocity)

  return {
    ...bird,
    velocity: newVelocity,
    y: newY,
    jumpTime: bird.jumpTime + 1, // Increment time since last jump
  }
}

export function jumpBird(bird: Bird, jumpHeight: number, physicsType: PhysicsType): Bird {
  return {
    ...bird,
    velocity: applyJump(jumpHeight, physicsType),
    jumpTime: 0, // Reset jump timer
  }
}

export function isBirdOutOfBounds(bird: Bird): boolean {
  const groundY = CANVAS.height - 80 // Ground height
  return bird.y + bird.height > groundY || bird.y < 0
}
