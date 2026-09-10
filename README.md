# GitHub Contribution Graph Generator

A fast, reliable alternative to broken third-party GitHub contribution graph widgets. Generates dynamic SVG graphs for your GitHub profile README, portfolio, or documentation with support for custom visualization types, color themes, streak statistics, and dual-engine data fetching.

---

## Visualization Types

| Type | URL Parameter | Description |
| :--- | :--- | :--- |
| **Contribution Calendar** | `type=calendar` (default) | Classic GitHub 52-week heatmap squares |
| **Activity Curve** | `type=graph` (or `type=activity`) | Smooth glowing bezier wave line & gradient area fill showing commit peaks |
| **Streak Stats Card** | `type=streak` | Flame streak badge showing Current Streak, Longest Streak, and Daily Average |
| **Monthly Bar Chart** | `type=bar` | Monthly volume distribution bar chart with count labels |
| **Weekday Habit** | `type=weekday` | Sunday through Saturday productivity breakdown |

---

## Quick Start

### 1. Classic Contribution Calendar

```markdown
[![GitHub Contributions](http://localhost:3000/api/graph?username=torvalds&type=calendar&theme=github-dark)](https://github.com/torvalds)
```

### 2. Activity Curve / Wave Graph

```markdown
[![GitHub Activity](http://localhost:3000/api/graph?username=torvalds&type=graph&theme=ocean)](https://github.com/torvalds)
```

### 3. Streak Stats Card

```markdown
[![GitHub Streaks](http://localhost:3000/api/graph?username=torvalds&type=streak&theme=fire)](https://github.com/torvalds)
```

### 4. Monthly Breakdown

```markdown
[![Monthly Breakdown](http://localhost:3000/api/graph?username=torvalds&type=bar&theme=dracula)](https://github.com/torvalds)
```

### 5. Weekday Habits

```markdown
[![Weekday Activity](http://localhost:3000/api/graph?username=torvalds&type=weekday&theme=cyberpunk)](https://github.com/torvalds)
```

*(When deployed to Vercel or a custom domain, replace `http://localhost:3000` with your deployed URL).*

---

## Time Ranges

You can restrict the time window on `calendar`, `graph`, `bar`, and `weekday` charts using the `range` parameter:

| Value | Range | Example |
| :--- | :--- | :--- |
| `1y` (default) | Full year (53 weeks) | `?username=torvalds&range=1y` |
| `6m` | Last 6 months (26 weeks) | `?username=torvalds&range=6m` |
| `3m` | Last 3 months (13 weeks) | `?username=torvalds&range=3m` |
| `30d` | Last 30 days (5 weeks) | `?username=torvalds&range=30d` |

---

## Pre-Built Themes

| Theme ID | Description |
| :--- | :--- |
| `github-dark` (default) | Official GitHub dark mode greens |
| `github` | Official GitHub light mode greens |
| `dracula` | Dracula theme (purples and pinks) |
| `ocean` | Deep blues and cyan |
| `fire` | Flame sunset (oranges, reds, and yellows) |
| `cyberpunk` | Neon magenta and bright cyan |
| `nord` | Frosty Arctic blue palette |
| `monokai` | Monokai code palette |
| `halloween` | Spooky orange and yellow |
| `slate` | Minimalist monochrome grayscale |
| `custom` | Custom 5-step intensity ramp |

---

## Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `username` / `user` | `string` | **Required** | Target GitHub username |
| `type` | `string` | `calendar` | Chart type: `calendar`, `graph`, `streak`, `bar`, `weekday` |
| `range` | `string` | `1y` | Time window: `1y`, `6m`, `3m`, `30d` |
| `theme` | `string` | `github-dark` | Color theme identifier |
| `custom_levels` | `string` | none | Comma-separated 5 hex colors for custom levels (e.g. `161b22,0e4429,006d32,26a641,39d353`) |
| `radius` | `number` | `2.5` | Cell corner radius for calendar (`0` = square, `2.5` = rounded, `5` = circle) |
| `area` | `boolean` | `true` | Show or hide area gradient fill on activity wave graph |
| `points` | `boolean` | `true` | Show or hide data points on activity wave graph |
| `hide_title` | `boolean` | `false` | Hide header title |
| `hide_total` | `boolean` | `false` | Hide total contributions count in header |
| `hide_streak` | `boolean` | `false` | Hide streak info in footer (calendar only) |
| `hide_legend` | `boolean` | `false` | Hide Less/More legend swatches (calendar only) |
| `border` | `boolean` | `true` | Show or hide card border |
| `title` | `string` | none | Custom title text for header |
| `refresh` | `boolean` | `false` | Bypass server cache to fetch fresh data immediately |

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build
npm run build
npm start
```

Visit `http://localhost:3000` to open the interactive generator playground.
