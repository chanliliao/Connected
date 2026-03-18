# Connected — Design System

Cherry-picked from 20 login explorations. Reference this when styling `LoginPage.css` / `LoginPage.jsx` or any future screens.

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#fdf7f9` | Page/screen background |
| `--color-card-bg` | `#ffffff` | Card background |
| `--color-input-bg` | `#fdf8fb` | Input field fill |
| `--color-input-border` | `#fce7f3` | Input border (default) |
| `--color-input-border-focus` | `#db7093` | Input border (focused) |
| `--color-logo-grad-start` | `#db7093` | Logo box gradient start (palevioletred) |
| `--color-logo-grad-end` | `#c9617a` | Logo box gradient end |
| `--color-btn-grad-start` | `#fb7185` | Sign-in button gradient start |
| `--color-btn-grad-end` | `#ec4899` | Sign-in button gradient end |
| `--color-text-heading` | `#1c1c2e` | App name, card headings |
| `--color-text-label` | `#9ca3af` | Field labels, secondary text |
| `--color-text-input` | `#6b7280` | Input placeholder & value text |
| `--color-text-footer` | `#9ca3af` | Footer / hint text |
| `--color-link` | `#ec4899` | Footer links, accent links |
| `--color-divider` | `#f3f4f6` | OR divider lines |
| `--color-google-bg` | `#f9fafb` | Google button background |
| `--color-google-border` | `#f3f4f6` | Google button border |

---

## Typography

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| App name | `'Caveat', cursive` | 32px | 700 | Warm, handwritten personality |
| Tagline | `'Quicksand', sans-serif` | 11px | 400 | `letter-spacing: 0.06em` |
| Field labels | `'Quicksand', sans-serif` | 10px | 600 | `text-transform: uppercase; letter-spacing: 0.10em` |
| Button text | `'Quicksand', sans-serif` | 14px | 700 | `letter-spacing: 0.02em` |
| Input text | `'Inter', sans-serif` | 12px | 400 | Clean, readable form font |
| Body / misc | `'Quicksand', sans-serif` | 12–13px | 500 | Default fallback |
| Footer / hint | `'Quicksand', sans-serif` | 12px | 500 | Links at weight 600 |

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Quicksand:wght@400;500;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
```

---

## Component Specs

### Screen / Page
```css
background: #fdf7f9;
font-family: 'Quicksand', sans-serif;
```

### Logo Box
```css
width: 58px;
height: 58px;
border-radius: 20px;
background: linear-gradient(135deg, #db7093, #c9617a);
box-shadow: 0 6px 20px rgba(219, 112, 147, 0.40);
display: flex;
align-items: center;
justify-content: center;
```
- Icon: ♥ (white, font-size 26px)

### Card
```css
background: #ffffff;
border: 1px solid rgba(0, 0, 0, 0.06);
border-radius: 24px;
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
padding: 22px 20px 20px;
```

### Field Label
```css
font-family: 'Quicksand', sans-serif;
font-size: 10px;
font-weight: 600;
color: #9ca3af;
text-transform: uppercase;
letter-spacing: 0.10em;
margin-bottom: 6px;
```

### Input
```css
width: 100%;
padding: 10px 14px;
background: #fdf8fb;
border: 1.5px solid #fce7f3;
border-radius: 12px;
color: #6b7280;
font-size: 12px;
font-family: 'Inter', sans-serif;
outline: none;
/* focus state: */
border-color: #db7093;
```

### Sign-In Button (Primary)
```css
width: 100%;
padding: 13px;
border: none;
border-radius: 14px;
background: linear-gradient(135deg, #fb7185, #ec4899);
box-shadow: 0 4px 16px rgba(236, 72, 153, 0.30);
color: #ffffff;
font-family: 'Quicksand', sans-serif;
font-size: 14px;
font-weight: 700;
letter-spacing: 0.02em;
cursor: pointer;
```

### OR Divider
```css
text-align: center;
font-family: 'Quicksand', sans-serif;
font-size: 10px;
font-weight: 500;
color: #d1d5db;
margin: 12px 0;
position: relative;
/* lines via ::before / ::after */
/* width: 36% each side; height: 1px; background: #f3f4f6 */
```

### Google Sign-In Button
```css
width: 100%;
padding: 10px;
background: #f9fafb;
border: 1px solid #f3f4f6;
border-radius: 12px;
color: #6b7280;
font-family: 'Quicksand', sans-serif;
font-size: 12px;
font-weight: 600;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
cursor: pointer;
```

### Footer / Hint Text
```css
font-family: 'Quicksand', sans-serif;
font-size: 12px;
font-weight: 500;
color: #9ca3af;
text-align: center;
margin-top: 16px;
/* links: color #ec4899; font-weight 600 */
```

---

## CSS Variables (applied in `style.css`)

```css
--color-bg:          #fdf7f9
--color-card:        #ffffff
--color-primary:     #ec4899
--color-secondary:   #ec4899
--color-text:        #1c1c2e
--color-text-muted:  #9ca3af
--color-border:      #fce7f3
--color-input-bg:    #fdf8fb
--color-input-text:  #6b7280
--color-link:        #ec4899
--gradient-primary:  linear-gradient(135deg, #fb7185, #ec4899)
--shadow-btn:        0 4px 16px rgba(236, 72, 153, 0.30)
--font-heading:      'Caveat', cursive
--font-body:         'Quicksand', sans-serif
--font-input:        'Inter', sans-serif
--radius-card:       24px
--radius-input:      12px
--shadow-card:       0 4px 24px rgba(0, 0, 0, 0.05)
```

---

## Source Attribution

| Element | Source Design |
|---|---|
| Overall structure, card, spacing | P1 — Cherry Blossom |
| Logo gradient color `#db7093` | P10 — Mauve Club |
| App name font (Caveat) | P1 — Cherry Blossom |
| Labels, buttons, UI text (Quicksand) | P1 — Cherry Blossom |
| Input text font (Inter) | P17 — Porcelain Serif |
| Sign-in button gradient | P18 — Sunrise Glow |

Preview file: `login-design-combined-preview.html`
