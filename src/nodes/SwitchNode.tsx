import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { SwitchNodeData } from '../types/topology'
import BaseNode from './BaseNode'

const GridIcon = () => (
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
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
)

export default function SwitchNode(props: NodeProps) {
  const data = props.data as SwitchNodeData
  const stat = `${data.portCount}× ${data.portSpeedMbps} Mbps`

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <BaseNode id={props.id} icon={<GridIcon />} label={data.label} stat={stat} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
