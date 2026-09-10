# GitHub Contribution Graph Generator

A fast, reliable alternative to broken third-party GitHub contribution graph widgets. Generates dynamic SVG graphs for your GitHub profile README, portfolio, or documentation with support for custom color themes, streak statistics, and dual-engine data fetching.

---

## Why Existing Tools Broke

Older widgets like `ghchart.rshah.org` relied on scraping older GitHub HTML structures (such as `<rect>` elements with `data-count` attributes) or were hosted on deprecated cloud free tiers that ran into strict rate limits. GitHub modernized its contribution calendar markup to use semantic `<table>` elements with `<tool-tip>` tags.

This project solves this by:
1. Parsing GitHub's current contribution calendar DOM without breaking.
2. Supporting GitHub's official GraphQL API with a Personal Access Token (PAT) for 100% rate-limit resilience and private repository contribution counting.
3. Automatically falling back to public profile scraping when no token is supplied.
4. Serving cache headers (`Cache-Control: public, max-age=1800, s-maxage=3600`) and in-memory TTL caching to prevent rate-limiting and work reliably behind GitHub's Camo image proxy.

---

## Quick Start

### 1. Embed in Your GitHub README

Replace `YOUR_USERNAME` with your GitHub username:

```markdown
[![GitHub Activity](http://localhost:3000/api/graph?username=YOUR_USERNAME&theme=github-dark)](https://github.com/YOUR_USERNAME)
```

Or with HTML:

```html
<a href="https://github.com/YOUR_USERNAME">
  <img src="http://localhost:3000/api/graph?username=YOUR_USERNAME&theme=github-dark" alt="GitHub Activity" />
</a>
```

*(When deployed to Vercel or a custom domain, replace `http://localhost:3000` with your deployed URL).*

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
| `theme` | `string` | `github-dark` | Color theme identifier |
| `custom_levels` | `string` | none | Comma-separated 5 hex colors for custom levels (e.g. `161b22,0e4429,006d32,26a641,39d353`) |
| `radius` | `number` | `2.5` | Square corner radius in pixels (`0` to `5`) |
| `hide_title` | `boolean` | `false` | Hide header title |
| `hide_total` | `boolean` | `false` | Hide total contributions count in header |
| `hide_streak` | `boolean` | `false` | Hide current and longest streaks in footer |
| `hide_legend` | `boolean` | `false` | Hide the Less/More legend swatches |
| `border` | `boolean` | `true` | Show or hide card border |
| `title` | `string` | none | Custom title text for header |
| `refresh` | `boolean` | `false` | Bypass server cache to fetch fresh data immediately |

---

## Examples

### Dracula Theme without Title

```markdown
![Activity](https://your-domain.com/api/graph?username=torvalds&theme=dracula&hide_title=true)
```

### Ocean Theme with Custom Radius

```markdown
![Activity](https://your-domain.com/api/graph?username=torvalds&theme=ocean&radius=4)
```

### Custom Hex Color Ramp

```markdown
![Activity](https://your-domain.com/api/graph?username=torvalds&custom_levels=1e1e2e,45475a,cba6f7,f38ba8,a6e3a1)
```

### Raw JSON API

To get raw contributions and streak counts for custom UIs:

```
GET /api/data?username=torvalds
```

Returns:
```json
{
  "username": "torvalds",
  "totalContributions": 3692,
  "weeks": [...],
  "streak": {
    "current": 72,
    "longest": 80,
    "total": 3692,
    "dailyAverage": 10.01
  }
}
```

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

---

## Environment Variables (Optional)

Create a `.env.local` file in the root:

```env
# Optional: GitHub Personal Access Token for higher rate limits and private repo data
GITHUB_TOKEN=ghp_your_personal_access_token
```

If not provided, the server automatically uses the public profile scraper.

---

## Deployment to Vercel

1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. (Optional) Set `GITHUB_TOKEN` under Project Settings > Environment Variables.
4. Deploy. Your dynamic SVG endpoint will be available at `https://your-project.vercel.app/api/graph?username=...`.
