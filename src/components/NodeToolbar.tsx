import type { NodeType } from '../types/topology'

interface ToolbarItem {
  type: NodeType
  label: string
  icon: React.ReactNode
}

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
)

const RouterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect x="2" y="9" width="20" height="6" rx="2" />
    <path d="M12 3v3" />
    <path d="M8 3v3" />
    <path d="M16 3v3" />
    <circle cx="7" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="17" cy="12" r="1" />
    <path d="M12 18v3" />
  </svg>
)

const WifiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" />
  </svg>
)

const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
)

const EthernetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect x="2" y="8" width="20" height="8" rx="2" />
    <line x1="6" y1="8" x2="6" y2="4" />
    <line x1="10" y1="8" x2="10" y2="4" />
    <line x1="14" y1="8" x2="14" y2="4" />
    <line x1="18" y1="8" x2="18" y2="4" />
    <line x1="12" y1="16" x2="12" y2="20" />
  </svg>
)

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)

const toolbarItems: ToolbarItem[] = [
  { type: 'isp', label: 'ISP', icon: <GlobeIcon /> },
  { type: 'modem', label: 'Modem', icon: <BoxIcon /> },
  { type: 'router', label: 'Router', icon: <RouterIcon /> },
  { type: 'accessPoint', label: 'Access Point', icon: <WifiIcon /> },
  { type: 'switch', label: 'Switch', icon: <GridIcon /> },
  { type: 'wiredDevice', label: 'Wired', icon: <EthernetIcon /> },
  { type: 'wirelessDevice', label: 'Wireless', icon: <PhoneIcon /> },
]

export default function NodeToolbar() {
  const onDragStart = (event: React.DragEvent<HTMLButtonElement>, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow-nodetype', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="flex shrink-0 flex-col gap-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 m-2 z-10 self-start mt-4">
      <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        Nodes
      </p>
      {toolbarItems.map((item) => (
        <button
          key={item.type}
          draggable
          onDragStart={(e) => onDragStart(e, item.type)}
          className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-2 text-zinc-400 transition-colors duration-100 hover:border-zinc-600 hover:bg-zinc-800 hover:text-blue-400 cursor-grab active:cursor-grabbing"
          title={item.label}
        >
          <span className="flex h-7 w-7 items-center justify-center">{item.icon}</span>
          <span className="text-[9px] font-medium leading-none text-center">{item.label}</span>
        </button>
      ))}
    </aside>
  )
}
