# GitView

GitView turns a GitHub username into SVG cards you can embed in a README. Pick a chart type, pick a theme, tweak the colors, copy the markdown.

## Chart types

All types render with `/api/graph?username=USERNAME&type=TYPE`.

- `calendar` (default). The classic 52-week heatmap.
- `graph`. A daily activity curve through true per-day values.
- `streak`. Current streak, longest streak, and daily average.
- `bar`. Totals grouped by month.
- `weekday`. Totals grouped by day of the week.

Example:

```markdown
[![torvalds's GitView](https://your-domain/api/graph?username=torvalds&type=calendar)](https://github.com/torvalds)
```

Swap `your-domain` for wherever you deploy this. Locally it is `http://localhost:3000`.

## Time ranges

`range=1y` (default), `6m`, `3m`, or `30d`. The streak card ignores it.

## Themes and custom colors

There are 25 built-in themes, including `github-dark` (default), `github`, `dracula`, `ocean`, `tokyonight`, and `gruvbox`. Set one with `theme=NAME`.

Any palette is editable in the studio. Click a theme, then change the background, border, or the five level colors. Edits are sent as overrides:

- `custom_levels`: five hex colors, no `#`, comma separated. Example: `custom_levels=161b22,0e4429,006d32,26a641,39d353`
- `bg_color`: card background. Example: `bg_color=0d1117`
- `border_color`: card border. Example: `border_color=30363d`
- `line_color`: activity curve color. Example: `line_color=39d353`

## Parameters

| Parameter | Default | What it does |
| :--- | :--- | :--- |
| `username` or `user` | Required | GitHub username to render |
| `type` | `calendar` | One of `calendar`, `graph`, `streak`, `bar`, `weekday` |
| `range` | `1y` | One of `1y`, `6m`, `3m`, `30d` |
| `theme` | `github-dark` | Built-in theme name |
| `custom_levels` | none | Five hex colors overriding the theme levels |
| `bg_color` | none | Hex color overriding the card background |
| `border_color` | none | Hex color overriding the card border |
| `line_color` | none | Hex color overriding the activity curve |
| `radius` | `2.5` | Calendar cell corner radius, `0` to `5` |
| `height` | `260` | Activity graph height, `220` to `600` |
| `area` | `true` | Fill under the activity curve (`false` hides it) |
| `points` | `true` | Dots on the activity curve (`false` hides them) |
| `grid` | `true` | Grid lines on the activity curve (`false` hides them) |
| `hide_title` | `false` | Hide the card title (`true` hides it) |
| `hide_total` | `false` | Hide the totals count (`true` hides it) |
| `hide_streak` | `false` | Hide streak text on the calendar (`true` hides it) |
| `hide_legend` | `false` | Hide the Less/More legend (`true` hides it) |
| `border` | `true` | Card border (`false` hides it) |
| `title` | none | Custom title text |
| `refresh` | `false` | Skip the cache and fetch fresh data (`true` or `1`) |

Raw contribution data is available as JSON at `/api/data?username=USERNAME`.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the studio. Copy the markdown, HTML, URL, or JSON snippet straight from the page.
