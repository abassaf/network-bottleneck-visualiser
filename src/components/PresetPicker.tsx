import { useEffect, useRef, useState } from 'react'
import { useTopologyStore, useAnalysisStore } from '../store'
import { PRESETS } from '../data/presets'

export default function PresetPicker() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const nodes = useTopologyStore((s) => s.nodes)
  const loadTopology = useTopologyStore((s) => s.loadTopology)
  const clearResult = useAnalysisStore((s) => s.clearResult)

  // Close on outside click
  useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSelectPreset(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    if (nodes.length > 0) {
      const confirmed = window.confirm(
        'Load preset? This will replace your current topology.',
      )
      if (!confirmed) return
    }

    loadTopology(preset.nodes, preset.edges)
    clearResult()
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 transition hover:bg-zinc-700"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        Presets ▾
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        >
          <ul className="py-1">
            {PRESETS.map((preset) => (
              <li key={preset.id} role="option" aria-selected={false}>
                <button
                  onClick={() => handleSelectPreset(preset.id)}
                  className="w-full px-4 py-2.5 text-left transition hover:bg-zinc-800"
                >
                  <p className="text-sm font-medium text-zinc-100">{preset.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{preset.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
