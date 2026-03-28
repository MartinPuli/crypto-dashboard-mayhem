# Contributing to CryptoVault

## The Golden Rule

**Everything stays in `index.html`.** This is a single-file project by design. No splitting into multiple files, no adding dependencies, no build tools.

---

## Getting Started

```bash
git clone https://github.com/MartinPuli/crypto-dashboard-mayhem.git
cd crypto-dashboard-mayhem
open index.html
```

That's it. No `npm install`, no build step.

---

## Code Organization

The HTML file follows this structure:

```
1. <style> block - CSS variables, then components top-to-bottom
2. <body> HTML - Semantic sections matching visual layout
3. <script> block - Data, then modules, then render functions, then tick, then init
```

### Adding a New Module

1. Define it as a `const` object literal after the existing modules
2. Add an `init()` method if it needs setup
3. Add a `tick()` method if it needs per-cycle updates
4. Add a `draw()` method if it renders to canvas
5. Hook into `tick()` function
6. Hook into init block
7. If canvas-based, add to resize handler

### Adding New CSS

1. Add new variables to `:root` if introducing new colors/sizes
2. Group styles by component (comment header recommended)
3. Add responsive rules to existing `@media` blocks
4. Use existing CSS variables, don't hardcode colors

### Adding New Animations

1. Define `@keyframes` after existing keyframe declarations
2. Create a utility class that applies the animation
3. Apply via JavaScript using `classList.add()`

---

## Canvas Guidelines

All canvases MUST follow the HiDPI pattern:

```javascript
canvas.width = canvas.offsetWidth * 2;
canvas.height = targetHeight * 2;
ctx.scale(2, 2);
// Now draw using logical pixels (offsetWidth, targetHeight)
```

Always guard canvas functions:
```javascript
const canvas = document.getElementById('myCanvas');
if (!canvas) return;
const w = canvas.offsetWidth;
if (w === 0) return;
```

---

## Data Guidelines

- `COINS[]` is the single source of truth. Don't create parallel coin arrays.
- Use the same index alignment: `COINS[i]`, `priceHistory[i]`, `sparkData[i]`
- Prices are mutated in-place on `COINS[i].price` - don't create copies
- Arrays have max lengths: `priceHistory` (80), `sparkData` (24), `transactions` (15), `alerts` (8)

---

## Style Guide

- Use `var(--name)` for all colors, never hardcode hex in JS unless it's a one-off canvas gradient
- Prefer `const` for module objects, `let` for mutable state
- Template literals for HTML generation
- No semicolons in CSS (minified style)
- Keep functions short and focused
- Comment sections with `// ===== SECTION NAME =====` style headers

---

## Testing

Manual testing only (single-file project):

1. Open in Chrome/Firefox/Safari
2. Verify all sections render without console errors
3. Let it run for 30+ seconds to confirm tick loop stability
4. Test trading modal: open, select coin, enter amount, submit
5. Test with invalid input (0 or empty amount)
6. Resize browser window - verify all canvases redraw
7. Test on mobile viewport (Chrome DevTools device mode)
8. Verify ESC key and backdrop click close the modal

---

## Pull Request Checklist

- [ ] All code is in `index.html`
- [ ] No external dependencies added
- [ ] No console errors on load
- [ ] Canvas renders are HiDPI (2x scaled)
- [ ] New colors use CSS variables
- [ ] Responsive at 900px and 500px breakpoints
- [ ] Trading modal still works
- [ ] Tick loop runs without accumulating errors
- [ ] Tested in at least Chrome and Firefox
