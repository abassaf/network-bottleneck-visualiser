import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import TopologyCanvas from './components/TopologyCanvas'
import NodeToolbar from './components/NodeToolbar'
import ConfigPanel from './components/ConfigPanel'

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
        {/* Toolbar */}
        <header className="flex h-14 shrink-0 items-center border-b border-zinc-800 px-4">
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
        </header>

        <main className="flex flex-1 overflow-hidden">
          <NodeToolbar />
          <TopologyCanvas />
          <ConfigPanel />
        </main>
      </div>
    </ReactFlowProvider>
  )
}
