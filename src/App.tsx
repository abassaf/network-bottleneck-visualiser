import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import TopologyCanvas from './components/TopologyCanvas'
import NodeToolbar from './components/NodeToolbar'
import ConfigPanel from './components/ConfigPanel'
import ResultsPanel from './components/ResultsPanel'
import PresetPicker from './components/PresetPicker'
import { useTopologyStore, useAnalysisStore } from './store'
import { analyseDevice } from './engine/bottleneckEngine'

// ─── Analyse controls ─────────────────────────────────────────────────────────

function AnalyseControls() {
  const nodes = useTopologyStore((s) => s.nodes)
  const edges = useTopologyStore((s) => s.edges)
  const setResult = useAnalysisStore((s) => s.setResult)
  const isAnalysing = useAnalysisStore((s) => s.isAnalysing)
  const setAnalysing = useAnalysisStore((s) => s.setAnalysing)

  const [error, setError] = useState<string | null>(null)

  const endDevices = nodes.filter(
    (n) => n.data.nodeType === 'wiredDevice' || n.data.nodeType === 'wirelessDevice',
  )

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')

  // Resolve which device ID to use: explicit selection or first available
  const effectiveDeviceId = selectedDeviceId || endDevices[0]?.id || ''
  const hasDevices = endDevices.length > 0

  const handleAnalyse = () => {
    if (!effectiveDeviceId) return
    setError(null)
    setAnalysing(true)
    try {
      const result = analyseDevice({ nodes, edges }, effectiveDeviceId)
      if (!result) {
        setError('Device is not connected to the network.')
        setResult(null)
      } else {
        setResult(result)
      }
    } finally {
      setAnalysing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Error toast */}
      {error && (
        <span className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-1">
          {error}
        </span>
      )}

      {/* Device selector — only shown when more than one end device exists */}
      {endDevices.length > 1 && (
        <select
          value={selectedDeviceId || effectiveDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
          aria-label="Select device to analyse"
        >
          {endDevices.map((node) => (
            <option key={node.id} value={node.id}>
              {node.data.label}
            </option>
          ))}
        </select>
      )}

      {/* Analyse button */}
      <button
        onClick={handleAnalyse}
        disabled={!hasDevices || isAnalysing}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        title={!hasDevices ? 'Add a wired or wireless device to analyse' : undefined}
      >
        {isAnalysing ? (
          <>
            {/* Spinner */}
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Analysing…
          </>
        ) : (
          'Analyse'
        )}
      </button>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-white"
              >
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              Network Bottleneck Visualiser
            </span>
          </div>

          <div className="flex items-center gap-2">
            <PresetPicker />
            <AnalyseControls />
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <NodeToolbar />
          <TopologyCanvas />
          <ConfigPanel />
          <ResultsPanel />
        </main>
      </div>
    </ReactFlowProvider>
  )
}
