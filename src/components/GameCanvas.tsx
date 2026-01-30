import { useRef, useEffect } from 'react'
import { GameState } from '../types'
import { CANVAS, COLORS } from '../config/constants'

interface GameCanvasProps {
  gameState: GameState
  onJump: () => void
}

// Phase timings (must match engine.ts)
const PULL_PHASE = 0.4
const STRETCH_PHASE = 1.0 // No ejecting phase anymore

// Calculate spaghettification distortion based on animation progress
function getSpaghettiScale(progress: number, phase: string): { scaleX: number; scaleY: number } {
  switch (phase) {
    case 'pulling':
      // Gradual stretching as bird is pulled toward singularity
      const pullT = progress / PULL_PHASE
      return {
        scaleX: 1 + pullT * 0.8,
        scaleY: 1 - pullT * 0.3,
      }
    case 'stretching':
      // Maximum spaghettification as bird passes through!
      const stretchT = (progress - PULL_PHASE) / (STRETCH_PHASE - PULL_PHASE)
      const stretchIntensity = Math.sin(stretchT * Math.PI)
      return {
        scaleX: 1.8 + stretchIntensity * 3,
        scaleY: 0.7 - stretchIntensity * 0.5,
      }
    default:
      return { scaleX: 1, scaleY: 1 }
  }
}

// Calculate bird position as it travels through the black hole
function getBlackHolePosition(
  progress: number,
  phase: string,
  birdX: number,
  birdY: number,
  centerX: number,
  centerY: number
): { x: number; y: number } {
  switch (phase) {
    case 'pulling': {
      const pullT = progress / PULL_PHASE
      const easeIn = pullT * pullT * pullT // Cubic ease in - dramatic acceleration
      return {
        x: birdX + (centerX - birdX) * easeIn,
        y: birdY + (centerY - birdY) * easeIn,
      }
    }
    case 'stretching': {
      const stretchT = (progress - PULL_PHASE) / (STRETCH_PHASE - PULL_PHASE)
      return {
        x: centerX + stretchT * 40,
        y: centerY + Math.sin(stretchT * Math.PI) * 30,
      }
    }
    default:
      return { x: birdX, y: birdY }
  }
}

