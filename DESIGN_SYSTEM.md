# PhysioControl — Design System

A bilingual (ES/EN) practice-management platform for physiotherapists in Costa Rica.
**Voice:** clinical & trustworthy, warm & human, modern & minimal.
**Platform:** desktop web app. **Fonts:** Hanken Grotesk (UI), IBM Plex Mono (data/labels).

> This file is the source of truth for implementation. Use the CSS variables in
> `:root`, the Tailwind config, or the raw tokens below — they are all identical.

---

## 1. Color

Tropical greens ground the brand; warm sun-gold adds humanity. Neutrals are
**warm-toned** (slightly green/yellow bias) so long clinical sessions stay easy on the eyes.

### Brand — Green
| Token | Hex | Role |
|---|---|---|
| `green-900` (Jungle) | `#123d2d` | Deepest text-on-green, gradients |
| `green-700` | `#1a684e` | Primary hover, avatar text |
| `green-600` (Primary) | `#1f7a5c` | **Primary brand** — buttons, active nav, links |
| `green-300` | `#cdead9` | Avatar fills, selection, chart mid |
| `green-100` | `#e8f2ec` | Secondary button bg, active nav bg |
| `green-050` | `#f0f7f3` | Today-column tint |

### Accent — Sun & Coral
| Token | Hex | Role |
|---|---|---|
| `sun-500` | `#f2b134` | Highlight action, brand mark, chart peak |
| `sun-300` | `#fbdd94` | Soft sun tint |
| `coral-500` | `#e0785a` | Notification dots, badges, warm accent |
| `coral-100` | `#fbe6de` | Coral surface tint |

### Neutrals — Warm gray
| Token | Hex | Role |
|---|---|---|
| `ink-900` | `#1b201c` | Primary text |
| `slate-700` | `#33403a` | Strong secondary text, labels |
| `gray-500` | `#55605a` | Body secondary text |
| `gray-400` | `#8a938c` | Muted text, placeholders, icons |
| `line-300` | `#d9dcd5` | Input borders |
| `line-200` | `#e1e0d8` | Dividers |
| `line-100` | `#ece9e0` | Card borders |
| `paper-100` | `#f7f6f2` | App background, inset surfaces |
| `paper-050` | `#fbfbf9` | Input background |
| `white` | `#ffffff` | Cards, sidebar, topbar |

### Semantic — Status
| Token | Text | Surface | Dot | Meaning |
|---|---|---|---|---|
| `success` | `#1f7a5c` | `#e2f0e8` | `#1f7a5c` | Confirmada / En curso |
| `warning` | `#9a6b00` | `#fbefd0` | `#e6a521` | Pendiente |
| `danger` | `#b23b3b` | `#fbeceb` | `#b23b3b` | Cancelada |
| `info` | `#2b6cb0` | `#e4eefa` | `#2b6cb0` | Telemedicina |
| `neutral` | `#55605a` | `#eeece4` | `#8a938c` | Completada |

---

## 2. Typography

**Families**
- `--font-sans: "Hanken Grotesk", system-ui, sans-serif;` — all UI text.
- `--font-mono: "IBM Plex Mono", monospace;` — timestamps, IDs, codes, micro-labels.

Load: `https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300..800;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap`

**Scale** (px / weight / letter-spacing / line-height)
| Style | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|
| Display | 58 | 700 | -0.035em | 1.02 |
| H1 | 27–30 | 700 | -0.025em | 1.1 |
| H2 | 22 | 600–700 | -0.015em | 1.2 |
| H3 / card title | 16–17 | 700 | -0.01em | 1.3 |
| Body | 16 | 400 | 0 | 1.55 |
| Body-sm | 14–15 | 400–500 | 0 | 1.5 |
| Small | 13 | 500 | 0 | 1.4 |
| Micro-label (mono) | 11–12 | 500 | 0.06–0.14em, UPPERCASE | 1.2 |

