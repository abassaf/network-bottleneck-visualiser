import { useCallback, useMemo, useRef } from 'react'
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
  bottleneckEdgeId: string | null,
  postBottleneckEdgeIds: Set<string>,
  hasAnalysis: boolean,
): { stroke: string; strokeWidth: number; strokeDasharray?: string; opacity?: number } {
  const connectionType = edge.data?.connectionType ?? 'wired'

  // No active analysis — restore default styling
  if (!hasAnalysis) {
    if (connectionType === 'wireless') {
      return { stroke: 'rgba(59,130,246,0.5)', strokeWidth: 2, strokeDasharray: '6 4' }
    }
    return { stroke: '#52525b', strokeWidth: 2 }
  }

  const isBottleneckEdge = bottleneckEdgeId === edge.id
  const isInChain = bottleneckChainEdgeIds.has(edge.id)
  const isPostBottleneck = postBottleneckEdgeIds.has(edge.id)

  // Edge leading to the bottleneck node — red and thick
  if (isBottleneckEdge) {
    return { stroke: '#ef4444', strokeWidth: 3 }
  }
  // Edges along the analysis path before the bottleneck — blue
  if (isInChain) {
    return { stroke: '#3b82f6', strokeWidth: 3 }
  }
  // Edges after the bottleneck or outside the path — dim
  if (isPostBottleneck) {
    return { stroke: '#3f3f46', strokeWidth: 2, opacity: 0.3 }
  }
  // Edges entirely outside the analysis path — dimmed
  return { stroke: '#3f3f46', strokeWidth: 2, opacity: 0.3 }
}

interface TopologyCanvasProps {
  readonly?: boolean
}

export default function TopologyCanvas({ readonly = false }: TopologyCanvasProps) {
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

  // Build edge highlight sets — memoised so they only recompute when edges or result change
  const { bottleneckChainEdgeIds, postBottleneckEdgeIds, bottleneckEdgeId, hasAnalysis } =
    useMemo(() => {
      const chainIds = new Set<string>()
      const postIds = new Set<string>()
      let bnEdgeId: string | null = null

      if (analysisResult) {
        const { chain, bottleneckNodeId } = analysisResult
        let pastBottleneck = false
        for (const hop of chain) {
          const matchingEdge = edges.find(
            (e) =>
              (e.source === hop.fromId && e.target === hop.toId) ||
              (e.source === hop.toId && e.target === hop.fromId),
          )
          if (matchingEdge) {
            if (pastBottleneck) {
              postIds.add(matchingEdge.id)
            } else {
              chainIds.add(matchingEdge.id)
            }
          }
          if (hop.toId === bottleneckNodeId && matchingEdge) {
            bnEdgeId = matchingEdge.id
            chainIds.delete(matchingEdge.id)
            pastBottleneck = true
          }
        }
      }

      return {
        bottleneckChainEdgeIds: chainIds,
        postBottleneckEdgeIds: postIds,
        bottleneckEdgeId: bnEdgeId,
        hasAnalysis: analysisResult !== null,
      }
    }, [analysisResult, edges])

  const styledEdges = useMemo(() => edges.map((edge) => ({
    ...edge,
    style: getEdgeStyle(edge, bottleneckChainEdgeIds, bottleneckEdgeId, postBottleneckEdgeIds, hasAnalysis),
    animated: hasAnalysis
      ? bottleneckChainEdgeIds.has(edge.id) || bottleneckEdgeId === edge.id
      : edge.data?.connectionType === 'wireless',
  })), [edges, bottleneckChainEdgeIds, postBottleneckEdgeIds, bottleneckEdgeId, hasAnalysis])

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
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full bg-zinc-950"
      style={readonly ? { pointerEvents: 'none' } : undefined}
    >
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={readonly ? undefined : onNodesChange}
        onEdgesChange={readonly ? undefined : onEdgesChange}
        onConnect={readonly ? undefined : onConnect}
        onNodeClick={readonly ? undefined : onNodeClick}
        onPaneClick={readonly ? undefined : onPaneClick}
        onDragOver={readonly ? undefined : onDragOver}
        onDrop={readonly ? undefined : onDrop}
        onInit={(instance) => {
          reactFlowInstance.current = instance as ReactFlowInstance<TopologyNode, TopologyEdge>
        }}
        nodeTypes={stableNodeTypes}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={readonly ? null : 'Delete'}
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
