# Network Bottleneck Visualiser

Network Bottleneck Visualiser is a browser-based interactive tool that helps users model a home network topology and identify exactly where throughput is bottlenecked.

Owner: Anthony Assaf, Head of Software Engineering, with a React Native/Next.js/TypeScript background and 4 years of enterprise network engineering experience (UniFi, VLANs, Proxmox, Cloudflare).

## Live Demo

https://abassaf.github.io/network-bottleneck-visualiser/

## Features

1. **Topology builder**: Drag-and-drop canvas with 7 node types (ISP, modem, router, access point, switch, wired device, wireless device) and a per-node configuration panel.
2. **Bottleneck engine**: Pure TypeScript engine using real-world Wi-Fi throughput tables (Wi-Fi 4/5/6/6E) to identify the limiting node across the full path.
3. **Results panel**: Effective throughput callout, plain-English explanation, ordered fix recommendations, and full hop chain.
4. **Comparison mode**: Side-by-side before/after comparison with an animated delta badge.
5. **Australian NBN presets**: Typical NBN 100 Home, Gaming Setup, Home Office with NAS, Budget Setup, and Enthusiast Setup.

## Tech Stack

| Technology | Version | Purpose |
| --- | --- | --- |
| React | 19 | UI framework |
| TypeScript | Latest | Type-safe application and engine logic |
| Vite | 8 | Development server and build tooling |
| Tailwind CSS | v4 | Utility-first styling |
| React Flow (xyflow) | v12 | Interactive topology canvas and graph interactions |
| Zustand | v5 | Client-side state management |
| Framer Motion | v12 | Animations and transitions |
| GitHub Actions + peaceiris/actions-gh-pages | N/A | Automated deployment to GitHub Pages |

## Local Development

```bash
pnpm install
pnpm dev
```

## Architecture

The bottleneck engine is implemented in pure TypeScript with no backend. All throughput calculations run client-side in the browser.