Use `text-wrap: pretty` on paragraphs and headings.

---

## 3. Foundations

**Spacing** — 4pt base. Steps: `4, 8, 12, 16, 20, 24, 32, 48, 56, 88`.
Common: card padding `22px`, section gap `18–20px`, page padding `32px`.

**Radius**
| Token | Value | Use |
|---|---|---|
| `radius-sm` | 8px | Inner chips, small swatches |
| `radius-md` | 10–11px | Inputs, buttons |
| `radius-lg` | 16px | Cards, panels |
| `radius-xl` | 20–22px | App shell, large avatar |
| `radius-full` | 999px | Pills, dots, circular avatars |

**Elevation**
| Token | Shadow |
|---|---|
| `shadow-sm` | `0 1px 3px rgba(27,32,28,0.06)` |
| `shadow-md` | `0 4px 14px rgba(27,32,28,0.10)` |
| `shadow-lg` | `0 12px 30px rgba(27,32,28,0.16)` |
| `shadow-brand` | `0 4px 14px rgba(31,122,92,0.24)` (green buttons/cards) |

**Focus ring:** `border-color: #1f7a5c; box-shadow: 0 0 0 3px #dcefe4;`

---

## 4. Components

### Button
Base: `font-weight:600; border-radius:11px; padding:13px 24px; cursor:pointer;` (min height 44px).
| Variant | BG | Text | Hover | Shadow |
|---|---|---|---|---|
| Primary | `#1f7a5c` | `#fff` | `#1a684e` | `shadow-brand` |
| Highlight | `#f2b134` | `#1b201c` | `#e6a521` | `0 2px 8px rgba(242,177,52,0.30)` |
| Secondary | `#e8f2ec` | `#1f7a5c` | `#d8ebe0` | none |
| Outline | `#fff` + `1px #d9dcd5` | `#33403a` | bg `#f7f6f2` | none |
| Ghost | transparent | `#55605a` | bg `#f1efe8` | none |
| Danger | `#fbeceb` | `#b23b3b` | `#f6ddda` | none |

### Input
`padding:12px 14px; border:1px solid #d9dcd5; border-radius:10px; background:#fbfbf9; font-size:15px;`
- Focus: green border + focus ring (above).
- Error: `border-color:#d98b8b;` label suffix `#b23b3b`.
- Label: `13px / 600 / #33403a`, `margin-bottom:7px`.

### Status pill
`font-size:13px; font-weight:600; padding:7px 14px; border-radius:999px;` with optional
7px dot (`gap:7px`). Colors from **Semantic** table (text + surface + dot).

### Card
`background:#fff; border:1px solid #ece9e0; border-radius:16px; padding:22px; box-shadow:shadow-sm;`
- **Metric card (brand):** `background:#1f7a5c; color:#fff;` label `#bfe0cf`, `shadow-brand`.
- **Inset surface:** `background:#f7f6f2` for list rows / notes inside a card.

### App shell
- **Sidebar:** 236px, `#fff`, right border `#ece9e0`. Nav item active = `bg #e8f2ec / text #1f7a5c / weight 700`; idle = `text #55605a / weight 500`, hover `#f4f2ec`. Badges use `coral-500` bg, white text.
- **Topbar:** 68px, `#fff`, bottom border. Search input on `#f7f6f2`. ES/EN segmented toggle (active pill = white on `#f1efe8`).
- **Page:** background `#f7f6f2`, padding `32px`.

### Charts
Bars use a green ramp low→high: `#cdead9 → #a9d8bf → #5eb088 → #2e8c63 → #1f7a5c`; peak/current bar `sun-500`. Progress bars: track `#f1efe8`, fill `#1f7a5c`, height 6px, radius 4px.

---

## 5. Copy conventions
- Spanish-primary UI, English mirror available. Currency in colones: `₡4.2M`, `₡45,000`.
- Dates: `20 julio 2026`, short `12 jul 2026`. Phone: `+506 8812 4590`.
- Record IDs (mono): `EXP-2026-0481`.

