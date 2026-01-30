import { RotateCcw, Trophy, Target } from 'lucide-react'
import { GameState } from '../types'

interface ScoreBarProps {
  gameState: GameState
  onRestart: () => void
}

export function ScoreBar({ gameState, onRestart }: ScoreBarProps) {
  return (
    <div className="panel px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Current Score */}
          <div className="flex items-center gap-2">
            <Target size={20} strokeWidth={2} className="text-navy/60" />
            <span className="text-navy/60 font-medium">Score</span>
            <span className="font-display text-2xl font-bold text-navy ml-1">
              {gameState.score}
            </span>
          </div>

          {/* Best Score */}
          <div className="flex items-center gap-2">
            <Trophy size={20} strokeWidth={2} className="text-amber-500" />
            <span className="text-navy/60 font-medium">Best</span>
            <span className="font-display text-2xl font-bold text-navy ml-1">
              {gameState.bestScore}
            </span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="btn-primary flex items-center gap-2"
        >
          <RotateCcw size={18} strokeWidth={2} />
          <span>Restart</span>
        </button>
      </div>
    </div>
  )
}
