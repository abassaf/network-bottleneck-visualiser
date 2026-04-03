import { motion, AnimatePresence } from 'framer-motion'
import { useComparisonStore, useAnalysisStore } from '../store'
import type { BottleneckResult } from '../types/topology'
import TopologyCanvas from './TopologyCanvas'
import ComparisonCanvas from './ComparisonCanvas'

// ─── Colour helpers ───────────────────────────────────────────────────────────

function getMbpsColour(mbps: number): string {
  if (mbps >= 500) return 'text-green-400'
  if (mbps >= 100) return 'text-amber-400'
  return 'text-red-400'
}

// ─── Before / After callout ───────────────────────────────────────────────────

interface ResultCalloutProps {
  result: BottleneckResult
  label: string
}

function ResultCallout({ result, label }: ResultCalloutProps) {
  const colour = getMbpsColour(result.effectiveMbps)
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className={`text-2xl font-bold tabular-nums ${colour}`}>
          {result.effectiveMbps}
        </span>
        <span className="text-xs text-zinc-400">Mbps</span>
        <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</span>
      </div>
      <p className="truncate text-xs text-zinc-400 min-w-0">{result.explanation}</p>
    </div>
  )
}

// ─── Delta badge ──────────────────────────────────────────────────────────────

interface DeltaBadgeProps {
  beforeMbps: number
  afterMbps: number | null
}

function DeltaBadge({ beforeMbps, afterMbps }: DeltaBadgeProps) {
  const delta = afterMbps !== null ? afterMbps - beforeMbps : null
  const isPositive = delta !== null && delta >= 0
  const deltaColour = delta === null ? 'text-zinc-400' : isPositive ? 'text-green-400' : 'text-red-400'
  const deltaBg = delta === null ? 'bg-zinc-800' : isPositive ? 'bg-green-950/80' : 'bg-red-950/80'
  const deltaBorder = delta === null ? 'border-zinc-700' : isPositive ? 'border-green-700/60' : 'border-red-700/60'

  return (
    <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none select-none">
      {/* Vertical divider line */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-zinc-700 -z-10" style={{ top: '-50vh', bottom: '-50vh' }} />

      <motion.div
        className={`relative rounded-xl border px-3 py-2 shadow-xl backdrop-blur-sm ${deltaBg} ${deltaBorder}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 text-center mb-0.5">Delta</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={delta ?? 'null'}
            className={`text-xl font-bold tabular-nums text-center ${deltaColour}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            {delta === null
              ? '—'
              : `${isPositive ? '+' : ''}${delta} Mbps`}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ─── ComparisonMode ───────────────────────────────────────────────────────────

export default function ComparisonMode() {
  const beforeResult = useAnalysisStore((s) => s.result)
  const afterResult = useComparisonStore((s) => s.afterResult)

  return (
    <motion.div
      className="flex flex-1 overflow-hidden"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
    >
      {/* LEFT: before (read-only) */}
      <div className="flex-1 flex flex-col border-r border-zinc-800 relative overflow-hidden">
        <div className="absolute top-2 left-2 z-10 rounded bg-zinc-900/80 px-2 py-0.5 text-xs font-semibold text-zinc-400 border border-zinc-800">
          Before
        </div>
        <TopologyCanvas readonly={true} />
        {beforeResult && <ResultCallout result={beforeResult} label="Before" />}
      </div>

      {/* Delta badge — positioned relative to the whole comparison container */}
      <div className="relative w-0 overflow-visible">
        <DeltaBadge
          beforeMbps={beforeResult?.effectiveMbps ?? 0}
          afterMbps={afterResult?.effectiveMbps ?? null}
        />
      </div>

      {/* RIGHT: after (editable) */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-2 left-2 z-10 rounded bg-zinc-900/80 px-2 py-0.5 text-xs font-semibold text-zinc-400 border border-zinc-800">
          After
        </div>
        <ComparisonCanvas />
        {afterResult && <ResultCallout result={afterResult} label="After" />}
      </div>
    </motion.div>
  )
}
