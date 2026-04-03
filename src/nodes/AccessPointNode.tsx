import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { AccessPointNodeData } from '../types/topology'
import BaseNode from './BaseNode'

const WifiIcon = () => (
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
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" />
  </svg>
)

const protocolLabel: Record<string, string> = {
  wifi4: 'Wi-Fi 4',
  wifi5: 'Wi-Fi 5',
  wifi6: 'Wi-Fi 6',
  wifi6e: 'Wi-Fi 6E',
}

export default function AccessPointNode(props: NodeProps) {
  const data = props.data as AccessPointNodeData
  const stat = `${protocolLabel[data.protocol] ?? data.protocol} · ${data.band}`

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <BaseNode id={props.id} icon={<WifiIcon />} label={data.label} stat={stat} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
