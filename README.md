| `gotham` | Gotham (slate → mint) |
| `shades-of-purple` | Shades of Purple (violet → yellow) |
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
| `height` | `number` | `260` | Custom card height for activity graph (`220` to `600`) |
| `grid` | `boolean` | `true` | Show or hide background coordinate grid lines on activity curve graph |
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
```

Open [http://localhost:3000](http://localhost:3000) to view the interactive studio preview.