---

## 6. CSS variables (drop into global stylesheet)

```css
:root {
  /* brand */
  --green-900:#123d2d; --green-700:#1a684e; --green-600:#1f7a5c;
  --green-300:#cdead9; --green-100:#e8f2ec; --green-050:#f0f7f3;
  /* accent */
  --sun-500:#f2b134; --sun-300:#fbdd94; --coral-500:#e0785a; --coral-100:#fbe6de;
  /* neutral */
  --ink-900:#1b201c; --slate-700:#33403a; --gray-500:#55605a; --gray-400:#8a938c;
  --line-300:#d9dcd5; --line-200:#e1e0d8; --line-100:#ece9e0;
  --paper-100:#f7f6f2; --paper-050:#fbfbf9; --white:#ffffff;
  /* semantic */
  --success:#1f7a5c; --success-bg:#e2f0e8;
  --warning:#9a6b00; --warning-bg:#fbefd0;
  --danger:#b23b3b;  --danger-bg:#fbeceb;
  --info:#2b6cb0;    --info-bg:#e4eefa;
  /* type */
  --font-sans:"Hanken Grotesk",system-ui,sans-serif;
  --font-mono:"IBM Plex Mono",monospace;
  /* radius */
  --radius-sm:8px; --radius-md:11px; --radius-lg:16px; --radius-xl:20px; --radius-full:999px;
  /* elevation */
  --shadow-sm:0 1px 3px rgba(27,32,28,.06);
  --shadow-md:0 4px 14px rgba(27,32,28,.10);
  --shadow-lg:0 12px 30px rgba(27,32,28,.16);
  --shadow-brand:0 4px 14px rgba(31,122,92,.24);
  --focus-ring:0 0 0 3px #dcefe4;
}
```

---

## 7. Tailwind config (v3)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        green: { 900:'#123d2d',700:'#1a684e',600:'#1f7a5c',300:'#cdead9',100:'#e8f2ec',50:'#f0f7f3' },
        sun:   { 500:'#f2b134',300:'#fbdd94' },
        coral: { 500:'#e0785a',100:'#fbe6de' },
        ink:'#1b201c', slate:{700:'#33403a'}, gray:{500:'#55605a',400:'#8a938c'},
        line:{300:'#d9dcd5',200:'#e1e0d8',100:'#ece9e0'},
        paper:{100:'#f7f6f2',50:'#fbfbf9'},
        success:'#1f7a5c', warning:'#e6a521', danger:'#b23b3b', info:'#2b6cb0',
      },
      fontFamily: {
        sans:['"Hanken Grotesk"','system-ui','sans-serif'],
        mono:['"IBM Plex Mono"','monospace'],
      },
      borderRadius: { sm:'8px', md:'11px', lg:'16px', xl:'20px' },
      boxShadow: {
        sm:'0 1px 3px rgba(27,32,28,.06)',
        md:'0 4px 14px rgba(27,32,28,.10)',
        lg:'0 12px 30px rgba(27,32,28,.16)',
        brand:'0 4px 14px rgba(31,122,92,.24)',
      },
    },
  },
};
```

---

## 8. Component checklist for build-out
- [ ] Button (6 variants) · Input (default/focus/error) · Select · Checkbox · Toggle
- [ ] Status pill (5 semantics + "Nuevo paciente" sun pill)
- [ ] Card · Metric card · Inset list row
- [ ] Sidebar nav (active/idle/badge) · Topbar (search, ES/EN toggle, notifications)
- [ ] Calendar week grid (day headers, hour rows, event blocks by status color)
- [ ] Progress bar · Bar chart (green ramp) · Donut/ring progress
- [ ] Patient header · Tabs · Treatment-plan panel

Reference implementations live in `PhysioControl App.dc.html` (screens) and
`PhysioControl Design System.dc.html` (style guide).
