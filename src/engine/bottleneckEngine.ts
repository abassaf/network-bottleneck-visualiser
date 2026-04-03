/**
 * Bottleneck Engine — pure TypeScript, no React dependencies.
 *
 * Traverses the topology graph from the ISP node to each end device,
 * computes the effective throughput at each hop using real-world figures,
 * identifies the bottleneck, and generates plain-English explanations
 * with recommended fixes.
 */

import type {
  TopologyGraph,
  TopologyNode,
  IspNodeData,
  BottleneckResult,
  Hop,
  Fix,
  NodeId,
} from '../types/topology'
import {
  getWifiThroughput,
  DISTANCE_MULTIPLIER,
  getWiredThroughput,
} from './throughputTables'

// ─── Internal graph representation ───────────────────────────────────────────

interface AdjNode {
  nodeId: NodeId
  connectionType: 'wired' | 'wireless'
  edgeId: string
}

interface CapDetails {
  mbps: number
  label: string
  notes: string
}

function isEndDeviceNode(node: TopologyNode): boolean {
  return node.data.nodeType === 'wiredDevice' || node.data.nodeType === 'wirelessDevice'
}

function isIspNode(node: TopologyNode): node is TopologyNode & { data: IspNodeData } {
  return node.data.nodeType === 'isp'
}

