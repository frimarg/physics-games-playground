/**
 * Physics functions for the bird's jump behavior.
 *
 * Each function creates a VISUALLY DIFFERENT curve shape:
 *
 * LINEAR: Straight line up, then drops
 *   - Gravity disabled while ascending
 *   - Constant upward velocity
 *   - Sharp transition to falling
 *   - Shape: /\ (tent/triangle)
 *
 * PARABOLIC: Natural physics arc
 *   - Gravity always active
 *   - Velocity decreases smoothly
 *   - Shape: ⌢ (smooth curve)
 *
 * EXPONENTIAL: Quick burst, slow peak
 *   - Very strong initial push
 *   - Velocity decays rapidly (multiplied by decay factor)
 *   - Rises fast, slows dramatically near peak
 *   - Shape: steep rise, gentle peak, normal fall
 *
 * SINE: Wave-like rise
 *   - Position follows sine curve during ascent
 *   - Smooth acceleration then deceleration
 *   - Shape: S-curve rise, then normal fall
 */

import { PhysicsType } from '../types'

// Duration of the "special" jump behavior (in frames)
const JUMP_DURATION = {
  linear: 20,      // Frames of constant upward movement
  exponential: 25, // Frames before exponential decay completes
  sine: 25,        // Frames for sine wave ascent
}

/**
 * Calculate velocity change based on physics type.
 */
export function applyGravity(
  velocity: number,
  gravity: number,
  physicsType: PhysicsType,
  jumpTime: number,
  jumpHeight: number
): number {
  switch (physicsType) {
    case 'linear':
      // LINEAR: No gravity while ascending, then normal gravity
      // This creates a sharp "tent" shape: straight up, then straight down
      if (velocity < 0 && jumpTime < JUMP_DURATION.linear) {
        // Keep velocity constant (no gravity) while going up
        return velocity
      }
      // After ascent phase, apply stronger gravity for sharp transition
      return velocity + gravity * 1.2

    case 'exponential':
      // EXPONENTIAL: Velocity decays multiplicatively
      // Creates a quick burst that rapidly slows down
      if (velocity < 0) {
        // Decay the upward velocity exponentially
        const decayRate = 0.12
        const decayedVelocity = velocity * (1 - decayRate)
        // Add a bit of gravity to ensure we eventually fall
        return decayedVelocity + gravity * 0.5
      }
      // Normal gravity when falling
      return velocity + gravity

    case 'sine':
      // SINE: Velocity follows sine curve pattern during ascent
      // Creates smooth acceleration then deceleration
      if (jumpTime < JUMP_DURATION.sine && velocity < 0) {
        // Calculate where we are in the sine wave (0 to PI)
        const t = jumpTime / JUMP_DURATION.sine
        const sinePhase = t * Math.PI

        // Sine-based velocity modification
        // At t=0: full velocity, at t=0.5: slowing, at t=1: zero
        const sineFactor = Math.cos(sinePhase) // 1 -> 0 -> -1

        // Blend between initial velocity and zero based on sine
        const targetVelocity = -jumpHeight * Math.max(0, sineFactor) * 0.7

        // Smoothly interpolate toward target
        return velocity * 0.8 + targetVelocity * 0.2 + gravity * 0.3
      }
      // Normal gravity after sine phase
      return velocity + gravity

    case 'parabolic':
    default:
      // PARABOLIC: Classic physics - constant gravity
      // Creates natural arc: velocity decreases linearly
      return velocity + gravity
  }
}

/**
 * Calculate initial jump velocity based on physics type.
 */
export function applyJump(jumpHeight: number, physicsType: PhysicsType): number {
  switch (physicsType) {
    case 'linear':
      // Linear needs moderate constant velocity
      return -jumpHeight * 0.5

    case 'exponential':
      // Exponential needs STRONG initial burst (it decays fast)
      return -jumpHeight * 1.8

    case 'sine':
      // Sine needs moderate initial velocity
      return -jumpHeight * 0.9

    case 'parabolic':
    default:
      // Parabolic: standard velocity for natural arc
      return -jumpHeight
  }
}

/**
 * Update Y position based on velocity.
 */
export function updatePosition(y: number, velocity: number): number {
  return y + velocity
}
