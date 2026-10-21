# Design System: Duo

> **Aesthetic Philosophy**: Tactile, editorial papercraft designed like an intimate luxury scrapbook and bespoke stationery. Built with warm natural textures, solid surfaces, elegant serifs, and physical metaphors. Completely free of generic tech gradients or synthetic glassmorphism.

---

## 1. Color Palette & Tokens

### 1.1 Canvas & Warmth Neutrals
The background of Duo is a gentle, warm parchment paper canvas (`#FAF6EF`), creating an eye-soothing, analog reading ambiance.

| Token | Hex | Usage |
|---|---|---|
| `warmth-50` | `#FDFCF9` | Pure highlights, pristine stationery surfaces |
| `warmth-100` | `#FAF6EF` | **Primary Canvas Background** |
| `warmth-200` | `#F5ECE0` | Card borders, subtle container fills |
| `warmth-300` | `#EBD7C2` | Outer borders, scrollbar tracks, inactive states |
| `warmth-400` | `#DDBFA2` | Muted icons, subtle metadata |
| `warmth-500` | `#C89D7A` | Warm secondary accents |
| `warmth-600` | `#B0805C` | Tertiary text, helper descriptions |
| `warmth-700` | `#8C5E40` | Secondary body text, subheadings |
| `warmth-800` | `#67442F` | Form labels, bold emphasis |
| `warmth-900` | `#432C20` | **Primary Text & High-Contrast Headings** |

### 1.2 Rosewood (Primary Romantic Accent)
A deep, grounded wine red that evokes wax seals, leather journals, and intimate warmth.

| Token | Hex | Usage |
|---|---|---|
| `rosewood-50` | `#FFF5F5` | Light badge backgrounds, alert banners |
| `rosewood-100` | `#FFE8E8` | Selected tab ribbons, hover backgrounds |
| `rosewood-200` | `#FFD4D5` | Active selection highlights |
| `rosewood-500` | `#EA4C53` | Heart icons, active alerts, date night tags |
| `rosewood-600` | `#D53039` | Hover states on primary buttons |
| `rosewood-700` | `#B2222B` | **Primary Action Buttons, Navigation Badges** |
| `rosewood-800` | `#942027` | Deep header brand marks |
| `rosewood-900` | `#7C2026` | High-contrast romantic accents |

### 1.3 Complementary Natural Accents
- **Sage** (`#5F8265` / `sage-50` to `sage-800`): Used for travel itineraries, outdoor dates, completed checklist markers, and positive moods.
- **Terracotta** (`#C8644A` / `terracotta-100` to `terracotta-700`): Warm clay accent for milestone celebrations and anniversary badges.
- **Butter** (`#FCF9EE`): Soft warm ivory used for handwritten notes, polaroid backs, and sticky notes.
- **Blush** (`#FDE4DE` / `#E8A598`): Gentle romantic warmth for floating hearts and subtle highlights.

---

## 2. Typography Hierarchy

### 2.1 Font Families
- **Editorial Serif**: `"Fraunces"`, `"Playfair Display"`, Georgia, serif  
  *Usage*: Main sanctuary titles, quotes, celebration headers, dates, anniversary day counter.
- **Clean Sans**: `"Plus Jakarta Sans"`, system-ui, -apple-system, sans-serif  
  *Usage*: Body copy, navigation ribbons, interactive controls, inputs, metadata.
- **Handwriting Cursive**: `"Caveat"`, cursive  
  *Usage*: Polaroid captions, love note sign-offs, handwritten sticky note scribbles.

### 2.2 Type Scale
```
Display Hero:  font-serif text-3xl sm:text-4xl font-bold tracking-tight text-warmth-900
Section Title: font-serif text-xl sm:text-2xl font-bold text-warmth-900
Card Header:   font-serif text-lg font-semibold text-warmth-900
Body Copy:     font-sans text-sm text-warmth-800 leading-relaxed
Caption/Meta:  font-sans text-xs text-warmth-600
Handwritten:   font-handwriting text-lg text-warmth-900 tracking-wide
```

---

## 3. Tactile Elements & Physical Metaphors

### 3.1 Paper Cards & Elevation
Cards should feel like tactile paper resting on a wooden desk rather than digital floating rectangles.
- Background: `bg-white`
- Border: `border border-warmth-200/80`
- Shadow: `shadow-warm-sm` (`0 1px 3px rgba(115, 65, 45, 0.05)`)
- Hover: Subtle lift `hover:shadow-warm hover:border-warmth-300`

### 3.2 Polaroid Frame (`.polaroid-frame`)
A realistic photographic keepsake frame:
```css
.polaroid-frame {
  background-color: #FFFFFF;
  padding: 12px 12px 28px 12px;
  border: 1px solid rgba(140, 126, 114, 0.15);
  box-shadow: 0 8px 20px -4px rgba(46, 38, 35, 0.08), 0 2px 6px -1px rgba(46, 38, 35, 0.04);
}
```

### 3.3 Washi Tape Ribbons
Used at the top of notes and pinned cards to simulate washi tape fasteners:
- **Rose Washi**: `bg-[rgba(232,141,150,0.65)] backdrop-blur-[2px] shadow-sm`
- **Sage Washi**: `bg-[rgba(198,236,202,0.70)] backdrop-blur-[2px] shadow-sm`
- **Butter Washi**: `bg-[rgba(252,249,238,0.85)] backdrop-blur-[2px] shadow-sm`

### 3.4 Micro-Animations
- **Heartbeat Pulse** (`.animate-heartbeat`): Subtle 1.8s ease-in-out breathing scale (1.0 to 1.15) for live status indicator.
- **Floating Heart** (`.animate-float-heart`): Float up 30px with scaling and fade-out over 1.2s when tapping love notes or mood reactions.

---

## 4. Component Standards

### 4.1 Buttons
- **Primary Action**:  
  `bg-rosewood-700 hover:bg-rosewood-800 text-white font-medium text-xs sm:text-sm py-2 px-4 rounded-xl shadow-sm transition active:scale-[0.98]`
- **Secondary / Ghost Action**:  
  `bg-white hover:bg-warmth-100 text-warmth-800 border border-warmth-300 text-xs sm:text-sm py-2 px-4 rounded-xl transition`

### 4.2 Form Inputs
- `bg-warmth-50 border border-warmth-300 rounded-xl px-3.5 py-2.5 text-sm text-warmth-900 placeholder:text-warmth-400 focus:outline-none focus:ring-2 focus:ring-rosewood-500/20 focus:border-rosewood-600 transition`

### 4.3 Navigation Tabs (Editorial Ribbons)
- Inactive: `bg-transparent text-warmth-700 hover:text-warmth-900 hover:bg-warmth-200/60 rounded-xl px-3 py-1.5 text-xs font-medium`
- Active: `bg-rosewood-700 text-white rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm`

---

## 5. Anti-Patterns (Strictly Forbidden)

❌ **NO AI Gradients**: Never use `from-purple-500 via-pink-500 to-cyan-500`.  
❌ **NO Frosted Glass Overuse**: Never use translucent blur backgrounds over the entire page. Surfaces must be solid paper.  
❌ **NO Neon Colors**: Avoid raw `#FF0000`, `#00FF00`, `#0000FF`.  
❌ **NO Random Corporate Emojis**: Use clean Lucide icons or intimate typography instead of cartoon stickers.  
