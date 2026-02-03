import { Gauge, ArrowUp, ChevronDown, Columns, MoveHorizontal, Activity, Zap, Atom } from 'lucide-react'
import { GameConfig } from '../types'
import { GAME_CONFIG } from '../config/constants'

interface ControlPanelProps {
  config: GameConfig
  onConfigChange: (updates: Partial<GameConfig>) => void
}

interface SliderProps {
  label: string
  icon: React.ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

function Slider({ label, icon, value, min, max, step = 1, onChange }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100
  const displayValue = step < 1 ? value.toFixed(1) : value

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-navy">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-navy/60 font-mono text-sm">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ '--value-percent': `${percent}%` } as React.CSSProperties}
      />
    </div>
  )
}

export function ControlPanel({ config, onConfigChange }: ControlPanelProps) {
  return (
    <div className="panel p-6 space-y-6">
      <h2 className="font-display text-2xl font-semibold text-navy">
        Controls
      </h2>

      <div className="space-y-5">
        <Slider
          label="Speed"
          icon={<Gauge size={18} strokeWidth={2} />}
          value={config.speed}
          min={GAME_CONFIG.speed.min}
          max={GAME_CONFIG.speed.max}
          onChange={(speed) => onConfigChange({ speed })}
        />

        <Slider
          label="Jump Height"
          icon={<ArrowUp size={18} strokeWidth={2} />}
          value={config.jumpHeight}
          min={GAME_CONFIG.jumpHeight.min}
          max={GAME_CONFIG.jumpHeight.max}
          onChange={(jumpHeight) => onConfigChange({ jumpHeight })}
        />

        <Slider
          label="Gravity"
          icon={<ChevronDown size={18} strokeWidth={2} />}
          value={config.gravity}
          min={GAME_CONFIG.gravity.min}
          max={GAME_CONFIG.gravity.max}
          step={0.1}
          onChange={(gravity) => onConfigChange({ gravity })}
        />
      </div>

      {/* Physics Function */}
      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-center gap-2 text-navy">
          <Activity size={18} strokeWidth={2} />
          <span className="font-medium">Jump Curve</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {([
            { type: 'parabolic', label: 'Parabolic', desc: 'Natural arc' },
            { type: 'linear', label: 'Linear', desc: 'Sharp angles' },
            { type: 'exponential', label: 'Exponential', desc: 'Quick burst' },
            { type: 'sine', label: 'Sine', desc: 'Smooth wave' },
          ] as const).map(({ type, label, desc }) => (
            <button
              key={type}
              onClick={() => onConfigChange({ physicsType: type })}
              className={`
                p-3 rounded-lg text-left transition-all duration-200
                ${config.physicsType === type
                  ? 'bg-navy text-cream shadow-md'
                  : 'bg-white/50 text-navy hover:bg-white hover:shadow-sm border border-border'
                }
              `}
            >
              <div className="font-medium text-sm">{label}</div>
              <div className={`text-xs mt-0.5 ${
                config.physicsType === type ? 'text-cream/70' : 'text-navy/50'
              }`}>
                {desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pipe Settings */}
      <div className="pt-4 border-t border-border space-y-5">
        <h3 className="font-medium text-navy/70 text-sm uppercase tracking-wide">
          Pipe Settings
        </h3>

        <Slider
          label="Pipe Gap"
          icon={<Columns size={18} strokeWidth={2} />}
          value={config.pipeGap}
          min={GAME_CONFIG.pipeGap.min}
          max={GAME_CONFIG.pipeGap.max}
          onChange={(pipeGap) => onConfigChange({ pipeGap })}
        />

        <Slider
          label="Pipe Spacing"
          icon={<MoveHorizontal size={18} strokeWidth={2} />}
          value={config.pipeSpacing}
          min={GAME_CONFIG.pipeSpacing.min}
          max={GAME_CONFIG.pipeSpacing.max}
          onChange={(pipeSpacing) => onConfigChange({ pipeSpacing })}
        />
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-navy/50 leading-relaxed">
          <strong>Pipe Gap</strong> = vertical space between pipes. <strong>Pipe Spacing</strong> = horizontal distance between pipe pairs.
        </p>
      </div>

      {/* Physics Chaos Mode */}
      <div className="pt-4 border-t border-border space-y-4">
        <button
          onClick={() => onConfigChange({ chaosEnabled: !config.chaosEnabled })}
          className={`
            w-full p-4 rounded-xl transition-all duration-300
            flex items-center justify-between
            ${config.chaosEnabled
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white/50 text-navy border border-border hover:border-purple-300 hover:shadow-md'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-lg
              ${config.chaosEnabled ? 'bg-white/20' : 'bg-purple-100'}
            `}>
              <Atom
                size={24}
                strokeWidth={2}
                className={config.chaosEnabled ? 'text-white' : 'text-purple-600'}
              />
            </div>
            <div className="text-left">
              <div className="font-semibold">Physics Chaos</div>
              <div className={`text-xs ${config.chaosEnabled ? 'text-white/70' : 'text-navy/50'}`}>
                {config.chaosEnabled ? 'Chaos enabled!' : 'Tap to unleash chaos'}
              </div>
            </div>
          </div>
          <div className={`
            w-12 h-7 rounded-full transition-all duration-300 flex items-center
            ${config.chaosEnabled ? 'bg-white/30 justify-end' : 'bg-gray-200 justify-start'}
          `}>
            <div className={`
              w-5 h-5 rounded-full mx-1 transition-all duration-300
              ${config.chaosEnabled ? 'bg-white' : 'bg-gray-400'}
            `} />
          </div>
        </button>

        {config.chaosEnabled && (
          <div className="bg-purple-50 rounded-lg p-3 space-y-3">
            <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
              Choose Hazards
            </div>
            <div className="space-y-2">
              <HazardToggle
                icon={<Zap size={14} />}
                label="Electric Pillars"
                description="Timing-based electricity"
                enabled={config.chaosHazards.electricPillars}
                onChange={(enabled) => onConfigChange({
                  chaosHazards: { ...config.chaosHazards, electricPillars: enabled }
                })}
              />
              <HazardToggle
                icon={<span>☢️</span>}
                label="Gamma Rays"
                description="Horizontal beam with warning"
                enabled={config.chaosHazards.gammaRays}
                onChange={(enabled) => onConfigChange({
                  chaosHazards: { ...config.chaosHazards, gammaRays: enabled }
                })}
              />
              <HazardToggle
                icon={<span>🌀</span>}
                label="Vortexes"
                description="Pulls bird into orbit"
                enabled={config.chaosHazards.vortexes}
                onChange={(enabled) => onConfigChange({
                  chaosHazards: { ...config.chaosHazards, vortexes: enabled }
                })}
              />
              <HazardToggle
                icon={<span>⚛️</span>}
                label="Particles"
                description="Fast projectiles"
                enabled={config.chaosHazards.particles}
                onChange={(enabled) => onConfigChange({
                  chaosHazards: { ...config.chaosHazards, particles: enabled }
                })}
              />
              <HazardToggle
                icon={<span>🐱</span>}
                label="Schrödinger's Pipes"
                description="Some pipes are fake!"
                enabled={config.chaosHazards.schrodingerPipes}
                onChange={(enabled) => onConfigChange({
                  chaosHazards: { ...config.chaosHazards, schrodingerPipes: enabled }
                })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Individual hazard toggle component
interface HazardToggleProps {
  icon: React.ReactNode
  label: string
  description: string
  enabled: boolean
  onChange: (enabled: boolean) => void
}

function HazardToggle({ icon, label, description, enabled, onChange }: HazardToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        w-full p-2 rounded-lg transition-all duration-200
        flex items-center justify-between
        ${enabled
          ? 'bg-purple-200 text-purple-800'
          : 'bg-white/50 text-purple-400 hover:bg-white'
        }
      `}
    >
      <div className="flex items-center gap-2">
        <span className={enabled ? 'opacity-100' : 'opacity-50'}>{icon}</span>
        <div className="text-left">
          <div className={`text-sm font-medium ${enabled ? 'text-purple-800' : 'text-purple-500'}`}>
            {label}
          </div>
          <div className={`text-xs ${enabled ? 'text-purple-600' : 'text-purple-400'}`}>
            {description}
          </div>
        </div>
      </div>
      <div className={`
        w-8 h-5 rounded-full transition-all duration-200 flex items-center
        ${enabled ? 'bg-purple-500 justify-end' : 'bg-gray-300 justify-start'}
      `}>
        <div className={`
          w-3.5 h-3.5 rounded-full mx-0.5 transition-all duration-200
          ${enabled ? 'bg-white' : 'bg-gray-400'}
        `} />
      </div>
    </button>
  )
}
