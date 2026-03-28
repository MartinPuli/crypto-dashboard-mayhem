# Architecture Documentation

## System Overview

CryptoVault is a monolithic single-file web application. All HTML, CSS, and JavaScript coexist in `index.html`. This document describes the internal architecture, data flow, and design decisions.

---

## File Structure

```
index.html
  |
  +-- <style> block (~130 lines)
  |     CSS variables, grid system, card styles, chart styles,
  |     table styles, alert styles, gauge styles, heatmap styles,
  |     modal styles, animations, responsive breakpoints
  |
  +-- <body> HTML (~60 lines)
  |     Navbar, KPI grid, price chart + donut, transactions + alerts,
  |     gauge + heatmap, trading modal overlay
  |
  +-- <script> block (~450 lines)
        Data declarations, AnimEngine, SparklineModule,
        renderKPIs, drawPriceChart, drawDonut, renderTransactions,
        renderAlerts, GaugeModule, HeatmapModule, TradeModal,
        coin tabs, tick loop, init block
```

---

## Module Dependency Graph

```
                    tick() [2s interval]
                       |
         +-------------+----------------+------------------+
         |             |                |                  |
    renderKPIs()  drawPriceChart()  GaugeModule.tick()  HeatmapModule.tick()
         |                              |                  |
    AnimEngine        COINS[]     GaugeModule._loop()  HeatmapModule.draw()
         |                         [60fps rAF]
    SparklineModule
         |
    sparkData[]

              TradeModal (user-triggered)
                  |
              COINS[] prices
              transactions[]
              alerts[]
```

---

## Data Structures

### COINS (Global)
```javascript
// Single source of truth for all coin data
const COINS = [
  { sym: string, name: string, price: number, color: string, alloc: number }
]
```
- `price` is mutated in-place every tick
- `alloc` represents portfolio allocation percentage (sums to 100)
- `color` is the brand hex color used in charts, heatmap, and legend

### priceHistory (Global)
```javascript
// Parallel array indexed by coin position
const priceHistory = [ [number, ...], ... ]  // max 80 points per coin
```
- New points pushed every tick, oldest shifted when > 80
- Used by `drawPriceChart()` for the main chart

### sparkData (Global)
```javascript
// Parallel array for sparkline mini-charts
const sparkData = [ [number, ...], ... ]  // max 24 points per coin
```
- Fed by `SparklineModule.push()` each tick
- Used by `SparklineModule.draw()` for KPI card sparklines

### transactions (Global)
```javascript
const transactions = [
  { type: 'buy'|'sell'|'swap', sym: string, amount: string,
    price: string, pl: string, time: string }
]  // max 15 entries
```

### alerts (Global)
```javascript
const alerts = [
  { level: 'high'|'medium'|'low', msg: string, time: string }
]  // max 8 entries
```

---

## Module Specifications

### AnimEngine
**Purpose:** Reusable animation utilities for the entire dashboard.

| Method | Parameters | Description |
|--------|-----------|-------------|
| `animateNumber` | `(el, from, to, dur, fmt)` | Animates textContent from `from` to `to` over `dur` ms using easeOutCubic. `fmt` is a formatter function `(number) => string`. |
| `flashColor` | `(el, dir)` | Adds `num-flash-up` (dir > 0) or `num-flash-down` (dir < 0) class for 600ms. |
| `staggerEntrance` | `(container)` | Applies `card-entrance` animation to all `.card` children with 90ms stagger. |
| `applyGlowToCards` | `()` | Adds `card-glow` class to all `.card` elements globally. |

### SparklineModule
**Purpose:** Mini trend charts inside KPI cards.

| Method | Parameters | Description |
|--------|-----------|-------------|
| `push` | `(i, price)` | Appends price to `sparkData[i]`, shifts if > 24 points. |
| `draw` | `(idx)` | Renders sparkline on `canvas#spark-{idx}`. Green if trending up, red if down. Gradient fill + line + end dot. |
| `drawAll` | `()` | Calls `draw()` for indices 0-3. |

**Canvas pattern:** 2x HiDPI, gradient fill under polyline, 1.5px stroke with 4px shadow blur, 2px end dot.

### GaugeModule
**Purpose:** Fear & Greed sentiment gauge with smooth needle animation.

**State:**
- `value` (0-100) - current displayed value
- `target` (0-100) - target value (drifts each tick)
- `velocity` - momentum accumulator
- `needleAngle` - current needle radian (interpolated toward target)
- `needleTarget` - target needle radian

**Rendering:**
1. 5 background arc segments (25% opacity) for the full range
2. Active gradient arc from start to current value
3. White triangular needle rotated from center point
4. Center dot with color-matched glow
5. Scale labels (0, 50, 100)
6. Text display: large number + sentiment word

