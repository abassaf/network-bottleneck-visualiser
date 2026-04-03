/**
 * Real-world Wi-Fi and wired throughput reference tables.
 *
 * Figures are based on SmallNetBuilder, Wirecutter, and published IEEE 802.11
 * spec sheets. Real-world values account for protocol overhead, typical
 * interference, and single-client UDP/TCP benchmarks (not theoretical PHY rate).
 *
 * All values in Mbps.
 */

import type { WifiProtocol, WifiBand, ChannelWidth, WifiStreams, DistanceCategory, RouterTier } from '../types/topology'

// ─── Wi-Fi throughput lookup ──────────────────────────────────────────────────

export interface WifiThroughput {
  theoreticalMbps: number
  realWorldMbps: number
  /** Short display label */
  label: string
}

// Key: `${protocol}-${band}-${channelWidth}-${streams}`
type WifiKey = string

function wifiKey(
  protocol: WifiProtocol,
  band: WifiBand,
  channelWidth: ChannelWidth,
  streams: WifiStreams,
): WifiKey {
  return `${protocol}-${band}-${channelWidth}-${streams}`
}

/**
 * Real-world Wi-Fi throughput table.
 *
 * Sources:
 * - 802.11n (Wi-Fi 4): SmallNetBuilder 2.4GHz ≈ 40–130 Mbps real, 5GHz ≈ 120–180 Mbps real
 * - 802.11ac (Wi-Fi 5): SmallNetBuilder ≈ 280–500 Mbps real for 2-stream 80MHz
 * - 802.11ax (Wi-Fi 6): SmallNetBuilder ≈ 600–900 Mbps real for 2-stream 80MHz 5GHz
 * - 802.11ax 6GHz (Wi-Fi 6E): ~800–1500 Mbps real for 2-stream 160MHz
 */
