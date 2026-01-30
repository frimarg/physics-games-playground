import { GameCanvas } from './components/GameCanvas'
import { ControlPanel } from './components/ControlPanel'
import { ScoreBar } from './components/ScoreBar'
import { useGame } from './hooks/useGame'

function App() {
  const { gameState, jump, restart, setConfig } = useGame()

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center md:text-left">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-navy">
            Flappy Physics
          </h1>
          <p className="text-navy/60 mt-2 font-body">
            A physics playground — adjust parameters and see how they affect gameplay
          </p>
        </header>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Game Canvas */}
          <div className="flex-shrink-0">
            <GameCanvas gameState={gameState} onJump={jump} />
          </div>

          {/* Control Panel */}
          <div className="lg:w-72 flex-shrink-0">
            <ControlPanel
              config={gameState.config}
              onConfigChange={setConfig}
            />
          </div>
        </div>

        {/* Score Bar */}
        <ScoreBar gameState={gameState} onRestart={restart} />

        {/* Footer */}
        <footer className="text-center text-navy/40 text-sm pt-4">
          <p>
            Built with React + TypeScript + Canvas API
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
