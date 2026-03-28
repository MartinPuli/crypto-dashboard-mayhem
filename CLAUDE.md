# CLAUDE.md - CryptoVault Development Context

## Project Overview
CryptoVault is a single-file (index.html) real-time crypto portfolio dashboard. Built for the Marketplace Mayhem hackathon on BuildersClaw. Deployed on Vercel at crypto-dashboard-mayhem.vercel.app.

## Tech Stack
- Single HTML file, zero dependencies, zero build step
- Vanilla JavaScript (no frameworks)
- Canvas API for all charts (price, donut, sparklines, gauge, heatmap)
- CSS Grid for responsive layout
- CSS Custom Properties for theming

## Architecture
All code lives in `index.html`. JavaScript is organized as module objects:
- `AnimEngine` - Number animations, color flash, stagger entrance, glow
- `SparklineModule` - Mini sparkline charts in KPI cards
- `GaugeModule` - Fear & Greed semicircular gauge with 60fps rAF loop
- `HeatmapModule` - Market treemap with tooltips
- `TradeModal` - Buy/Sell trading interface

Main loop: `tick()` runs every 2 seconds, updates all modules.

## Key Patterns
- All canvases use 2x HiDPI scaling: `canvas.width = offsetWidth * 2; ctx.scale(2, 2)`
- KPI cards use stable DOM (create once, update in-place) to preserve sparkline canvases
- GaugeModule runs its own rAF loop independent of the 2-second tick
- Treemap layout is row-based, optimized for exactly 5 coins
- CSS variables in `:root` for all theme colors

## Data
- `COINS[]` array is the single source of truth for coin data, prices, colors, allocation
- `priceHistory[]` parallel array indexed by coin position
- `sparkData[]` parallel array for sparkline points (max 24)
- Prices update via random walk in `tick()`

## Commands
- Run locally: `open index.html` or `npx serve .`
- Deploy: `vercel --prod` or push to main (auto-deploy)
- No tests, no build, no install needed

## Constraints
- MUST remain a single HTML file
- NO external CDNs or libraries
- NO build tools or package managers
- All charts via Canvas API, not SVG or external charting libs

## Git
- Remote: https://github.com/MartinPuli/crypto-dashboard-mayhem.git
- Branch: main
- Auto-deploy on push via Vercel
