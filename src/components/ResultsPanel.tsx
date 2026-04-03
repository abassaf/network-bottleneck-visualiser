import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAnalysisStore, useTopologyStore } from '../store'
import type { BottleneckResult, Fix, Hop } from '../types/topology'

// ─── Colour helpers ───────────────────────────────────────────────────────────

function throughputColour(effectiveMbps: number, ispMbps: number): string {
  const ratio = effectiveMbps / ispMbps
  if (ratio >= 0.8) return 'text-green-400'
  if (ratio >= 0.4) return 'text-amber-400'
  return 'text-red-400'
}

function difficultyClasses(difficulty: Fix['difficulty']): string {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-900/60 text-green-400 border border-green-800'
    case 'Medium':
      return 'bg-amber-900/60 text-amber-400 border border-amber-800'
    case 'Hard':
      return 'bg-red-900/60 text-red-400 border border-red-800'
    case '$$':
      return 'bg-blue-900/60 text-blue-400 border border-blue-800'
  }
}

// ─── ThroughputCallout ────────────────────────────────────────────────────────

interface ThroughputCalloutProps {
  effectiveMbps: number
  ispMbps: number
  targetLabel: string
}

function ThroughputCallout({ effectiveMbps, ispMbps, targetLabel }: ThroughputCalloutProps) {
  const colour = throughputColour(effectiveMbps, ispMbps)
  return (
    <div className="flex flex-col items-center gap-1 py-5">
      <span className={`text-4xl font-bold tabular-nums ${colour}`}>
        {effectiveMbps} Mbps
      </span>
      <span className="text-xs text-zinc-500 text-center leading-snug">
        Effective throughput to {targetLabel}
      </span>
    </div>
  )
}

// ─── ExplanationCard ──────────────────────────────────────────────────────────

function ExplanationCard({ explanation }: { explanation: string }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4">
      <div className="flex gap-3">
        <span className="shrink-0 text-base leading-none" aria-hidden="true">
          {/* Inline warning SVG — no emoji, keeps it crisp at any scale */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-orange-400 mt-0.5"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <p className="text-sm text-zinc-300 leading-relaxed">{explanation}</p>
      </div>
    </div>
  )
}

// ─── BottleneckBadge ──────────────────────────────────────────────────────────

function BottleneckBadge({ label }: { label: string }) {
  return (
    <div className="flex">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-800 bg-red-950 px-3 py-1 text-xs text-red-400">
        {/* Dot indicator */}
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
        Bottleneck: {label}
      </span>
    </div>
  )
}

// ─── FixList ──────────────────────────────────────────────────────────────────

function FixList({ fixes }: { fixes: Fix[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Recommended Fixes
        </span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-700 px-1.5 text-[10px] font-semibold text-zinc-300">
          {fixes.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {fixes.map((fix, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-zinc-700 bg-zinc-800 p-3"
          >
            <p className="text-sm font-medium text-zinc-100">{fix.title}</p>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{fix.description}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-green-400 font-medium">
                → ~{fix.estimatedNewMbps} Mbps
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${difficultyClasses(fix.difficulty)}`}
              >
                {fix.difficulty}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── HopChain ─────────────────────────────────────────────────────────────────

interface HopChainProps {
  chain: Hop[]
  bottleneckNodeId: string
  nodeLabel: (id: string) => string
}

function HopChain({ chain, bottleneckNodeId, nodeLabel }: HopChainProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Signal path
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="hop-chain"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-1.5">
              {chain.map((hop, idx) => {
                const isBottleneck = hop.toId === bottleneckNodeId
                return (
                  <div
                    key={idx}
                    className={`rounded-lg bg-zinc-800 px-3 py-2 text-xs ${
                      isBottleneck
                        ? 'border-l-2 border-l-red-500 border-y border-r border-zinc-700'
                        : 'border border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-zinc-300 font-medium flex-wrap">
                      <span className="text-zinc-400">{nodeLabel(hop.fromId)}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-3 w-3 shrink-0 text-zinc-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className={isBottleneck ? 'text-red-400' : 'text-zinc-300'}>
                        {nodeLabel(hop.toId)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-zinc-500 truncate">{hop.limitedBy}</span>
                      <span
                        className={`shrink-0 font-semibold tabular-nums ${
                          isBottleneck ? 'text-red-400' : 'text-zinc-400'
                        }`}
                      >
                        {hop.limitingMbps} Mbps
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function ResultsPanel() {
  const result = useAnalysisStore((s) => s.result)
  const clearResult = useAnalysisStore((s) => s.clearResult)
  const nodes = useTopologyStore((s) => s.nodes)

  const nodeLabel = (id: string): string => {
    const node = nodes.find((n) => n.id === id)
    return node ? node.data.label : id
  }

  const buildBottleneckLabel = (result: BottleneckResult): string => {
    const node = nodes.find((n) => n.id === result.bottleneckNodeId)
    if (!node) return result.bottleneckNodeId
    const data = node.data
    const base = data.label
    if (data.nodeType === 'accessPoint') {
      const proto: Record<string, string> = {
        wifi4: 'Wi-Fi 4',
        wifi5: 'Wi-Fi 5',
        wifi6: 'Wi-Fi 6',
        wifi6e: 'Wi-Fi 6E',
      }
      return `${base} (${proto[data.protocol] ?? data.protocol} · ${data.band} · ${data.channelWidth}MHz)`
    }
    if (data.nodeType === 'router') {
      return `${base} (${data.model})`
    }
    return base
  }

  const ispNode = nodes.find((n) => n.data.nodeType === 'isp')
  const ispMbps =
    ispNode && ispNode.data.nodeType === 'isp' ? ispNode.data.downloadMbps : 100

  const targetLabel = result ? nodeLabel(result.targetNodeId) : ''

  return (
    <AnimatePresence>
      {result && (
        <motion.aside
          key="results-panel"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-900"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Analysis
            </span>
            <button
              onClick={clearResult}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Close results panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-5 px-4 py-4">
            {/* Throughput callout */}
            <ThroughputCallout
              effectiveMbps={result.effectiveMbps}
              ispMbps={ispMbps}
              targetLabel={targetLabel}
            />

            {/* Explanation */}
            <ExplanationCard explanation={result.explanation} />

            {/* Bottleneck badge */}
            <BottleneckBadge label={buildBottleneckLabel(result)} />

            {/* Fix list */}
            {result.fixes.length > 0 && <FixList fixes={result.fixes} />}

            {/* Hop chain */}
            <HopChain
              chain={result.chain}
              bottleneckNodeId={result.bottleneckNodeId}
              nodeLabel={nodeLabel}
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
