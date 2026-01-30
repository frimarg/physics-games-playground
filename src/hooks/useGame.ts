import { useState, useCallback, useEffect, useRef } from 'react'
import { GameState, GameConfig } from '../types'
import { createInitialState, handleJump, updateGame, restartGame, updateConfig } from '../game/engine'

const BEST_SCORE_KEY = 'flappy-physics-best-score'

function loadBestScore(): number {
  try {
    const saved = localStorage.getItem(BEST_SCORE_KEY)
    return saved ? parseInt(saved, 10) : 0
  } catch {
    return 0
  }
}

function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, score.toString())
  } catch {
    // Ignore storage errors
  }
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState(loadBestScore())
  )
  const animationFrameRef = useRef<number>()

  // Game loop
  useEffect(() => {
    if (gameState.status !== 'playing') {
      return
    }

    const gameLoop = () => {
      setGameState(prev => {
        const newState = updateGame(prev)

        // Save best score when game ends
        if (newState.status === 'over' && newState.bestScore > prev.bestScore) {
          saveBestScore(newState.bestScore)
        }

        return newState
      })
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState.status])

  const jump = useCallback(() => {
    setGameState(prev => handleJump(prev))
  }, [])

  const restart = useCallback(() => {
    setGameState(prev => restartGame(prev))
  }, [])

  const setConfig = useCallback((updates: Partial<GameConfig>) => {
    setGameState(prev => updateConfig(prev, updates))
  }, [])

  return {
    gameState,
    jump,
    restart,
    setConfig,
  }
}
