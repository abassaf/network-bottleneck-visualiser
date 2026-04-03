import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type NodeMouseHandler,
} from '@xyflow/react'
import { useComparisonStore, useAnalysisStore } from '../store'
import { nodeTypes } from '../nodes'
import { runBottleneckEngine } from '../engine/bottleneckEngine'
import type { TopologyNode, TopologyEdge } from '../types/topology'
import ComparisonConfigPanel from './ComparisonConfigPanel'

// Defined outside component to avoid re-renders
const stableNodeTypes = nodeTypes

function getEdgeStyle(
  edge: TopologyEdge,
  bottleneckChainEdgeIds: Set<string>,
  bottleneckEdgeId: string | null,
  postBottleneckEdgeIds: Set<string>,
  hasAnalysis: boolean,
): { stroke: string; strokeWidth: number; strokeDasharray?: string; opacity?: number } {
  const connectionType = edge.data?.connectionType ?? 'wired'

  if (!hasAnalysis) {
    if (connectionType === 'wireless') {
      return { stroke: 'rgba(59,130,246,0.5)', strokeWidth: 2, strokeDasharray: '6 4' }
    }
    return { stroke: '#52525b', strokeWidth: 2 }
  }

  const isBottleneckEdge = bottleneckEdgeId === edge.id
  const isInChain = bottleneckChainEdgeIds.has(edge.id)
  const isPostBottleneck = postBottleneckEdgeIds.has(edge.id)

  if (isBottleneckEdge) {
    return { stroke: '#ef4444', strokeWidth: 3 }
  }
  if (isInChain) {
    return { stroke: '#3b82f6', strokeWidth: 3 }
  }
  if (isPostBottleneck) {
    return { stroke: '#3f3f46', strokeWidth: 2, opacity: 0.3 }
  }
  return { stroke: '#3f3f46', strokeWidth: 2, opacity: 0.3 }
}

export default function ComparisonCanvas() {
  const afterNodes = useComparisonStore((s) => s.afterNodes)
  const afterEdges = useComparisonStore((s) => s.afterEdges)
  const afterResult = useComparisonStore((s) => s.afterResult)
  const onAfterNodesChange = useComparisonStore((s) => s.onAfterNodesChange)
  const onAfterEdgesChange = useComparisonStore((s) => s.onAfterEdgesChange)
  const setAfterResult = useComparisonStore((s) => s.setAfterResult)

  const beforeTargetNodeId = useAnalysisStore((s) => s.result?.targetNodeId ?? null)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Re-run engine whenever afterNodes changes
  useEffect(() => {
    if (afterNodes.length === 0 || !beforeTargetNodeId) return

    const engineResult = runBottleneckEngine({ nodes: afterNodes, edges: afterEdges })
    if (engineResult.ok) {
      const match = engineResult.results.find((r) => r.targetNodeId === beforeTargetNodeId) ?? null
      setAfterResult(match)
    } else {
      setAfterResult(null)
    }
  }, [afterNodes, afterEdges, beforeTargetNodeId, setAfterResult])

  // Build edge highlight sets from afterResult
  const bottleneckChainEdgeIds = new Set<string>()
  const postBottleneckEdgeIds = new Set<string>()
  let bottleneckEdgeId: string | null = null

  if (afterResult) {
    const chain = afterResult.chain
    const bottleneckNodeId = afterResult.bottleneckNodeId
    let pastBottleneck = false

    for (const hop of chain) {
      const matchingEdge = afterEdges.find(
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
        if (matchingEdge) {
          bottleneckEdgeId = matchingEdge.id
          bottleneckChainEdgeIds.delete(matchingEdge.id)
        }
        pastBottleneck = true
      }
    }
  }

  const hasAnalysis = afterResult !== null

  const styledEdges = afterEdges.map((edge) => ({
    ...edge,
    style: getEdgeStyle(edge, bottleneckChainEdgeIds, bottleneckEdgeId, postBottleneckEdgeIds, hasAnalysis),
    animated: hasAnalysis
      ? bottleneckChainEdgeIds.has(edge.id) || bottleneckEdgeId === edge.id
      : edge.data?.connectionType === 'wireless',
  }))

  const onNodeClick: NodeMouseHandler<TopologyNode> = useCallback((_event, node) => {
    setSelectedNodeId(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  return (
    <div className="relative flex-1 h-full bg-zinc-950">
      <ReactFlow<TopologyNode, TopologyEdge>
        nodes={afterNodes}
        edges={styledEdges}
        onNodesChange={onAfterNodesChange}
        onEdgesChange={onAfterEdgesChange}
        onConnect={undefined}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={stableNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={null}
        className="bg-zinc-950"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
        <Controls className="[&>button]:bg-zinc-800 [&>button]:border-zinc-700 [&>button]:text-zinc-300 [&>button:hover]:bg-zinc-700" />
      </ReactFlow>

      {selectedNodeId && (
        <ComparisonConfigPanel
          selectedNodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  )
}
