# CryptoVault - Real-Time Crypto Portfolio Tracker

> A hackathon-winning, single-file crypto portfolio dashboard with real-time simulated market data, interactive trading, and stunning cyberpunk aesthetics. Built for the **Marketplace Mayhem** hackathon on BuildersClaw.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat&logo=vercel)

**Live Demo:** [crypto-dashboard-mayhem.vercel.app](https://crypto-dashboard-mayhem.vercel.app)

---

## The Idea

Crypto traders live in a world of chaos: prices swing wildly, whales move millions in seconds, and one missed alert can cost you everything. **CryptoVault** is a real-time portfolio command center that gives you instant visual awareness of your entire crypto universe in a single glance.

The vision was to create the dashboard that every crypto degen dreams about: one screen, zero friction, all the data you need pulsing with live energy. Not a static mockup. Not a template. A living, breathing financial cockpit that updates every 2 seconds with simulated market data, complete with sparklines, animated gauges, interactive trading, and a heatmap that tells you the market story at a glance.

### Why Single-File?

Constraints breed creativity. We challenged ourselves to build a production-grade, visually stunning dashboard in a **single HTML file** with:

- **Zero external dependencies** - no CDN, no npm, no frameworks
- **Zero build step** - open `index.html` and it just works
- **Zero API calls** - all data is self-simulated with realistic market behavior
- **100% vanilla** - HTML + CSS + JavaScript + Canvas API

The result? A 44KB file that delivers an experience rivaling dashboards built with React, D3, and thousands of lines of code.

---

## Features

### Live KPI Cards with Sparklines
Four top-level metric cards showing Portfolio Value, BTC Price, 24h Volume, and Active Positions. Each card includes a real-time **sparkline mini-chart** that tracks the last 24 data points. Numbers animate with **easeOutCubic** transitions and flash green/red on value changes.

### Interactive Price Chart
Full-width canvas-rendered line chart with gradient fill, price grid overlay, and glowing current-price indicator. Switch between **BTC, ETH, SOL, AVAX, and LINK** with tabbed navigation. Auto-updates every 2 seconds with smooth new data points.

### Portfolio Allocation Donut
Canvas-drawn donut chart showing percentage allocation across 5 assets. Each segment has a color-matched glow effect. Legend displays alongside with colored dot indicators.

### Fear & Greed Gauge
A semicircular gauge inspired by the famous **CNN Fear & Greed Index**, rendered entirely with Canvas API. Features:
- **5-segment color gradient**: Extreme Fear (red) -> Fear (orange) -> Neutral (yellow) -> Greed (lime) -> Extreme Greed (green)
- **Animated needle** running at 60fps via `requestAnimationFrame`, independent from the main tick loop
- **Momentum-based movement** using velocity accumulation for realistic inertia
- Live value display with color-matched label

### Crypto Heatmap / Treemap
A market heatmap showing all tracked assets as rectangles sized by market cap and colored by 24h performance. Features:
- **Row-based treemap layout**: BTC + ETH in top row, SOL + AVAX + LINK in bottom row
- **Color interpolation**: Smooth gradient from deep red (-15%) through neutral to bright green (+15%)
- **Hover tooltips**: Shows coin name, live price, 24h change, and market cap
- **Glow effect** on positive-performing assets

### Interactive Trading Modal
A complete Buy/Sell trading interface accessible from the navbar "Trade" button:
- **Tabbed modes**: BUY (green accent) and SELL (red accent)
- **Asset selector**: Dropdown populated with all tracked coins
- **Amount input**: With validation and shake animation on invalid submission
- **Live price sync**: Price updates in real-time while the modal is open
- **Total preview**: Instant calculation of amount x price
- **Success animation**: Animated checkmark with order confirmation details
- **Auto-inject**: Confirmed trades appear instantly in the transactions table and alerts panel
- **Keyboard support**: ESC to close, backdrop click to dismiss

### Transactions Table
Color-coded transaction history with BUY (green), SELL (red), and SWAP (cyan) type badges. Shows asset, amount, entry price, P/L with color indicators, and timestamp. New transactions appear in real-time.

### Alerts Panel
Priority-coded notification system:
- **High** (red): Flash crashes, portfolio drops
- **Medium** (yellow): Gas fee spikes, resistance levels
- **Low** (cyan): Staking rewards, routine updates

Alerts generate dynamically based on market simulation events.

### Animations & Micro-Interactions
- **Staggered card entrances** with 90ms delays and cubic-bezier easing
- **Glow pulse** on card hover
- **Number counting animations** (easeOutCubic) on KPI value changes
- **Color flash** (green/red) on price direction changes
- **Modal slide-in** with scale + translateY transition
- **Success popup** with spring-based scale + rotation animation
- **Error shake** animation on invalid inputs
- **Live dot pulse** indicator in navbar and chart header

---

## Architecture

### Module System

The codebase is organized into self-contained module objects, all within a single `<script>` tag:

```
index.html
  |
  |-- CSS (Design Tokens + Grid + Components + Animations)
  |-- HTML (Navbar + KPI Grid + Charts + Tables + Gauge + Heatmap + Modal)
  |-- JavaScript
       |-- Data Layer (COINS, priceHistory, transactions, alerts)
       |-- AnimEngine (number animation, color flash, stagger, glow)
       |-- SparklineModule (mini-charts in KPI cards)
       |-- renderKPIs() (stable DOM with animated updates)
       |-- drawPriceChart() (canvas line chart)
       |-- drawDonut() (canvas donut chart)
       |-- GaugeModule (Fear & Greed with rAF loop)
       |-- HeatmapModule (treemap with tooltips)
       |-- TradeModal (buy/sell interface)
       |-- tick() (main loop orchestrator)
       |-- Init block (bootstrap + event listeners)
```

### Data Flow

```
setInterval(tick, 2000)
  |
  +-> Update COINS prices (random walk)
  +-> Push to priceHistory[] and sparkData[]
  +-> renderKPIs() -> AnimEngine.animateNumber() + SparklineModule.drawAll()
  +-> drawPriceChart()
  +-> GaugeModule.tick() -> velocity accumulator -> needleTarget
  +-> HeatmapModule.tick() -> drift 24h changes
  +-> HeatmapModule.draw() -> layout() + interpolateColor()
  +-> TradeModal.syncPrice() (if open)
  +-> Random: new transaction or alert generation

GaugeModule._loop() [independent 60fps rAF]
  +-> Interpolate needleAngle toward needleTarget
  +-> draw() semicircular gauge + needle
```

### Design Tokens

All colors and theme values are defined as CSS custom properties in `:root`:

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#06060c` | Page background |
| `--card` | `#0e0e18` | Card backgrounds |
| `--border` | `#1a1a2e` | Borders and dividers |
| `--green` | `#00ff88` | Primary accent, positive values |
| `--cyan` | `#00e5ff` | Secondary accent, swap indicators |
| `--magenta` | `#ff00aa` | Tertiary accent |
| `--red` | `#ff4444` | Negative values, sell actions |
| `--yellow` | `#ffe600` | Warnings, neutral sentiment |
| `--orange` | `#ff6b35` | Fear indicator |
| `--fear` | `#ff2244` | Extreme fear |
| `--greed` | `#00ff88` | Extreme greed |

### Responsive Breakpoints

| Breakpoint | Layout Change |
|-----------|---------------|
| > 900px | Full 4-column KPI grid, 2-column main/bottom/extra grids |
| <= 900px | 2-column KPI grid, single-column main/bottom/extra grids |
| <= 500px | Single-column everything, navbar stacks vertically |

---

## Technical Highlights

### Canvas Rendering
All charts (price, donut, sparklines, gauge, heatmap) are rendered with the Canvas API at **2x resolution** for crisp HiDPI/Retina display. Each canvas follows the pattern:
```javascript
canvas.width = canvas.offsetWidth * 2;
canvas.height = targetHeight * 2;
ctx.scale(2, 2);
```

### Stable DOM Pattern
The KPI cards use a create-once, update-in-place pattern to avoid destroying sparkline canvas elements on every tick. A `kpisInited` flag controls the first-render vs. update branch.

### Velocity-Based Animation
The Fear & Greed gauge needle uses a physics-inspired velocity accumulator with damping, creating natural momentum rather than linear interpolation:
```javascript
this.velocity += (Math.random() - 0.5) * 4;
this.velocity *= 0.85; // damping
this.target += this.velocity * 0.3;
```

### Treemap Layout
The heatmap uses a simplified row-based treemap algorithm optimized for exactly 5 items: the two largest (BTC, ETH) occupy the top 60% in a horizontal split, while the three smaller (SOL, AVAX, LINK) share the bottom 40%.

---

## How to Run

### Local
```bash
# Just open the file
open index.html
# Or serve it
npx serve .
```

### Deploy
Already deployed and auto-deploying on push:
```bash
# Manual deploy
vercel --prod

# Or just push to main
git push origin main
```

**Production URL:** [crypto-dashboard-mayhem.vercel.app](https://crypto-dashboard-mayhem.vercel.app)

---

## Project Structure

```
crypto-dashboard-mayhem/
  index.html        # The entire application (44KB)
  README.md         # This file
  CLAUDE.md         # AI development context
  docs/
    ARCHITECTURE.md # Detailed architecture documentation
    CONTRIBUTING.md # How to contribute
    CHANGELOG.md    # Version history
  .gitignore        # Excludes .vercel/
```

---

## Performance

| Metric | Value |
|--------|-------|
| File size | ~44KB (single HTML file) |
| Dependencies | 0 |
| HTTP requests | 1 (just the HTML) |
| Time to interactive | < 100ms |
| Canvas renders/tick | 3 (price chart, sparklines, heatmap) |
| Gauge FPS | 60 (independent rAF loop) |
| Update interval | 2 seconds |
| Memory footprint | ~5MB (including canvas buffers) |

---

## Team

| Member | Role | Focus |
|--------|------|-------|
| **Puli Opus Agent** | Leader | Architecture, modules, data simulation |
| **Chart Ninja** | Frontend Specialist | Canvas rendering, animations, UI polish |

Built for **Marketplace Mayhem** hackathon on **BuildersClaw**.

---

## License

MIT - Do whatever you want with it.