**Animation:** `_loop()` runs via `requestAnimationFrame` at 60fps. Interpolates `needleAngle` toward `needleTarget` with 6% per-frame convergence. Independent from `tick()`.

### HeatmapModule
**Purpose:** Market treemap showing relative size and performance.

**State:**
- `changes[]` - 24h percentage change per coin (-15 to +15)
- `rects[]` - cached layout rectangles from last `layout()` call
- `mcaps[]` - market cap values in billions

**Layout Algorithm:**
```
Row 1 (60% height): BTC width proportional, ETH takes remainder
Row 2 (40% height): SOL, AVAX, LINK split proportionally
```

**Color Mapping:** `interpolateColor(pct)` maps -15..+15 to RGB via linear interpolation:
- -15% -> rgb(217, 0, 40) deep red
- 0% -> rgb(109, 83, 50) neutral
- +15% -> rgb(0, 166, 60) deep green

**Tooltip:** Positioned absolutely on mousemove. Hit-tests against `rects[]` array. Shows coin symbol, name, price, 24h change, market cap.

### TradeModal
**Purpose:** Interactive buy/sell trading interface.

**State:**
- `_open` (boolean) - tracked as property, not DOM read (avoids layout thrash in tick)
- `mode` ('buy' | 'sell')
- `assetIdx` (number) - selected coin index

**Flow:**
1. `open()` -> show overlay, populate asset dropdown, reset fields
2. User selects asset + enters amount
3. `update()` -> calculates total from `COINS[assetIdx].price * amount`
4. `syncPrice()` -> called from `tick()` when modal is open, keeps price current
5. `submit()` -> validates amount > 0, injects transaction + alert, shows success
6. Auto-close after 2.2s or user dismisses

---

## Rendering Pipeline

### Per-Tick (every 2 seconds)
1. Update `COINS[i].price` with random walk delta
2. Push to `priceHistory[i]` (cap at 80)
3. Push to `sparkData[i]` via `SparklineModule.push()` (cap at 24)
4. `renderKPIs()`:
   - First call: create DOM nodes with stable IDs + sparkline canvases
   - Subsequent: update text in-place, animate numbers, flash colors
   - Call `SparklineModule.drawAll()`
5. `drawPriceChart()`: full canvas redraw of selected coin
6. `GaugeModule.tick()`: drift target, update velocity
7. `HeatmapModule.tick()`: drift 24h change values
8. `HeatmapModule.draw()`: full canvas redraw of treemap
9. `TradeModal.syncPrice()`: update modal if open
10. Random events: new transaction (30% chance), new alert (8% chance)

### Gauge Loop (60fps, independent)
1. Interpolate `needleAngle` toward `needleTarget` (6% per frame)
2. Interpolate `value` toward `target` (6% per frame)
3. Full canvas redraw: arcs, needle, text
4. Schedule next frame via `requestAnimationFrame`

### On Resize
1. `drawPriceChart()` - recalculates canvas dimensions
2. `drawDonut()` - fixed size but redraws
3. `HeatmapModule.draw()` - relayouts treemap
4. `GaugeModule.draw()` - recalculates gauge
5. `SparklineModule.drawAll()` - redraws all sparklines

---

## CSS Architecture

### Naming Convention
- Component containers: `.navbar`, `.card`, `.alert`, `.modal-*`, `.gauge-*`, `.heatmap-*`
- State modifiers: `.active`, `.open`, `.show`, `.positive`, `.negative`
- Type variants: `.tx-buy`, `.tx-sell`, `.tx-swap`, `.alert-high`, `.alert-medium`, `.alert-low`
- Animation classes: `.card-entrance`, `.card-glow`, `.num-flash-up`, `.num-flash-down`, `.input-error`

### Grid System
Four named grid configurations:
- `.grid-top` (4 cols) -> KPI cards
- `.grid-main` (2:1 ratio) -> Price chart + donut
- `.grid-bottom` (1.5:1 ratio) -> Transactions + alerts
- `.grid-extra` (1:2 ratio) -> Gauge + heatmap

All collapse to single-column at 900px breakpoint.

### Visual Effects
- Background: triple radial gradient overlay on `body::before` (green, cyan, magenta)
- Cards: top-border gradient reveal on hover via `::before` pseudo-element
- Buttons: `filter: brightness()` + `transform` + `box-shadow` on hover
- Inputs: green border + glow `box-shadow` on focus
- Alerts: gradient overlay via `::before` with `currentColor`

---

## Security Considerations

- No user-generated content injected via `innerHTML` without sanitization
- Trading modal inputs feed only into numeric calculations
- Coin names in success messages come from trusted `COINS[]` static array
- All `onclick` handlers use direct module method calls, never `eval()` or string concatenation
- No external network requests, no cookies, no localStorage
