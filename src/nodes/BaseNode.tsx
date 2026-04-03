import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTopologyStore } from '../store'
import { useAnalysisStore } from '../store'

interface BaseNodeProps {
  id: string
  icon: React.ReactNode
  label: string
  stat: string
  children?: React.ReactNode
}

export default function BaseNode({ id, icon, label, stat, children }: BaseNodeProps) {
  const selectNode = useTopologyStore((s) => s.selectNode)
  const selectedNodeId = useTopologyStore((s) => s.selectedNodeId)
  const bottleneckNodeId = useAnalysisStore((s) => s.result?.bottleneckNodeId ?? null)

  const isBottleneck = bottleneckNodeId === id
  const isSelected = selectedNodeId === id

  const handleClick = useCallback(() => {
    selectNode(id)
  }, [id, selectNode])

  return (
    <div
      onClick={handleClick}
      className={[
        'relative flex flex-col items-center gap-1 rounded-xl border bg-zinc-900 px-3 py-2.5 shadow-lg cursor-pointer transition-all duration-150 select-none min-w-[120px]',
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-zinc-700',
        isBottleneck ? 'border-red-500' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Bottleneck pulsing ring */}
      <AnimatePresence>
        {isBottleneck && (
          <motion.span
            key="bottleneck-ring"
            className="pointer-events-none absolute inset-0 rounded-xl border-2 border-red-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0.8, 0.2, 0.8], scale: [1, 1.06, 1] }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <div
        className={[
          'flex h-8 w-8 items-center justify-center rounded-lg',
          isBottleneck ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-blue-400',
        ].join(' ')}
      >
        {icon}
      </div>

      {/* Label */}
      <span className="text-xs font-semibold text-zinc-100 text-center leading-tight max-w-[100px] truncate">
        {label}
      </span>

      {/* Key stat */}
      <span
        className={[
          'text-[10px] font-medium text-center leading-tight',
          isBottleneck ? 'text-red-400' : 'text-zinc-400',
        ].join(' ')}
      >
        {stat}
      </span>

      {children}
    </div>
  )
}
