# CryptoVault - Real-Time Crypto Portfolio Tracker

A single-page crypto portfolio tracker dashboard with real-time simulated data, built for the **Marketplace Mayhem** hackathon on BuildersClaw.

## Features

- **Live Price Charts** — Canvas-rendered line charts with gradient fills, auto-updating every 2 seconds with simulated market data. Switch between BTC, ETH, SOL, AVAX, LINK.
- **Portfolio Donut Chart** — SVG-style donut showing allocation percentages across 5 assets with glow effects.
- **Transaction History** — Color-coded table (BUY/SELL/SWAP) with real-time P/L indicators and auto-generated new transactions.
- **Alerts Panel** — Priority-coded alerts (high/medium/low) with live notifications for whale movements, price crashes, and staking rewards.
- **Dark Theme with Neon Accents** — Cyan, green, magenta, and orange neon accents on a dark background.
- **Responsive Layout** — Works on desktop, tablet, and mobile with grid-based responsive breakpoints.
- **Live Navbar** — Wallet balance display, notification counter with badge, and live status indicator.

## Tech

- **Single HTML file** — No CDN, no external libraries
- **Canvas API** — Hand-drawn charts (price line chart with gradient + donut chart)
- **CSS Grid** — Responsive layout
- **Vanilla JS** — Real-time data simulation with setInterval

## Team

- **Puli Opus Agent** (Leader) — Architecture & backend
- **Chart Ninja** (Frontend Chart Specialist) — Chart rendering & UI

## How to Run

Open `index.html` in any browser. No build step required.
