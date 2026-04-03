import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import type {
  TopologyNode,
  TopologyEdge,
  NodeData,
  NodeType,
  EdgeData,
  BottleneckResult,
} from '../types/topology'

// ─── Default node data factories ─────────────────────────────────────────────

function defaultNodeData(type: NodeType): NodeData {
  switch (type) {
    case 'isp':
      return { nodeType: 'isp', label: 'ISP', downloadMbps: 100, uploadMbps: 20 }
    case 'modem':
      return { nodeType: 'modem', label: 'Modem', maxDownloadMbps: 1000, maxUploadMbps: 50, model: 'Generic DOCSIS 3.0' }
    case 'router':
      return {
        nodeType: 'router',
        label: 'Router',
        model: 'Generic Router',
        tier: 'midRange',
        wanPortSpeedMbps: 1000,
        lanPortSpeedMbps: 1000,
        routingCapMbps: 900,
      }
    case 'accessPoint':
      return {
        nodeType: 'accessPoint',
        label: 'Wi-Fi AP',
        model: 'Generic AP',
        protocol: 'wifi5',
        band: '5GHz',
        channelWidth: 80,
        streams: 2,
      }
    case 'switch':
      return { nodeType: 'switch', label: 'Switch', model: 'Generic Switch', portCount: 8, portSpeedMbps: 1000 }
    case 'wiredDevice':
      return { nodeType: 'wiredDevice', label: 'Wired Device', nicSpeedMbps: 1000 }
    case 'wirelessDevice':
      return {
        nodeType: 'wirelessDevice',
        label: 'Wireless Device',
        protocol: 'wifi5',
        band: '5GHz',
        streams: 1,
        distance: 'close',
      }
  }
}

let nodeCounter = 1

// ─── Topology store ───────────────────────────────────────────────────────────

interface TopologyStore {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  selectedNodeId: string | null

  onNodesChange: OnNodesChange<TopologyNode>
  onEdgesChange: OnEdgesChange<TopologyEdge>
  onConnect: OnConnect

  addNode: (type: NodeType, position: { x: number; y: number }) => void
  updateNodeData: (id: string, patch: Partial<NodeData>) => void
  removeNode: (id: string) => void
  selectNode: (id: string | null) => void
  loadTopology: (nodes: TopologyNode[], edges: TopologyEdge[]) => void
  reset: () => void
}

export const useTopologyStore = create<TopologyStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes: NodeChange<TopologyNode>[]) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes: EdgeChange<TopologyEdge>[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection: Connection) => {
    const edge: TopologyEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}`,
      data: { connectionType: 'wired' } as EdgeData,
      animated: false,
      style: { stroke: '#3f3f46', strokeWidth: 2 },
    }
    set({ edges: addEdge(edge, get().edges as TopologyEdge[]) })
  },

  addNode: (type: NodeType, position: { x: number; y: number }) => {
    const id = `${type}-${nodeCounter++}`
    const newNode: TopologyNode = {
      id,
      type,
      position,
      data: defaultNodeData(type),
    }
    set({ nodes: [...get().nodes, newNode] })
  },

  updateNodeData: (id: string, patch: Partial<NodeData>) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } as NodeData } : n,
      ),
    })
  },

  removeNode: (id: string) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    })
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id })
  },

  loadTopology: (nodes: TopologyNode[], edges: TopologyEdge[]) => {
    set({ nodes, edges, selectedNodeId: null })
  },

  reset: () => {
    set({ nodes: [], edges: [], selectedNodeId: null })
  },
}))

// ─── Analysis store ───────────────────────────────────────────────────────────

interface AnalysisStore {
  result: BottleneckResult | null
  isAnalysing: boolean
  targetNodeId: string | null
  setResult: (result: BottleneckResult | null) => void
  setAnalysing: (v: boolean) => void
  setTargetNodeId: (id: string | null) => void
  clearResult: () => void
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  result: null,
  isAnalysing: false,
  targetNodeId: null,
  setResult: (result) => set({ result }),
  setAnalysing: (v) => set({ isAnalysing: v }),
  setTargetNodeId: (id) => set({ targetNodeId: id }),
  clearResult: () => set({ result: null }),
}))

// ─── Comparison store ─────────────────────────────────────────────────────────

interface ComparisonStore {
  isComparing: boolean
  afterNodes: TopologyNode[]
  afterEdges: TopologyEdge[]
  afterResult: BottleneckResult | null
  enterComparison: (nodes: TopologyNode[], edges: TopologyEdge[]) => void
  exitComparison: () => void
  updateAfterNode: (id: string, patch: Partial<NodeData>) => void
  setAfterResult: (result: BottleneckResult | null) => void
  onAfterNodesChange: OnNodesChange<TopologyNode>
  onAfterEdgesChange: OnEdgesChange<TopologyEdge>
}

export const useComparisonStore = create<ComparisonStore>((set, get) => ({
  isComparing: false,
  afterNodes: [],
  afterEdges: [],
  afterResult: null,

  enterComparison: (nodes, edges) => {
    // Deep-clone so after state is fully independent
    set({
      isComparing: true,
      afterNodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
      afterEdges: edges.map((e) => ({ ...e, data: { ...e.data } as EdgeData })),
      afterResult: null,
    })
  },

  exitComparison: () => {
    set({ isComparing: false, afterNodes: [], afterEdges: [], afterResult: null })
  },

  updateAfterNode: (id, patch) => {
    set({
      afterNodes: get().afterNodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } as NodeData } : n,
      ),
    })
  },

  setAfterResult: (result) => set({ afterResult: result }),

  onAfterNodesChange: (changes: NodeChange<TopologyNode>[]) => {
    set({ afterNodes: applyNodeChanges(changes, get().afterNodes) })
  },

  onAfterEdgesChange: (changes: EdgeChange<TopologyEdge>[]) => {
    set({ afterEdges: applyEdgeChanges(changes, get().afterEdges) })
  },
}))