export function GameCanvas({ gameState, onJump }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        onJump()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onJump])

  // Force continuous re-render during black hole, waiting to resume, or chaos for smooth animation
  useEffect(() => {
    if (gameState.blackHole.active || gameState.blackHole.waitingToResume || gameState.config.chaosEnabled) {
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [gameState.blackHole.active, gameState.blackHole.waitingToResume, gameState.config.chaosEnabled])

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { blackHole, chaos } = gameState
    const time = Date.now() / 1000

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height)

    // Draw sky gradient (darker during black hole or chaos)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS.height - 80)
    if (blackHole.active) {
      const darkness = Math.min(blackHole.progress * 2, 0.8)
      skyGradient.addColorStop(0, `rgba(20, 10, 40, ${darkness})`)
      skyGradient.addColorStop(1, `rgba(10, 5, 30, ${darkness})`)
    } else if (chaos.enabled) {
      // Subtle purple tint for chaos mode
      skyGradient.addColorStop(0, '#E8E4F8')
      skyGradient.addColorStop(1, '#C8C4E8')
    } else {
      skyGradient.addColorStop(0, COLORS.skyGradientTop)
      skyGradient.addColorStop(1, COLORS.skyGradientBottom)
    }
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height - 80)

    // Draw subtle grid (hidden during black hole)
    if (!blackHole.active) {
      ctx.strokeStyle = chaos.enabled ? 'rgba(138, 43, 226, 0.08)' : COLORS.grid
      ctx.lineWidth = 1
      const gridSize = 30
      for (let x = 0; x < CANVAS.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS.height - 80)
        ctx.stroke()
      }
      for (let y = 0; y < CANVAS.height - 80; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS.width, y)
        ctx.stroke()
      }
    }

    // Draw gravity flip indicator
    if (chaos.enabled && chaos.gravityMultiplier < 0) {
      ctx.fillStyle = 'rgba(255, 0, 100, 0.1)'
      ctx.fillRect(0, 0, CANVAS.width, CANVAS.height - 80)

      ctx.fillStyle = 'rgba(255, 0, 100, 0.8)'
      ctx.font = '600 18px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('⬆️ GRAVITY FLIPPED ⬆️', CANVAS.width / 2, 30)
    }

    // Draw ground
    ctx.fillStyle = blackHole.active ? '#2a1a3a' : (chaos.enabled ? '#6B5380' : COLORS.ground)
    ctx.fillRect(0, CANVAS.height - 80, CANVAS.width, 80)

    // Ground texture lines (hidden during black hole)
    if (!blackHole.active) {
      ctx.strokeStyle = chaos.enabled ? '#5a4370' : COLORS.groundDark
      ctx.lineWidth = 2
      for (let x = 0; x < CANVAS.width; x += 20) {
        ctx.beginPath()
        ctx.moveTo(x, CANVAS.height - 80)
        ctx.lineTo(x + 10, CANVAS.height - 70)
        ctx.stroke()
      }
    }

    // ============ RENDER CHAOS OBSTACLES ============
    if (chaos.enabled && !blackHole.active) {
      // Electric pillars are now rendered as part of pipes (see pipe rendering below)

      // Draw gamma rays
      chaos.gammaRays.forEach(ray => {
        if (ray.state === 'warning') {
          // Flashing warning
          const flash = Math.sin(time * 10) > 0
          ctx.fillStyle = flash ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 0, 0, 0.1)'
          ctx.fillRect(0, ray.y - 5, CANVAS.width, ray.height + 10)

          // Warning text
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
          ctx.font = '600 14px "Inter", sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('☢️ GAMMA RAY WARNING ☢️', CANVAS.width / 2, ray.y - 10)
        } else if (ray.state === 'active') {
          // Deadly beam
          const beamGradient = ctx.createLinearGradient(0, ray.y, 0, ray.y + ray.height)
          beamGradient.addColorStop(0, 'rgba(255, 50, 50, 0.9)')
          beamGradient.addColorStop(0.5, 'rgba(255, 255, 100, 1)')
          beamGradient.addColorStop(1, 'rgba(255, 50, 50, 0.9)')
          ctx.fillStyle = beamGradient
          ctx.fillRect(0, ray.y, CANVAS.width, ray.height)

          // Core glow
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.fillRect(0, ray.y + ray.height / 2 - 2, CANVAS.width, 4)
        }
      })

      // Draw vortexes
      chaos.vortexes.forEach(vortex => {
        ctx.save()
        ctx.translate(vortex.x, vortex.y)

        // Swirling rings
        for (let ring = 0; ring < 5; ring++) {
          const ringRadius = vortex.radius * (0.3 + ring * 0.15)
          const alpha = 0.4 - ring * 0.07
          ctx.strokeStyle = `rgba(138, 43, 226, ${alpha})`
          ctx.lineWidth = 4 - ring * 0.5

          ctx.beginPath()
          ctx.arc(0, 0, ringRadius, vortex.rotation + ring * 0.5, vortex.rotation + ring * 0.5 + Math.PI * 1.5)
          ctx.stroke()
        }

        // Center
        ctx.fillStyle = 'rgba(50, 0, 80, 0.8)'
        ctx.beginPath()
        ctx.arc(0, 0, 15, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      })

      // Draw particles
      chaos.particles.forEach(particle => {
        ctx.save()

        // Glow
        ctx.shadowColor = particle.color
        ctx.shadowBlur = 15

        // Particle body
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius * 0.4, 0, Math.PI * 2)
        ctx.fill()

        // Trail
        ctx.strokeStyle = particle.color
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(particle.x - particle.vx * 5, particle.y - particle.vy * 5)
        ctx.stroke()

        ctx.restore()
      })
    }

    // Draw pipes
    gameState.pipes.forEach(pipe => {
      // Check if this is a Schrödinger ghost pipe
      const isGhostPipe = pipe.isGhost && pipe.isRevealed

      const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0)
      if (blackHole.active) {
        pipeGradient.addColorStop(0, '#1a0a2a')
        pipeGradient.addColorStop(1, '#0a0515')
      } else if (isGhostPipe) {
        // Ghost pipe - semi-transparent
        pipeGradient.addColorStop(0, 'rgba(100, 200, 100, 0.3)')
        pipeGradient.addColorStop(1, 'rgba(50, 150, 50, 0.3)')
      } else if (pipe.isGhost !== undefined && !pipe.isRevealed) {
        // Unrevealed Schrödinger pipe - looks normal but slightly different
        pipeGradient.addColorStop(0, '#2a5544')
        pipeGradient.addColorStop(0.5, '#1a4534')
        pipeGradient.addColorStop(1, '#1a4534')
      } else {
        pipeGradient.addColorStop(0, COLORS.pipeHighlight)
        pipeGradient.addColorStop(0.5, COLORS.pipe)
        pipeGradient.addColorStop(1, COLORS.pipe)
      }

      ctx.fillStyle = pipeGradient

      // Top pipe
      ctx.beginPath()
      ctx.roundRect(pipe.x, 0, pipe.width, pipe.topHeight, [0, 0, 8, 8])
      ctx.fill()
      ctx.fillRect(pipe.x - 4, pipe.topHeight - 30, pipe.width + 8, 30)

      // Bottom pipe
      ctx.beginPath()
      ctx.roundRect(pipe.x, pipe.bottomY, pipe.width, CANVAS.height - pipe.bottomY - 80, [8, 8, 0, 0])
      ctx.fill()
      ctx.fillRect(pipe.x - 4, pipe.bottomY, pipe.width + 8, 30)

      // Ghost pipe indicator
      if (isGhostPipe) {
        ctx.fillStyle = 'rgba(100, 255, 100, 0.8)'
        ctx.font = '600 16px "Inter", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('👻', pipe.x + pipe.width / 2, pipe.topHeight / 2)
      }

      // Draw electricity in pipe gap if electric
      if (pipe.isElectric && !blackHole.active) {
        const gapTop = pipe.topHeight
        const gapBottom = pipe.bottomY
        const gapCenter = pipe.x + pipe.width / 2

        // Draw metal nodes on pipe edges
        ctx.fillStyle = '#666'
        ctx.beginPath()
        ctx.arc(gapCenter, gapTop, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(gapCenter, gapBottom, 8, 0, Math.PI * 2)
        ctx.fill()

        // Draw electricity if active
        if (pipe.electricActive) {
          ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 + Math.sin(time * 20) * 0.3})`
          ctx.lineWidth = 3

          // Draw zigzag lightning bolts
          for (let bolt = 0; bolt < 3; bolt++) {
            ctx.beginPath()
            let y = gapTop + 8
            ctx.moveTo(gapCenter + (bolt - 1) * 10, y)
            while (y < gapBottom - 8) {
              y += 12
              const offsetX = (Math.random() - 0.5) * 25
              ctx.lineTo(gapCenter + offsetX + (bolt - 1) * 10, Math.min(y, gapBottom - 8))
            }
            ctx.stroke()
          }

          // Glow effect
          ctx.shadowColor = '#00FFFF'
          ctx.shadowBlur = 15
          ctx.stroke()
          ctx.shadowBlur = 0
        } else {
          // Show faint indicator when electricity is off
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)'
          ctx.lineWidth = 1
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(gapCenter, gapTop + 8)
          ctx.lineTo(gapCenter, gapBottom - 8)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
    })

    // === BLACK HOLE EFFECT ===
    if (blackHole.active) {
      const centerX = CANVAS.width / 2
      const centerY = CANVAS.height / 2 - 40

      // Draw swirling accretion disk
      for (let ring = 0; ring < 6; ring++) {
        const radius = 40 + ring * 25 + Math.sin(time * 2 + ring) * 10
        const alpha = 0.35 - ring * 0.05

        ctx.beginPath()
        ctx.strokeStyle = `rgba(138, 43, 226, ${alpha})`
        ctx.lineWidth = 10 - ring
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw event horizon
      const holeRadius = 35 + blackHole.progress * 25
      const holeGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, holeRadius)
      holeGradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
      holeGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.9)')
      holeGradient.addColorStop(1, 'rgba(20, 0, 40, 0)')

      ctx.beginPath()
      ctx.fillStyle = holeGradient
      ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2)
      ctx.fill()

      // Light rays
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)'
      ctx.lineWidth = 2
      for (let i = 0; i < 8; i++) {
        const angle = (time + i * 0.785) % (Math.PI * 2)
        const len = 60 + Math.sin(time * 3 + i) * 20
        ctx.beginPath()
        ctx.moveTo(centerX + Math.cos(angle) * (holeRadius + 5), centerY + Math.sin(angle) * (holeRadius + 5))
        ctx.lineTo(centerX + Math.cos(angle) * (holeRadius + len), centerY + Math.sin(angle) * (holeRadius + len))
        ctx.stroke()
      }

      // "NEW BEST!" text
      ctx.save()
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#FFD700'
      ctx.font = '700 36px "Playfair Display", serif'
      ctx.textAlign = 'center'
      const pulse = 1 + Math.sin(time * 6) * 0.1
      ctx.translate(centerX, centerY - 130)
      ctx.scale(pulse, pulse)
      ctx.fillText('★ NEW BEST! ★', 0, 0)
      ctx.restore()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = '600 24px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Score: ${gameState.score}`, centerX, centerY + 130)
    }

    // Draw bird
    const { bird } = gameState
    const rotation = Math.min(Math.max(bird.velocity * 3, -30), 90) * (Math.PI / 180)

    const holeCenterX = CANVAS.width / 2
    const holeCenterY = CANVAS.height / 2 - 40

    const { scaleX, scaleY } = blackHole.active
      ? getSpaghettiScale(blackHole.progress, blackHole.phase)
      : { scaleX: 1, scaleY: 1 }

    let birdDrawX = bird.x + bird.width / 2
    let birdDrawY = bird.y + bird.height / 2

    if (blackHole.active) {
      const animatedPos = getBlackHolePosition(
        blackHole.progress,
        blackHole.phase,
        bird.x + bird.width / 2,
        bird.y + bird.height / 2,
        holeCenterX,
        holeCenterY
      )
      birdDrawX = animatedPos.x
      birdDrawY = animatedPos.y
    }

    ctx.save()
    ctx.translate(birdDrawX, birdDrawY)

    // Spinning during black hole - intense spinning as bird enters
    if (blackHole.active) {
      // Intense spinning - increases as bird approaches center
      const spinIntensity = blackHole.phase === 'stretching' ? 20 : 14
      const spinAngle = blackHole.progress * Math.PI * spinIntensity
      ctx.rotate(spinAngle)
    } else {
      ctx.rotate(rotation)
    }

    ctx.scale(scaleX, scaleY)

    const isInBlackHole = blackHole.active && (blackHole.phase === 'pulling' || blackHole.phase === 'stretching')

    // Bird body
    if (isInBlackHole) {
      ctx.fillStyle = `hsl(${280 + blackHole.progress * 60}, 70%, 50%)`
    } else {
      ctx.fillStyle = COLORS.bird
    }
    ctx.beginPath()
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Wing
    ctx.fillStyle = isInBlackHole ? '#9932CC' : COLORS.pipeHighlight
    ctx.beginPath()
    ctx.ellipse(-2, 2, 8, 5, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Eye
    const eyeSize = isInBlackHole ? 8 : 6
    ctx.fillStyle = COLORS.birdEye
    ctx.beginPath()
    ctx.arc(8, -4, eyeSize, 0, Math.PI * 2)
    ctx.fill()

    // Pupil
    const pupilSize = isInBlackHole ? 2 : 3
    ctx.fillStyle = COLORS.bird
    ctx.beginPath()
    ctx.arc(10, -4, pupilSize, 0, Math.PI * 2)
    ctx.fill()

    // Beak
    ctx.fillStyle = isInBlackHole ? '#FF6B6B' : COLORS.birdBeak
    ctx.beginPath()
    ctx.moveTo(14, 0)
    ctx.lineTo(22, 2)
    ctx.lineTo(14, 6)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // Draw "Click to Continue" overlay after black hole
    if (gameState.blackHole.waitingToResume) {
      ctx.fillStyle = 'rgba(20, 10, 40, 0.7)'
      ctx.fillRect(0, 0, CANVAS.width, CANVAS.height - 80)

      // Pulsing glow effect
      const pulse = 0.7 + Math.sin(time * 4) * 0.3
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 20 * pulse

      ctx.fillStyle = '#FFD700'
      ctx.font = '700 36px "Playfair Display", serif'
      ctx.textAlign = 'center'
      ctx.fillText('New Best Score!', CANVAS.width / 2, CANVAS.height / 2 - 30)

      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = '500 20px "Inter", sans-serif'
      ctx.fillText('Click to Continue', CANVAS.width / 2, CANVAS.height / 2 + 20)
    }

    // Draw overlays
    if (!blackHole.active && !gameState.blackHole.waitingToResume) {
      if (gameState.status === 'ready') {
        ctx.fillStyle = 'rgba(247, 240, 230, 0.7)'
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height - 80)

        ctx.fillStyle = COLORS.pipe
        ctx.font = '700 48px "Playfair Display", serif'
        ctx.textAlign = 'center'
        ctx.fillText('Flappy Physics', CANVAS.width / 2, CANVAS.height / 2 - 60)

        ctx.font = '500 20px "Inter", sans-serif'
        ctx.fillText('Click to Start', CANVAS.width / 2, CANVAS.height / 2 + 10)
        ctx.font = '400 16px "Inter", sans-serif'
        ctx.fillStyle = 'rgba(16, 37, 68, 0.6)'
        ctx.fillText('or press Space', CANVAS.width / 2, CANVAS.height / 2 + 40)

        if (gameState.config.chaosEnabled) {
          ctx.fillStyle = 'rgba(138, 43, 226, 0.8)'
          ctx.font = '600 16px "Inter", sans-serif'
          ctx.fillText('⚛️ Physics Chaos Mode Active ⚛️', CANVAS.width / 2, CANVAS.height / 2 + 80)
        }
      }

      if (gameState.status === 'over') {
        ctx.fillStyle = 'rgba(247, 240, 230, 0.85)'
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height - 80)

        ctx.fillStyle = COLORS.pipe
        ctx.font = '700 48px "Playfair Display", serif'
        ctx.textAlign = 'center'
        ctx.fillText('Game Over', CANVAS.width / 2, CANVAS.height / 2 - 40)

        ctx.font = '600 28px "Inter", sans-serif'
        ctx.fillText(`Score: ${gameState.score}`, CANVAS.width / 2, CANVAS.height / 2 + 20)

        if (gameState.score >= gameState.bestScore && gameState.score > 0) {
          ctx.fillStyle = '#E8A87C'
          ctx.font = '500 18px "Inter", sans-serif'
          ctx.fillText('New Best!', CANVAS.width / 2, CANVAS.height / 2 + 55)
        }

        ctx.fillStyle = 'rgba(16, 37, 68, 0.5)'
        ctx.font = '400 16px "Inter", sans-serif'
        ctx.fillText('Click to Play Again', CANVAS.width / 2, CANVAS.height / 2 + 100)
      }
    }
  }, [gameState])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS.width}
      height={CANVAS.height}
      onClick={onJump}
      className="rounded-xl shadow-lg cursor-pointer"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  )
}