const WIFI_TABLE: Partial<Record<WifiKey, WifiThroughput>> = {
  // ── Wi-Fi 4 (802.11n) ────────────────────────────────────────────────────
  [wifiKey('wifi4', '2.4GHz', 20, 1)]:  { theoreticalMbps: 72,  realWorldMbps: 35,  label: 'Wi-Fi 4 · 2.4GHz · 20MHz · 1SS' },
  [wifiKey('wifi4', '2.4GHz', 20, 2)]:  { theoreticalMbps: 144, realWorldMbps: 65,  label: 'Wi-Fi 4 · 2.4GHz · 20MHz · 2SS' },
  [wifiKey('wifi4', '2.4GHz', 40, 1)]:  { theoreticalMbps: 150, realWorldMbps: 70,  label: 'Wi-Fi 4 · 2.4GHz · 40MHz · 1SS' },
  [wifiKey('wifi4', '2.4GHz', 40, 2)]:  { theoreticalMbps: 300, realWorldMbps: 120, label: 'Wi-Fi 4 · 2.4GHz · 40MHz · 2SS' },
  [wifiKey('wifi4', '5GHz',   20, 1)]:  { theoreticalMbps: 72,  realWorldMbps: 50,  label: 'Wi-Fi 4 · 5GHz · 20MHz · 1SS' },
  [wifiKey('wifi4', '5GHz',   20, 2)]:  { theoreticalMbps: 144, realWorldMbps: 90,  label: 'Wi-Fi 4 · 5GHz · 20MHz · 2SS' },
  [wifiKey('wifi4', '5GHz',   40, 1)]:  { theoreticalMbps: 150, realWorldMbps: 100, label: 'Wi-Fi 4 · 5GHz · 40MHz · 1SS' },
  [wifiKey('wifi4', '5GHz',   40, 2)]:  { theoreticalMbps: 300, realWorldMbps: 150, label: 'Wi-Fi 4 · 5GHz · 40MHz · 2SS' },
  [wifiKey('wifi4', '5GHz',   40, 3)]:  { theoreticalMbps: 450, realWorldMbps: 200, label: 'Wi-Fi 4 · 5GHz · 40MHz · 3SS' },

  // ── Wi-Fi 5 (802.11ac) ───────────────────────────────────────────────────
  // Note: Wi-Fi 5 only operates on 5GHz
  [wifiKey('wifi5', '5GHz',   20, 1)]:  { theoreticalMbps: 87,  realWorldMbps: 65,  label: 'Wi-Fi 5 · 5GHz · 20MHz · 1SS' },
  [wifiKey('wifi5', '5GHz',   40, 1)]:  { theoreticalMbps: 200, realWorldMbps: 150, label: 'Wi-Fi 5 · 5GHz · 40MHz · 1SS' },
  [wifiKey('wifi5', '5GHz',   40, 2)]:  { theoreticalMbps: 400, realWorldMbps: 280, label: 'Wi-Fi 5 · 5GHz · 40MHz · 2SS' },
  [wifiKey('wifi5', '5GHz',   80, 1)]:  { theoreticalMbps: 433, realWorldMbps: 300, label: 'Wi-Fi 5 · 5GHz · 80MHz · 1SS' },
  [wifiKey('wifi5', '5GHz',   80, 2)]:  { theoreticalMbps: 867, realWorldMbps: 500, label: 'Wi-Fi 5 · 5GHz · 80MHz · 2SS' },
  [wifiKey('wifi5', '5GHz',   80, 3)]:  { theoreticalMbps: 1300, realWorldMbps: 700, label: 'Wi-Fi 5 · 5GHz · 80MHz · 3SS' },
  [wifiKey('wifi5', '5GHz',   80, 4)]:  { theoreticalMbps: 1733, realWorldMbps: 900, label: 'Wi-Fi 5 · 5GHz · 80MHz · 4SS' },
  [wifiKey('wifi5', '5GHz',   160, 1)]: { theoreticalMbps: 867, realWorldMbps: 550, label: 'Wi-Fi 5 · 5GHz · 160MHz · 1SS' },
  [wifiKey('wifi5', '5GHz',   160, 2)]: { theoreticalMbps: 1733, realWorldMbps: 900, label: 'Wi-Fi 5 · 5GHz · 160MHz · 2SS' },
  [wifiKey('wifi5', '5GHz',   160, 3)]: { theoreticalMbps: 2600, realWorldMbps: 1200, label: 'Wi-Fi 5 · 5GHz · 160MHz · 3SS' },
  [wifiKey('wifi5', '5GHz',   160, 4)]: { theoreticalMbps: 3466, realWorldMbps: 1500, label: 'Wi-Fi 5 · 5GHz · 160MHz · 4SS' },

  // ── Wi-Fi 6 (802.11ax — 2.4GHz and 5GHz) ─────────────────────────────────
  [wifiKey('wifi6', '2.4GHz', 20, 1)]:  { theoreticalMbps: 143, realWorldMbps: 100, label: 'Wi-Fi 6 · 2.4GHz · 20MHz · 1SS' },
  [wifiKey('wifi6', '2.4GHz', 20, 2)]:  { theoreticalMbps: 287, realWorldMbps: 180, label: 'Wi-Fi 6 · 2.4GHz · 20MHz · 2SS' },
  [wifiKey('wifi6', '2.4GHz', 40, 1)]:  { theoreticalMbps: 287, realWorldMbps: 200, label: 'Wi-Fi 6 · 2.4GHz · 40MHz · 1SS' },
  [wifiKey('wifi6', '2.4GHz', 40, 2)]:  { theoreticalMbps: 574, realWorldMbps: 350, label: 'Wi-Fi 6 · 2.4GHz · 40MHz · 2SS' },
  [wifiKey('wifi6', '5GHz',   20, 1)]:  { theoreticalMbps: 143, realWorldMbps: 100, label: 'Wi-Fi 6 · 5GHz · 20MHz · 1SS' },
  [wifiKey('wifi6', '5GHz',   40, 1)]:  { theoreticalMbps: 287, realWorldMbps: 200, label: 'Wi-Fi 6 · 5GHz · 40MHz · 1SS' },
  [wifiKey('wifi6', '5GHz',   40, 2)]:  { theoreticalMbps: 574, realWorldMbps: 380, label: 'Wi-Fi 6 · 5GHz · 40MHz · 2SS' },
  [wifiKey('wifi6', '5GHz',   80, 1)]:  { theoreticalMbps: 600, realWorldMbps: 430, label: 'Wi-Fi 6 · 5GHz · 80MHz · 1SS' },
  [wifiKey('wifi6', '5GHz',   80, 2)]:  { theoreticalMbps: 1201, realWorldMbps: 750, label: 'Wi-Fi 6 · 5GHz · 80MHz · 2SS' },
  [wifiKey('wifi6', '5GHz',   80, 3)]:  { theoreticalMbps: 1801, realWorldMbps: 1000, label: 'Wi-Fi 6 · 5GHz · 80MHz · 3SS' },
  [wifiKey('wifi6', '5GHz',   80, 4)]:  { theoreticalMbps: 2402, realWorldMbps: 1200, label: 'Wi-Fi 6 · 5GHz · 80MHz · 4SS' },
  [wifiKey('wifi6', '5GHz',   160, 1)]: { theoreticalMbps: 1201, realWorldMbps: 750, label: 'Wi-Fi 6 · 5GHz · 160MHz · 1SS' },
  [wifiKey('wifi6', '5GHz',   160, 2)]: { theoreticalMbps: 2402, realWorldMbps: 1200, label: 'Wi-Fi 6 · 5GHz · 160MHz · 2SS' },
  [wifiKey('wifi6', '5GHz',   160, 4)]: { theoreticalMbps: 4804, realWorldMbps: 2200, label: 'Wi-Fi 6 · 5GHz · 160MHz · 4SS' },

  // ── Wi-Fi 6E (802.11ax — 6GHz) ────────────────────────────────────────────
  [wifiKey('wifi6e', '6GHz',  20, 1)]:  { theoreticalMbps: 143, realWorldMbps: 100, label: 'Wi-Fi 6E · 6GHz · 20MHz · 1SS' },
  [wifiKey('wifi6e', '6GHz',  40, 1)]:  { theoreticalMbps: 287, realWorldMbps: 200, label: 'Wi-Fi 6E · 6GHz · 40MHz · 1SS' },
  [wifiKey('wifi6e', '6GHz',  40, 2)]:  { theoreticalMbps: 574, realWorldMbps: 400, label: 'Wi-Fi 6E · 6GHz · 40MHz · 2SS' },
  [wifiKey('wifi6e', '6GHz',  80, 1)]:  { theoreticalMbps: 600, realWorldMbps: 450, label: 'Wi-Fi 6E · 6GHz · 80MHz · 1SS' },
  [wifiKey('wifi6e', '6GHz',  80, 2)]:  { theoreticalMbps: 1201, realWorldMbps: 800, label: 'Wi-Fi 6E · 6GHz · 80MHz · 2SS' },
  [wifiKey('wifi6e', '6GHz',  80, 4)]:  { theoreticalMbps: 2402, realWorldMbps: 1500, label: 'Wi-Fi 6E · 6GHz · 80MHz · 4SS' },
  [wifiKey('wifi6e', '6GHz',  160, 1)]: { theoreticalMbps: 1201, realWorldMbps: 800, label: 'Wi-Fi 6E · 6GHz · 160MHz · 1SS' },
  [wifiKey('wifi6e', '6GHz',  160, 2)]: { theoreticalMbps: 2402, realWorldMbps: 1500, label: 'Wi-Fi 6E · 6GHz · 160MHz · 2SS' },
  [wifiKey('wifi6e', '6GHz',  160, 4)]: { theoreticalMbps: 4804, realWorldMbps: 2800, label: 'Wi-Fi 6E · 6GHz · 160MHz · 4SS' },
}

