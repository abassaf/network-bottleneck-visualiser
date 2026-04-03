import type { Node, Edge, XYPosition } from '@xyflow/react'

// ─── Node types ───────────────────────────────────────────────────────────────

export type NodeType =
  | 'isp'
  | 'modem'
  | 'router'
  | 'accessPoint'
  | 'switch'
  | 'wiredDevice'
  | 'wirelessDevice'

export type WifiProtocol = 'wifi4' | 'wifi5' | 'wifi6' | 'wifi6e'
export type WifiBand = '2.4GHz' | '5GHz' | '6GHz'
export type ChannelWidth = 20 | 40 | 80 | 160
export type WifiStreams = 1 | 2 | 3 | 4
export type DistanceCategory = 'close' | 'medium' | 'far'
export type PortSpeed = 100 | 1000 | 2500 | 10000 // Mbps
export type RouterTier = 'budget' | 'midRange' | 'highEnd'

// Per-node config payloads (discriminated union via nodeType)

// React Flow v12 requires node data to extend Record<string, unknown>.
// The [key: string]: unknown index signature satisfies this while preserving
// the discriminated union narrowing via nodeType.

export interface IspNodeData extends Record<string, unknown> {
  nodeType: 'isp'
  label: string
  downloadMbps: number
  uploadMbps: number
}

export interface ModemNodeData extends Record<string, unknown> {
  nodeType: 'modem'
  label: string
  /** Real-world throughput cap (e.g. DOCSIS 3.0 modem ≈ 1000 Mbps, VDSL2 ≈ 100 Mbps) */
  maxDownloadMbps: number
  maxUploadMbps: number
  model: string
}

export interface RouterNodeData extends Record<string, unknown> {
  nodeType: 'router'
  label: string
  model: string
  tier: RouterTier
  /** WAN port speed */
  wanPortSpeedMbps: PortSpeed
  /** LAN port speed */
  lanPortSpeedMbps: PortSpeed
  /**
   * Software routing throughput cap — set explicitly or derived from tier.
   * Budget routers often cap at 300–400 Mbps regardless of port speed.
   */
  routingCapMbps: number
}

export interface AccessPointNodeData extends Record<string, unknown> {
  nodeType: 'accessPoint'
  label: string
  model: string
  protocol: WifiProtocol
  band: WifiBand
  channelWidth: ChannelWidth
  streams: WifiStreams
}

export interface SwitchNodeData extends Record<string, unknown> {
  nodeType: 'switch'
  label: string
  model: string
  portCount: number
  portSpeedMbps: PortSpeed
}

export interface WiredDeviceNodeData extends Record<string, unknown> {
  nodeType: 'wiredDevice'
  label: string
  nicSpeedMbps: PortSpeed
}

export interface WirelessDeviceNodeData extends Record<string, unknown> {
  nodeType: 'wirelessDevice'
  label: string
  protocol: WifiProtocol
  band: WifiBand
  streams: WifiStreams
  distance: DistanceCategory
}

export type NodeData =
  | IspNodeData
  | ModemNodeData
  | RouterNodeData
  | AccessPointNodeData
  | SwitchNodeData
  | WiredDeviceNodeData
  | WirelessDeviceNodeData

// ─── Edge data ────────────────────────────────────────────────────────────────

export type ConnectionType = 'wired' | 'wireless'

export interface EdgeData extends Record<string, unknown> {
  connectionType: ConnectionType
  /** For wired: port speed of the slower end, resolved at analysis time */
  portSpeedMbps?: PortSpeed
}

// ─── React Flow typed aliases ─────────────────────────────────────────────────

export type TopologyNode = Node<NodeData>
export type TopologyEdge = Edge<EdgeData>

// ─── Topology graph (engine input) ───────────────────────────────────────────

export interface TopologyGraph {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
}

// ─── Analysis result (engine output) ─────────────────────────────────────────

export type NodeId = string

export interface Hop {
  fromId: NodeId
  toId: NodeId
  /** The throughput after this hop's constraint is applied */
  limitingMbps: number
  /** Short human-readable label of the constraint, e.g. "Wi-Fi 5 (80MHz 5GHz)" */
  limitedBy: string
  /** Longer explanation note */
  notes: string
}

export interface BottleneckResult {
  /** Node ID of the limiting hop's destination */
  bottleneckNodeId: NodeId
  /** Effective achievable throughput to the target device */
  effectiveMbps: number
  /** Full chain from ISP to target device */
  chain: Hop[]
  /** Target device node ID that was analysed */
  targetNodeId: NodeId
  /** Plain-English headline explanation */
  explanation: string
  /** Ordered list of recommended fixes (highest impact first) */
  fixes: Fix[]
}

export interface Fix {
  title: string
  description: string
  estimatedNewMbps: number
  difficulty: 'Easy' | 'Medium' | 'Hard' | '$$'
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

export interface NodeTypeConfig {
  type: NodeType
  label: string
  defaultData: NodeData
  defaultPosition: XYPosition
}
