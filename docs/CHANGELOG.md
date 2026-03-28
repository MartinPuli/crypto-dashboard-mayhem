# Changelog

All notable changes to CryptoVault are documented in this file.

---

## [2.0.0] - 2026-03-28

### Added
- **Sparkline mini-charts** in all 4 KPI cards with real-time updates
- **Fear & Greed Gauge** - semicircular gauge with 60fps animated needle, velocity-based momentum, 5-segment color gradient
- **Trading Modal** - full Buy/Sell interface with asset selector, amount input, live price sync, total calculation, validation with shake animation, success confirmation popup
- **Market Heatmap** - treemap visualization with rectangles sized by market cap, colored by 24h performance (-15% to +15%), hover tooltips
- **AnimEngine module** - reusable animation utilities (number counting, color flash, stagger entrance, glow effects)
- **SparklineModule** - dedicated module for mini sparkline chart rendering
- **Staggered entrance animations** for all card sections on page load
- **Glow pulse animation** on card hover
- **Number transition animations** with easeOutCubic easing on KPI value changes
- **Color flash effects** (green/red) on price direction changes
- **Modal backdrop blur** with glassmorphism effect
- **Success popup animation** with spring-based scale + rotation
- **Input error shake** animation on invalid trade submission
- **Keyboard support** - ESC key closes trading modal
- **Backdrop click** closes trading modal
- **Background atmosphere** - triple radial gradient overlay on body
- **Card top-border glow** on hover via CSS pseudo-element
- **Stable DOM pattern** for KPI cards (create once, update in-place)

### Changed
- Upgraded background color from `#0a0a0f` to deeper `#06060c`
- Refined card styling: increased border-radius to 14px, added `overflow: hidden`
- Enhanced card hover: cubic-bezier easing, 3px lift, stronger shadow
- Improved button styling: gradient background, letter-spacing, shadow on hover
- Refined alert styling: reduced opacity for subtler appearance, added gradient overlay
- Enhanced chart tab styling: added box-shadow on active state
- Improved donut legend with glow on colored dots
- Restructured JavaScript into modular architecture (AnimEngine, SparklineModule, GaugeModule, HeatmapModule, TradeModal)
- Refactored `renderKPIs()` from innerHTML replacement to stable DOM updates
- Extended `tick()` function to orchestrate all new modules
- Extended resize handler for all new canvas elements

### Technical
- All new canvases follow 2x HiDPI rendering pattern
- GaugeModule uses independent `requestAnimationFrame` loop (60fps)
- TradeModal tracks open state as boolean property (not DOM read) to avoid layout thrash
- Heatmap tooltip uses hit-testing against cached rect array

---

## [1.0.0] - 2026-03-22

### Added
- Initial CryptoVault dashboard
- Live price chart with Canvas API (line chart + gradient fill)
- Portfolio donut chart with colored segments and glow
- 4 KPI metric cards (Portfolio Value, BTC Price, 24h Volume, Active Positions)
- Transaction history table with color-coded types (BUY/SELL/SWAP)
- Alerts panel with priority levels (high/medium/low)
- Dark theme with neon accents (green, cyan, magenta, orange)
- CSS Grid responsive layout with 900px and 500px breakpoints
- Live navbar with balance display, notification badge, live indicator
- 2-second auto-update interval with simulated market data
- Random transaction and alert generation
- Coin tab switching for price chart (BTC, ETH, SOL, AVAX, LINK)
- Window resize handler for canvas redraw