/**
 * Looks up real-world Wi-Fi throughput. Falls back to a nearest-match estimate
 * if the exact combination isn't in the table.
 */
export function getWifiThroughput(
  protocol: WifiProtocol,
  band: WifiBand,
  channelWidth: ChannelWidth,
  streams: WifiStreams,
): WifiThroughput {
  const key = wifiKey(protocol, band, channelWidth, streams)
  const exact = WIFI_TABLE[key]
  if (exact) return exact

  // Fallback: find closest entry (same protocol + band, nearest channel width, streams=1)
  const fallbackKey = wifiKey(protocol, band, channelWidth, 1)
  const fallback = WIFI_TABLE[fallbackKey]
  if (fallback) {
    return {
      theoreticalMbps: fallback.theoreticalMbps * streams,
      realWorldMbps: Math.round(fallback.realWorldMbps * streams * 0.85), // multi-stream overhead
      label: `${fallback.label} (est. ${streams}SS)`,
    }
  }

  // Last-resort estimate
  return {
    theoreticalMbps: 72 * streams,
    realWorldMbps: 30 * streams,
    label: `${protocol} · ${band} · ${channelWidth}MHz · ${streams}SS (est.)`,
  }
}

// ─── Distance degradation ─────────────────────────────────────────────────────

export const DISTANCE_MULTIPLIER: Record<DistanceCategory, number> = {
  close:  1.0,
  medium: 0.7,
  far:    0.4,
}

// ─── Router software routing cap ─────────────────────────────────────────────

/**
 * Real-world software routing throughput cap by tier.
 * Budget routers (e.g. TP-Link Archer C7) cap at ~350–400 Mbps due to CPU limits.
 * Mid-range (e.g. ASUS RT-AX58U) typically manage 900–940 Mbps.
 * High-end (e.g. Ubiquiti UniFi, ASUS GT-AX11000) are effectively line-rate.
 */
export const ROUTER_ROUTING_CAP: Record<RouterTier, number> = {
  budget:   350,   // Mbps — CPU-limited on budget hardware
  midRange: 940,   // Mbps — close to Gigabit line rate
  highEnd:  9500,  // Mbps — effectively line-rate for most home setups
}

// ─── Wired throughput ─────────────────────────────────────────────────────────

/**
 * Actual throughput for wired Ethernet at each port speed, accounting for
 * TCP/IP overhead (~95% efficiency for Gigabit and above).
 */
export const WIRED_EFFICIENCY = 0.95

/**
 * Returns effective wired throughput given the two port speeds (min of both ends).
 */
export function getWiredThroughput(portSpeedA: number, portSpeedB: number): number {
  return Math.min(portSpeedA, portSpeedB) * WIRED_EFFICIENCY
}
