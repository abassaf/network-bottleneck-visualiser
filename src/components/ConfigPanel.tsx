import { AnimatePresence, motion } from 'framer-motion'
import { useTopologyStore } from '../store'
import type {
  NodeData,
  IspNodeData,
  ModemNodeData,
  RouterNodeData,
  AccessPointNodeData,
  SwitchNodeData,
  WiredDeviceNodeData,
  WirelessDeviceNodeData,
  RouterTier,
  WifiProtocol,
  WifiBand,
  ChannelWidth,
  WifiStreams,
  PortSpeed,
  DistanceCategory,
} from '../types/topology'

// ─── Field primitives ─────────────────────────────────────────────────────────

interface TextFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 outline-none ring-0 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
      />
    </label>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
}

function NumberField({ label, value, onChange, min = 0 }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 outline-none ring-0 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
      />
    </label>
  )
}

interface SelectFieldProps<T extends string | number> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}

function SelectField<T extends string | number>({ label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          const raw = e.target.value
          const parsed = (typeof value === 'number' ? Number(raw) : raw) as T
          onChange(parsed)
        }}
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 outline-none ring-0 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// ─── Per-type form sections ───────────────────────────────────────────────────

const routerTierOptions: { value: RouterTier; label: string }[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'midRange', label: 'Mid-range' },
  { value: 'highEnd', label: 'High-end' },
]

const portSpeedOptions: { value: PortSpeed; label: string }[] = [
  { value: 100, label: '100 Mbps' },
  { value: 1000, label: '1 Gbps' },
  { value: 2500, label: '2.5 Gbps' },
  { value: 10000, label: '10 Gbps' },
]

const wifiProtocolOptions: { value: WifiProtocol; label: string }[] = [
  { value: 'wifi4', label: 'Wi-Fi 4 (802.11n)' },
  { value: 'wifi5', label: 'Wi-Fi 5 (802.11ac)' },
  { value: 'wifi6', label: 'Wi-Fi 6 (802.11ax)' },
  { value: 'wifi6e', label: 'Wi-Fi 6E (6 GHz)' },
]

const wifiBandOptions: { value: WifiBand; label: string }[] = [
  { value: '2.4GHz', label: '2.4 GHz' },
  { value: '5GHz', label: '5 GHz' },
  { value: '6GHz', label: '6 GHz' },
]

const channelWidthOptions: { value: ChannelWidth; label: string }[] = [
  { value: 20, label: '20 MHz' },
  { value: 40, label: '40 MHz' },
  { value: 80, label: '80 MHz' },
  { value: 160, label: '160 MHz' },
]

const streamsOptions: { value: WifiStreams; label: string }[] = [
  { value: 1, label: '1 stream' },
  { value: 2, label: '2 streams' },
  { value: 3, label: '3 streams' },
  { value: 4, label: '4 streams' },
]

const distanceOptions: { value: DistanceCategory; label: string }[] = [
  { value: 'close', label: 'Close (< 5 m)' },
  { value: 'medium', label: 'Medium (5–15 m)' },
  { value: 'far', label: 'Far (> 15 m)' },
]

interface FormProps<T extends NodeData> {
  data: T
  patch: (p: Partial<T>) => void
}

function IspForm({ data, patch }: FormProps<IspNodeData>) {
  return (
    <>
      <NumberField label="Download (Mbps)" value={data.downloadMbps} onChange={(v) => patch({ downloadMbps: v })} min={1} />
      <NumberField label="Upload (Mbps)" value={data.uploadMbps} onChange={(v) => patch({ uploadMbps: v })} min={1} />
    </>
  )
}

function ModemForm({ data, patch }: FormProps<ModemNodeData>) {
  return (
    <>
      <TextField label="Model" value={data.model} onChange={(v) => patch({ model: v })} />
      <NumberField label="Max Download (Mbps)" value={data.maxDownloadMbps} onChange={(v) => patch({ maxDownloadMbps: v })} min={1} />
      <NumberField label="Max Upload (Mbps)" value={data.maxUploadMbps} onChange={(v) => patch({ maxUploadMbps: v })} min={1} />
    </>
  )
}

function RouterForm({ data, patch }: FormProps<RouterNodeData>) {
  return (
    <>
      <TextField label="Model" value={data.model} onChange={(v) => patch({ model: v })} />
      <SelectField label="Tier" value={data.tier} options={routerTierOptions} onChange={(v) => patch({ tier: v })} />
      <SelectField label="WAN Port Speed" value={data.wanPortSpeedMbps} options={portSpeedOptions} onChange={(v) => patch({ wanPortSpeedMbps: v })} />
      <SelectField label="LAN Port Speed" value={data.lanPortSpeedMbps} options={portSpeedOptions} onChange={(v) => patch({ lanPortSpeedMbps: v })} />
      <NumberField label="Routing Cap (Mbps)" value={data.routingCapMbps} onChange={(v) => patch({ routingCapMbps: v })} min={1} />
    </>
  )
}

function AccessPointForm({ data, patch }: FormProps<AccessPointNodeData>) {
  return (
    <>
      <TextField label="Model" value={data.model} onChange={(v) => patch({ model: v })} />
      <SelectField label="Protocol" value={data.protocol} options={wifiProtocolOptions} onChange={(v) => patch({ protocol: v })} />
      <SelectField label="Band" value={data.band} options={wifiBandOptions} onChange={(v) => patch({ band: v })} />
      <SelectField label="Channel Width" value={data.channelWidth} options={channelWidthOptions} onChange={(v) => patch({ channelWidth: v })} />
      <SelectField label="Spatial Streams" value={data.streams} options={streamsOptions} onChange={(v) => patch({ streams: v })} />
    </>
  )
}

