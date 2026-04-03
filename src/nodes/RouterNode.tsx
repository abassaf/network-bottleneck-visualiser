import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { RouterNodeData } from '../types/topology'
import BaseNode from './BaseNode'

type RouterFlowNode = Node<RouterNodeData, 'router'>

const RouterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
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

export default function RouterNode({ id, data }: NodeProps<RouterFlowNode>) {
  const stat = `${data.routingCapMbps} Mbps · ${data.tier}`

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <BaseNode id={id} icon={<RouterIcon />} label={data.label} stat={stat} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
