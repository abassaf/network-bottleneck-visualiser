import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { WirelessDeviceNodeData } from '../types/topology'
import BaseNode from './BaseNode'

const PhoneIcon = () => (
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
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)

const protocolLabel: Record<string, string> = {
  wifi4: 'Wi-Fi 4',
  wifi5: 'Wi-Fi 5',
  wifi6: 'Wi-Fi 6',
  wifi6e: 'Wi-Fi 6E',
}

export default function WirelessDeviceNode(props: NodeProps) {
  const data = props.data as WirelessDeviceNodeData
  const stat = `${protocolLabel[data.protocol] ?? data.protocol} · ${data.distance}`

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <BaseNode id={props.id} icon={<PhoneIcon />} label={data.label} stat={stat} />
    </>
  )
}