function buildUndirectedEdgeKey(a: NodeId, b: NodeId): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`
}

function formatPortSpeed(speedMbps: number): string {
  return speedMbps >= 1000 ? `${speedMbps / 1000} Gbps` : `${speedMbps} Mbps`
}

function getNodeWiredPortSpeed(node: TopologyNode, peer: TopologyNode): number | null {
  const data = node.data

  switch (data.nodeType) {
    case 'isp':
      return Infinity
    case 'modem':
      // Modelled as modem WAN/LAN port capability in absence of explicit port fields.
      return Math.min(Math.max(data.maxDownloadMbps, 100), 10000)
    case 'router':
      return peer.data.nodeType === 'isp' || peer.data.nodeType === 'modem'
        ? data.wanPortSpeedMbps
        : data.lanPortSpeedMbps
    case 'switch':
      return data.portSpeedMbps
    case 'accessPoint':
      // Most consumer AP/router LAN uplinks are 1 Gbps unless explicitly modelled.
      return 1000
    case 'wiredDevice':
      return data.nicSpeedMbps
    case 'wirelessDevice':
      return null
  }
}

function computeWiredEdgeCap(fromNode: TopologyNode, toNode: TopologyNode): CapDetails | null {
  const fromPortSpeed = getNodeWiredPortSpeed(fromNode, toNode)
  const toPortSpeed = getNodeWiredPortSpeed(toNode, fromNode)
  if (fromPortSpeed === null || toPortSpeed === null) return null

  const limitingPortSpeed = Math.min(fromPortSpeed, toPortSpeed)
  const effectiveMbps = Math.round(getWiredThroughput(fromPortSpeed, toPortSpeed))

  return {
    mbps: effectiveMbps,
    label: `Wired link (${formatPortSpeed(limitingPortSpeed)})`,
    notes: `${formatPortSpeed(limitingPortSpeed)} Ethernet between ${fromNode.data.label} and ${toNode.data.label} delivers ~${effectiveMbps} Mbps effective throughput after overhead.`,
  }
}

function buildAdjacency(graph: TopologyGraph): Map<NodeId, AdjNode[]> {
  const adj = new Map<NodeId, AdjNode[]>()
  for (const node of graph.nodes) adj.set(node.id, [])

  for (const edge of graph.edges) {
    const data = edge.data ?? { connectionType: 'wired' }
    const connectionType = data.connectionType ?? 'wired'
    adj.get(edge.source)?.push({ nodeId: edge.target, connectionType, edgeId: edge.id })
    adj.get(edge.target)?.push({ nodeId: edge.source, connectionType, edgeId: edge.id })
  }
  return adj
}

function findIspNode(graph: TopologyGraph): (TopologyNode & { data: IspNodeData }) | null {
  return graph.nodes.find(isIspNode) ?? null
}

function findEndDevices(graph: TopologyGraph): TopologyNode[] {
  return graph.nodes.filter(isEndDeviceNode)
}

// ─── Per-hop throughput computation ──────────────────────────────────────────

/**
 * Computes the throughput cap imposed by a single node, given the incoming
 * throughput from the previous hop.
 */
function computeNodeCap(node: TopologyNode): CapDetails {
  const data = node.data

  switch (data.nodeType) {
    case 'isp':
      return {
        mbps: data.downloadMbps,
        label: `ISP plan (${data.downloadMbps} Mbps)`,
        notes: `Your NBN/internet plan is capped at ${data.downloadMbps} Mbps download.`,
      }

    case 'modem':
      return {
        mbps: data.maxDownloadMbps,
        label: `Modem (${data.model})`,
        notes: `${data.model} supports up to ${data.maxDownloadMbps} Mbps real-world throughput.`,
      }

    case 'router': {
      // Routing cap is the lower of: software routing throughput OR WAN port speed
      const cap = Math.min(data.routingCapMbps, data.wanPortSpeedMbps)
      const tierLabel = data.tier === 'budget' ? 'budget' : data.tier === 'midRange' ? 'mid-range' : 'high-end'
      return {
        mbps: cap,
        label: `Router (${data.model})`,
        notes:
          data.routingCapMbps < data.wanPortSpeedMbps
            ? `${data.model} is a ${tierLabel} router with a software routing cap of ~${data.routingCapMbps} Mbps due to CPU limitations.`
            : `${data.model} routes at ${cap} Mbps (limited by WAN port speed).`,
      }
    }

    case 'accessPoint': {
      const wifi = getWifiThroughput(data.protocol, data.band, data.channelWidth, data.streams)
      const protocolLabel: Record<string, string> = {
        wifi4: 'Wi-Fi 4 (802.11n)',
        wifi5: 'Wi-Fi 5 (802.11ac)',
        wifi6: 'Wi-Fi 6 (802.11ax)',
        wifi6e: 'Wi-Fi 6E (802.11ax 6GHz)',
      }
      return {
        mbps: wifi.realWorldMbps,
        label: wifi.label,
        notes: `${data.model} on ${data.band} ${data.channelWidth}MHz channel using ${protocolLabel[data.protocol] ?? data.protocol} achieves ~${wifi.realWorldMbps} Mbps real-world throughput (theoretical max: ${wifi.theoreticalMbps} Mbps).`,
      }
    }

    case 'switch':
      // Switches are treated as line-rate; they don't cap throughput unless
      // a device port is slower — that is handled in edge computation.
      return {
        mbps: data.portSpeedMbps * 0.95,
        label: `Switch (${data.portSpeedMbps / 1000}G)`,
        notes: `${data.model} switches at ${data.portSpeedMbps} Mbps line rate (effectively not a bottleneck).`,
      }

    case 'wiredDevice':
      return {
        mbps: data.nicSpeedMbps * 0.95,
        label: `Wired NIC (${data.nicSpeedMbps >= 1000 ? `${data.nicSpeedMbps / 1000}G` : `${data.nicSpeedMbps}M`})`,
        notes: `Device NIC supports ${data.nicSpeedMbps} Mbps, achieving ~${Math.round(data.nicSpeedMbps * 0.95)} Mbps real-world.`,
      }

    case 'wirelessDevice': {
      // Device capability: use device's protocol + band + streams, but channel width
      // is set by the AP — we use 80MHz as a reasonable default for the device side.
      const wifi = getWifiThroughput(data.protocol, data.band, 80, data.streams)
      const distanceMultiplier = DISTANCE_MULTIPLIER[data.distance]
      const effectiveMbps = Math.round(wifi.realWorldMbps * distanceMultiplier)
      const distanceLabel = { close: 'close range', medium: 'medium range', far: 'far range' }[data.distance]
      return {
        mbps: effectiveMbps,
        label: `Wireless NIC (${data.protocol} · ${distanceLabel})`,
        notes: `Device Wi-Fi adapter at ${distanceLabel} achieves ~${effectiveMbps} Mbps (${Math.round(distanceMultiplier * 100)}% of ${wifi.realWorldMbps} Mbps peak due to distance).`,
      }
    }
  }
}

// ─── Path traversal ───────────────────────────────────────────────────────────

interface TraversalPath {
  nodeIds: NodeId[]
}

/**
 * BFS from ISP node to target device, returning the path as a list of node IDs.
 * Returns null if unreachable.
 */
function findPath(
  startId: NodeId,
  targetId: NodeId,
  adj: Map<NodeId, AdjNode[]>,
  nodeMap: Map<NodeId, TopologyNode>,
): TraversalPath | null {
  const visited = new Set<NodeId>([startId])
  const queue: { nodeId: NodeId; path: NodeId[] }[] = [{ nodeId: startId, path: [startId] }]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.nodeId === targetId) {
      return { nodeIds: current.path }
    }

    const currentNode = nodeMap.get(current.nodeId)
    if (currentNode && current.nodeId !== targetId && isEndDeviceNode(currentNode)) {
      continue
    }

    for (const neighbour of adj.get(current.nodeId) ?? []) {
      const neighbourNode = nodeMap.get(neighbour.nodeId)
      if (neighbourNode && neighbour.nodeId !== targetId && isEndDeviceNode(neighbourNode)) {
        continue
      }
      if (!visited.has(neighbour.nodeId)) {
        visited.add(neighbour.nodeId)
        queue.push({ nodeId: neighbour.nodeId, path: [...current.path, neighbour.nodeId] })
      }
    }
  }
  return null
}

// ─── Fix generation ───────────────────────────────────────────────────────────

function generateFixes(
  bottleneckNode: TopologyNode,
  effectiveMbps: number,
  ispMbps: number,
): Fix[] {
  const fixes: Fix[] = []
  const data = bottleneckNode.data

  switch (data.nodeType) {
    case 'router': {
      if (data.tier === 'budget') {
        fixes.push({
          title: 'Upgrade to a mid-range router',
          description: `Replace ${data.model} with a mid-range router (e.g. ASUS RT-AX58U, TP-Link Archer AX73). Mid-range routers achieve ~940 Mbps routing throughput.`,
          estimatedNewMbps: Math.min(940, ispMbps),
          difficulty: '$$',
        })
      }
      if (data.tier !== 'highEnd') {
        fixes.push({
          title: 'Enable hardware NAT/acceleration',
          description: 'Check your router settings for "Hardware NAT", "CTF", or "Flow-based forwarding" — this can increase routing throughput by 30–50% on some models at no cost.',
          estimatedNewMbps: Math.min(Math.round(effectiveMbps * 1.4), ispMbps),
          difficulty: 'Easy',
        })
      }
      break
    }
    case 'accessPoint': {
      if (data.protocol === 'wifi4' || data.protocol === 'wifi5') {
        const upgradedWifi = getWifiThroughput('wifi6', '5GHz', 80, 2)
        fixes.push({
          title: 'Upgrade to Wi-Fi 6 access point',
          description: `Replace your ${data.protocol === 'wifi4' ? 'Wi-Fi 4' : 'Wi-Fi 5'} AP with a Wi-Fi 6 model (e.g. ASUS RT-AX58U, TP-Link Deco XE75). Wi-Fi 6 on 80MHz 5GHz achieves ~${upgradedWifi.realWorldMbps} Mbps.`,
          estimatedNewMbps: Math.min(upgradedWifi.realWorldMbps, ispMbps),
          difficulty: '$$',
        })
      }
      if (data.channelWidth < 80 && data.band === '5GHz') {
        const widerWifi = getWifiThroughput(data.protocol, data.band, 80, data.streams)
        fixes.push({
          title: 'Widen Wi-Fi channel to 80MHz',
          description: `Change your AP channel width from ${data.channelWidth}MHz to 80MHz in the router/AP settings. This can roughly double your Wi-Fi throughput if spectrum is available.`,
          estimatedNewMbps: Math.min(widerWifi.realWorldMbps, ispMbps),
          difficulty: 'Easy',
        })
      }
      if (data.band === '2.4GHz') {
        const fiveGhzWifi = getWifiThroughput(data.protocol === 'wifi4' ? 'wifi5' : data.protocol, '5GHz', 80, data.streams)
        fixes.push({
          title: 'Switch device to 5GHz band',
          description: '2.4GHz is congested and limited to ~300 Mbps maximum. Connect to the 5GHz network instead — it offers significantly higher throughput and less interference.',
          estimatedNewMbps: Math.min(fiveGhzWifi.realWorldMbps, ispMbps),
          difficulty: 'Easy',
        })
      }
      break
    }
    case 'wirelessDevice': {
      fixes.push({
        title: 'Use a wired Ethernet connection',
        description: 'Replace the Wi-Fi connection with a Gigabit Ethernet cable. Wired connections eliminate Wi-Fi overhead and distance degradation, typically achieving ~940 Mbps.',
        estimatedNewMbps: Math.min(940, ispMbps),
        difficulty: 'Easy',
      })
      if (data.distance === 'far' || data.distance === 'medium') {
        fixes.push({
          title: 'Move device closer to AP or add a mesh node',
          description: 'Distance significantly degrades Wi-Fi performance. Moving the device closer (or adding a Wi-Fi mesh node) can recover 30–60% of peak throughput.',
          estimatedNewMbps: Math.min(Math.round(effectiveMbps / DISTANCE_MULTIPLIER[data.distance]), ispMbps),
          difficulty: 'Easy',
        })
      }
      break
    }
    case 'modem': {
      fixes.push({
        title: 'Upgrade modem to match plan speed',
        description: `Your modem caps throughput at ${data.maxDownloadMbps} Mbps which is below your plan speed of ${ispMbps} Mbps. A DOCSIS 3.1 or fibre ONT capable modem will remove this bottleneck.`,
        estimatedNewMbps: ispMbps,
        difficulty: '$$',
      })
      break
    }
    case 'isp': {
      fixes.push({
        title: 'Upgrade your NBN plan',
        description: `Your current plan is ${data.downloadMbps} Mbps. Upgrading to a higher-tier plan (e.g. NBN 250 or NBN 1000) would allow your hardware to reach its full potential.`,
        estimatedNewMbps: 250,
        difficulty: '$$',
      })
      break
    }
  }

  // Always offer a general wired upgrade if the bottleneck is wireless
  if (data.nodeType === 'accessPoint' || data.nodeType === 'wirelessDevice') {
    const alreadyHasWiredFix = fixes.some((f) => f.title.includes('wired'))
    if (!alreadyHasWiredFix) {
      fixes.push({
        title: 'Use wired Ethernet where possible',
        description: 'Wired connections always outperform wireless. For stationary devices like desktops, TVs, and NAS units, run an Ethernet cable for maximum throughput.',
        estimatedNewMbps: Math.min(940, ispMbps),
        difficulty: 'Medium',
      })
    }
  }

  // Sort by estimated throughput gain (descending)
  return fixes.sort((a, b) => b.estimatedNewMbps - a.estimatedNewMbps)
}

// ─── Plain-English explanation ────────────────────────────────────────────────

function buildExplanation(
  bottleneckNode: TopologyNode,
  effectiveMbps: number,
  ispMbps: number,
): string {
  const data = bottleneckNode.data
  const roundedMbps = Math.round(effectiveMbps)

  switch (data.nodeType) {
    case 'isp':
      return `Your NBN plan is capped at ${data.downloadMbps} Mbps — this is your effective maximum throughput.`

    case 'modem':
      return `Your modem (${data.model}) is capping throughput at ${data.maxDownloadMbps} Mbps, which is below your ${ispMbps} Mbps plan speed.`

    case 'router': {
      const tierLabel = data.tier === 'budget' ? 'budget' : data.tier === 'midRange' ? 'mid-range' : 'high-end'
      return `Your ${tierLabel} router (${data.model}) is limiting throughput to ~${roundedMbps} Mbps due to its software routing cap — your ${ispMbps} Mbps plan can't be fully utilised.`
    }

    case 'accessPoint': {
      const protocolLabel: Record<string, string> = {
        wifi4: 'Wi-Fi 4 (802.11n)',
        wifi5: 'Wi-Fi 5 (802.11ac)',
        wifi6: 'Wi-Fi 6 (802.11ax)',
        wifi6e: 'Wi-Fi 6E',
      }
      return `Your ${protocolLabel[data.protocol] ?? data.protocol} access point on ${data.channelWidth}MHz ${data.band} is capping your wireless connection at ~${roundedMbps} Mbps — your ${ispMbps} Mbps plan can't reach devices wirelessly.`
    }

    case 'wirelessDevice': {
      const distanceLabel = { close: 'close', medium: 'medium', far: 'far' }[data.distance]
      return `Your wireless device at ${distanceLabel} range is achieving ~${roundedMbps} Mbps. Moving it closer or upgrading to a wired connection would significantly increase throughput.`
    }

    case 'switch':
      return `Your switch is limiting throughput to ~${roundedMbps} Mbps. This is likely due to a port speed mismatch.`

    case 'wiredDevice':
      return `Your wired device's network card (${data.nicSpeedMbps} Mbps NIC) is the limiting factor at ~${roundedMbps} Mbps.`

    default:
      return `Effective throughput to this device is ~${roundedMbps} Mbps.`
  }
}

