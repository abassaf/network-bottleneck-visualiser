import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeMouseHandler,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type ReactFlowInstance,
} from '@xyflow/react'
import { useTopologyStore } from '../store'
import { useAnalysisStore } from '../store'
import { nodeTypes } from '../nodes'
import type { TopologyNode, TopologyEdge } from '../types/topology'

// nodeTypes defined outside component to avoid re-renders on each render cycle
const stableNodeTypes = nodeTypes

function getEdgeStyle(
  edge: TopologyEdge,
  bottleneckChainEdgeIds: Set<string>,
  postBottleneckEdgeIds: Set<string>,
): { stroke: string; strokeWidth: number; strokeDasharray?: string; opacity?: number } {
  const connectionType = edge.data?.connectionType ?? 'wired'
  const isInChain = bottleneckChainEdgeIds.has(edge.id)
  const isPostBottleneck = postBottleneckEdgeIds.has(edge.id)

  if (isPostBottleneck) {
    return { stroke: '#a1a1aa', strokeWidth: 2, opacity: 0.3 }
  }
  if (isInChain) {
    return { stroke: '#3b82f6', strokeWidth: 2.5 }
  }
  if (connectionType === 'wireless') {
    return { stroke: 'rgba(59,130,246,0.5)', strokeWidth: 2, strokeDasharray: '6 4' }
  }
  return { stroke: '#52525b', strokeWidth: 2 }
}

export default function TopologyCanvas() {
  const nodes = useTopologyStore((s) => s.nodes)
  const edges = useTopologyStore((s) => s.edges)
  const onNodesChange = useTopologyStore((s) => s.onNodesChange) as OnNodesChange<TopologyNode>
  const onEdgesChange = useTopologyStore((s) => s.onEdgesChange) as OnEdgesChange<TopologyEdge>
  const onConnect = useTopologyStore((s) => s.onConnect) as OnConnect
  const selectNode = useTopologyStore((s) => s.selectNode)
  const addNode = useTopologyStore((s) => s.addNode)

  const analysisResult = useAnalysisStore((s) => s.result)

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useRef<ReactFlowInstance<TopologyNode, TopologyEdge> | null>(null)

  // Build sets of edge IDs in the bottleneck chain and after bottleneck
  const bottleneckChainEdgeIds = new Set<string>()
  const postBottleneckEdgeIds = new Set<string>()

  if (analysisResult) {
    const chain = analysisResult.chain
    const bottleneckNodeId = analysisResult.bottleneckNodeId
    let pastBottleneck = false

    for (const hop of chain) {
      const matchingEdge = edges.find(
        (e) =>
          (e.source === hop.fromId && e.target === hop.toId) ||
          (e.source === hop.toId && e.target === hop.fromId),
      )
      if (matchingEdge) {
        if (pastBottleneck) {
          postBottleneckEdgeIds.add(matchingEdge.id)
        } else {
          bottleneckChainEdgeIds.add(matchingEdge.id)
        }
      }
      if (hop.toId === bottleneckNodeId) {
        pastBottleneck = true
      }
    }
  }

  const styledEdges = edges.map((edge) => ({
    ...edge,
    style: getEdgeStyle(edge, bottleneckChainEdgeIds, postBottleneckEdgeIds),
    animated: edge.data?.connectionType === 'wireless',
  }))

  const onNodeClick: NodeMouseHandler<TopologyNode> = useCallback(
    (_event, node) => {
      selectNode(node.id)
    },
    [selectNode],
  )

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const nodeType = event.dataTransfer.getData('application/reactflow-nodetype')
      if (!nodeType || !reactFlowInstance.current || !reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      addNode(
        nodeType as import('../types/topology').NodeType,
        position,
      )
    },
    [addNode],
  )

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={(instance) => {
          reactFlowInstance.current = instance as ReactFlowInstance<TopologyNode, TopologyEdge>
        }}
        nodeTypes={stableNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        className="bg-zinc-950"
      >
        <Background variant={'dots' as never} gap={24} size={1} color="#27272a" />
        <Controls className="[&>button]:bg-zinc-800 [&>button]:border-zinc-700 [&>button]:text-zinc-300 [&>button:hover]:bg-zinc-700" />
        <MiniMap
          bgColor="#09090b"
          nodeColor="#27272a"
          maskColor="rgba(9,9,11,0.6)"
          style={{ background: '#18181b', border: '1px solid #3f3f46' }}
        />
      </ReactFlow>
    </div>
  )
}
