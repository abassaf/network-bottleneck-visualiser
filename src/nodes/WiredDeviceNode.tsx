import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { WiredDeviceNodeData } from '../types/topology'
import BaseNode from './BaseNode'

const EthernetIcon = () => (
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
    <rect x="2" y="8" width="20" height="8" rx="2" />
    <line x1="6" y1="8" x2="6" y2="4" />
    <line x1="10" y1="8" x2="10" y2="4" />
    <line x1="14" y1="8" x2="14" y2="4" />
    <line x1="18" y1="8" x2="18" y2="4" />
    <line x1="12" y1="16" x2="12" y2="20" />
  </svg>
)

export default function WiredDeviceNode(props: NodeProps) {
  const data = props.data as WiredDeviceNodeData
  const stat = `${data.nicSpeedMbps} Mbps NIC`

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <BaseNode id={props.id} icon={<EthernetIcon />} label={data.label} stat={stat} />
    </>
  )
}
