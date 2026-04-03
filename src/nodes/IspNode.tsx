import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { IspNodeData } from '../types/topology'
import BaseNode from './BaseNode'

const GlobeIcon = () => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

export default function IspNode(props: NodeProps) {
  const data = props.data as IspNodeData
  const stat = `${data.downloadMbps} / ${data.uploadMbps} Mbps`

  return (
    <>
      <BaseNode id={props.id} icon={<GlobeIcon />} label={data.label} stat={stat} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
