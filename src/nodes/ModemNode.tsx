import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { ModemNodeData } from '../types/topology'
import BaseNode from './BaseNode'

type ModemFlowNode = Node<ModemNodeData, 'modem'>

const BoxIcon = () => (
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
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
)

export default function ModemNode({ id, data }: NodeProps<ModemFlowNode>) {
  const stat = `${data.maxDownloadMbps} Mbps max`

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <BaseNode id={id} icon={<BoxIcon />} label={data.label} stat={stat} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