// ─── Main engine entry point ──────────────────────────────────────────────────

export interface EngineError {
  type: 'NO_ISP' | 'DISCONNECTED' | 'NO_DEVICES' | 'NO_PATH'
  message: string
}

export type EngineResult =
  | { ok: true; results: BottleneckResult[] }
  | { ok: false; error: EngineError }

export function runBottleneckEngine(graph: TopologyGraph): EngineResult {
  if (graph.nodes.length === 0) {
    return { ok: false, error: { type: 'NO_ISP', message: 'Add an ISP node to get started.' } }
  }

  const ispNode = findIspNode(graph)
  if (!ispNode) {
    return { ok: false, error: { type: 'NO_ISP', message: 'No ISP node found in the topology.' } }
  }

  const endDevices = findEndDevices(graph)
  if (endDevices.length === 0) {
    return { ok: false, error: { type: 'NO_DEVICES', message: 'Add at least one wired or wireless device to analyse.' } }
  }

  const nodeMap = new Map<NodeId, TopologyNode>(graph.nodes.map((n) => [n.id, n]))
  const edgeMap = new Map<string, (typeof graph.edges)[number]>(
    graph.edges.map((edge) => [buildUndirectedEdgeKey(edge.source, edge.target), edge]),
  )
  const adj = buildAdjacency(graph)
  const ispMbps = ispNode.data.downloadMbps

  const results: BottleneckResult[] = []

  for (const device of endDevices) {
    const path = findPath(ispNode.id, device.id, adj, nodeMap)
    if (!path) continue // device not connected to ISP

    const hops: Hop[] = []
    let runningMin = Infinity
    // Track which node is currently imposing the minimum — this IS the bottleneck.
    let limitingNodeId: NodeId = ispNode.id
    let limitingLabel = ''
    let limitingNotes = ''

    for (let i = 0; i < path.nodeIds.length; i++) {
      const nodeId = path.nodeIds[i]
      const node = nodeMap.get(nodeId)
      if (!node) continue

      const nodeCap = computeNodeCap(node)
      let appliedCap: CapDetails = nodeCap

      if (i > 0) {
        const prevNodeId = path.nodeIds[i - 1]
        const prevNode = nodeMap.get(prevNodeId)
        if (!prevNode) continue

        const edge = edgeMap.get(buildUndirectedEdgeKey(prevNodeId, nodeId))
        const connectionType = edge?.data?.connectionType ?? 'wired'
        if (connectionType === 'wired') {
          const wiredEdgeCap = computeWiredEdgeCap(prevNode, node)
          if (wiredEdgeCap && wiredEdgeCap.mbps < appliedCap.mbps) {
            appliedCap = wiredEdgeCap
          }
        }
      }

      // When this node's cap drops below the current running minimum,
      // it becomes the new bottleneck.
      if (appliedCap.mbps < runningMin) {
        runningMin = appliedCap.mbps
        limitingNodeId = nodeId
        limitingLabel = appliedCap.label
        limitingNotes = appliedCap.notes
      }

      if (i > 0) {
        const prevNodeId = path.nodeIds[i - 1]
        hops.push({
          fromId: prevNodeId,
          toId: nodeId,
          limitingMbps: runningMin,
          // Use the label/notes of the actual limiting node, not the hop destination.
          limitedBy: limitingLabel,
          notes: limitingNotes,
        })
      }
    }

    if (hops.length === 0) continue

    // The bottleneck is the node that imposed the minimum — tracked directly above.
    const bottleneckNodeId = limitingNodeId
    const bottleneckNode = nodeMap.get(bottleneckNodeId)
    if (!bottleneckNode) continue
    const effectiveMbps = Math.round(runningMin)

    results.push({
      bottleneckNodeId,
      effectiveMbps,
      chain: hops,
      targetNodeId: device.id,
      explanation: buildExplanation(bottleneckNode, effectiveMbps, ispMbps),
      fixes: generateFixes(bottleneckNode, effectiveMbps, ispMbps),
    })
  }

  if (results.length === 0) {
    return {
      ok: false,
      error: { type: 'NO_PATH', message: 'No connected devices found. Connect your devices to the network.' },
    }
  }

  return { ok: true, results }
}

/**
 * Convenience: run engine and return the result for a specific target device.
 */
export function analyseDevice(
  graph: TopologyGraph,
  targetNodeId: NodeId,
): BottleneckResult | null {
  const engineResult = runBottleneckEngine(graph)
  if (!engineResult.ok) return null
  return engineResult.results.find((r) => r.targetNodeId === targetNodeId) ?? null
}