function SwitchForm({ data, patch }: FormProps<SwitchNodeData>) {
  return (
    <>
      <TextField label="Model" value={data.model} onChange={(v) => patch({ model: v })} />
      <NumberField label="Port Count" value={data.portCount} onChange={(v) => patch({ portCount: v })} min={1} />
      <SelectField label="Port Speed" value={data.portSpeedMbps} options={portSpeedOptions} onChange={(v) => patch({ portSpeedMbps: v })} />
    </>
  )
}

function WiredDeviceForm({ data, patch }: FormProps<WiredDeviceNodeData>) {
  return (
    <>
      <TextField label="Label" value={data.label} onChange={(v) => patch({ label: v })} />
      <SelectField label="NIC Speed" value={data.nicSpeedMbps} options={portSpeedOptions} onChange={(v) => patch({ nicSpeedMbps: v })} />
    </>
  )
}

function WirelessDeviceForm({ data, patch }: FormProps<WirelessDeviceNodeData>) {
  return (
    <>
      <TextField label="Label" value={data.label} onChange={(v) => patch({ label: v })} />
      <SelectField label="Protocol" value={data.protocol} options={wifiProtocolOptions} onChange={(v) => patch({ protocol: v })} />
      <SelectField label="Band" value={data.band} options={wifiBandOptions} onChange={(v) => patch({ band: v })} />
      <SelectField label="Spatial Streams" value={data.streams} options={streamsOptions} onChange={(v) => patch({ streams: v })} />
      <SelectField label="Distance" value={data.distance} options={distanceOptions} onChange={(v) => patch({ distance: v })} />
    </>
  )
}

// ─── Node type label map ──────────────────────────────────────────────────────

const nodeTypeLabels: Record<string, string> = {
  isp: 'ISP',
  modem: 'Modem',
  router: 'Router',
  accessPoint: 'Access Point',
  switch: 'Switch',
  wiredDevice: 'Wired Device',
  wirelessDevice: 'Wireless Device',
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function ConfigPanel() {
  const selectedNodeId = useTopologyStore((s) => s.selectedNodeId)
  const nodes = useTopologyStore((s) => s.nodes)
  const updateNodeData = useTopologyStore((s) => s.updateNodeData)
  const removeNode = useTopologyStore((s) => s.removeNode)
  const selectNode = useTopologyStore((s) => s.selectNode)

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null

  const handleClose = () => selectNode(null)

  const handleDelete = () => {
    if (selectedNodeId) {
      removeNode(selectedNodeId)
    }
  }

  const makePatch = <T extends NodeData>(patch: Partial<T>) => {
    if (!selectedNodeId) return
    updateNodeData(selectedNodeId, patch as Partial<NodeData>)
  }

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.aside
          key="config-panel"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="flex w-80 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Configure</p>
              <p className="text-sm font-semibold text-zinc-100">
                {nodeTypeLabels[selectedNode.data.nodeType] ?? selectedNode.data.nodeType}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Close config panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              {/* Label field for non-device nodes (devices have it in their own form) */}
              {selectedNode.data.nodeType !== 'wiredDevice' &&
                selectedNode.data.nodeType !== 'wirelessDevice' && (
                  <TextField
                    label="Label"
                    value={selectedNode.data.label}
                    onChange={(v) => makePatch({ label: v })}
                  />
                )}

              {selectedNode.data.nodeType === 'isp' && (
                <IspForm
                  data={selectedNode.data as IspNodeData}
                  patch={(p) => makePatch<IspNodeData>(p)}
                />
              )}
              {selectedNode.data.nodeType === 'modem' && (
                <ModemForm
                  data={selectedNode.data as ModemNodeData}
                  patch={(p) => makePatch<ModemNodeData>(p)}
                />
              )}
              {selectedNode.data.nodeType === 'router' && (
                <RouterForm
                  data={selectedNode.data as RouterNodeData}
                  patch={(p) => makePatch<RouterNodeData>(p)}
                />
              )}
              {selectedNode.data.nodeType === 'accessPoint' && (
                <AccessPointForm
                  data={selectedNode.data as AccessPointNodeData}
                  patch={(p) => makePatch<AccessPointNodeData>(p)}
                />
              )}
              {selectedNode.data.nodeType === 'switch' && (
                <SwitchForm
                  data={selectedNode.data as SwitchNodeData}
                  patch={(p) => makePatch<SwitchNodeData>(p)}
                />
              )}
              {selectedNode.data.nodeType === 'wiredDevice' && (
                <WiredDeviceForm
                  data={selectedNode.data as WiredDeviceNodeData}
                  patch={(p) => makePatch<WiredDeviceNodeData>(p)}
                />
              )}
              {selectedNode.data.nodeType === 'wirelessDevice' && (
                <WirelessDeviceForm
                  data={selectedNode.data as WirelessDeviceNodeData}
                  patch={(p) => makePatch<WirelessDeviceNodeData>(p)}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-800 px-4 py-3">
            <button
              onClick={handleDelete}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-500/60 hover:bg-red-500/20 hover:text-red-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Delete Node
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
