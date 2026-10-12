# Cue — Apple HIG redesign brief

Source screens: `assets/cue/screen-1-home.png`, `screen-2-gestures.png`, `screen-3-feedback.png`
Current size: **560 × 1212 px** — not a real iOS frame, which is the root of most issues below.

---

## 1. Frame and safe areas

| | Value |
|---|---|
| Canvas | **393 × 852 pt** (iPhone 15/16 Pro). Export @2x / @3x. |
| Status bar | 54 pt top (Dynamic Island devices) |
| Home indicator | 34 pt bottom — keep clear of controls |
| Horizontal margin | **16 pt** both sides |
| Tab bar (screen 1) | 49 pt + 34 pt safe area |

Everything below is in **points**, not pixels. Designing at a true point size is what makes the 44 pt target rule mean anything.

## 2. Type scale (iOS Dynamic Type, Large default)

| Style | Size / line height | Weight | Use here |
|---|---|---|---|
| Large Title | 34 / 41 | Bold | "Currently Using", "Gestures", "Feedback" |
| Title 2 | 22 / 28 | Bold | "Your other products" |
| Headline | 17 / 22 | Semibold | Row labels, card titles |
| Body | 17 / 22 | Regular | Row values, primary text |
| Subhead | 15 / 20 | Regular | Screen subtitles |
| Footnote | 13 / 18 | Regular | Helper text under lists |
| Caption 1 | 12 / 16 | Regular | Tile status text |

**Minimum text size is 11 pt** ([Apple](https://developer.apple.com/design/tips/)). Design so the layout survives one or two Dynamic Type steps up — the 3-up product tiles on screen 1 are the first thing that will break.

## 3. Tap targets

**Minimum 44 × 44 pt**, with **16 pt between stacked buttons** ([Apple](https://developer.apple.com/design/tips/)).

Check these — they read tight at true scale:

- **Segmented control** (ANC / Transp. / Off). Apple's own segmented control is 32 pt tall; since this is the primary control on the screen, go to 44 pt rather than inheriting the system minimum.
- **Slider thumbs** (Intensity, Strength). The thumb can stay small visually, but the touch area needs 44 pt.
- **Tab bar items** — currently a custom pill, see §5.
- **Product tiles** — fine on height, tight on label width.

## 4. Colour and contrast — measured, four failures

I sampled the actual PNGs (95th-percentile glyph pixel vs 5th-percentile background). Small text needs **4.5:1**:

| Screen | Element | Measured | |
|---|---|---|---|
| Home | "Subtle" / "Strong" slider labels | **3.07:1** | fail |
| Home | "Gestures, haptics, and tips" | **3.43:1** | fail |
| Gestures | "Adjust tap speed…" footnote | **3.37:1** | fail |
| Feedback | "Haptics mean confirmation…" | **4.12:1** | fail |
| Home | "HEADPHONES" label | 7.54:1 | pass |
| Gestures | Trailing values (Play / Pause) | 6.35:1 | pass |
| Feedback | Trailing value (Medium) | 6.46:1 | pass |

*Anti-aliasing makes these approximate, but the four failures are clear of the margin of error.*

**Fix:** the greys in the failing spots are around `#616163`–`#6E6E70`, darker than Apple's system values. Use the real dark-mode label colours instead:

- `label` — `#FFFFFF`
- `secondaryLabel` — `rgba(235,235,245,0.60)` → **≈6.4:1 on black, passes**
- `tertiaryLabel` — `rgba(235,235,245,0.30)` → ≈2.3:1, **placeholders and disabled only, never body text**

Swapping the four failing items to `secondaryLabel` fixes all of them.

## 5. Per-screen notes

### Screen 1 — Currently Using
- Adopt a real **large-title nav bar** that collapses to inline on scroll.
- Replace the **custom pill tab bar** with a standard iOS tab bar (49 pt, SF Symbols, labels, system material background). The current one is the least HIG-native element in the set.
- All-caps micro labels ("CURRENT MODE", "INTENSITY", "HEADPHONES", "CASE") aren't an iOS pattern. Use Footnote or Caption in sentence case, or Subhead in `secondaryLabel`.
- Group the mode card, battery, and products as **inset grouped sections** rather than bespoke cards.
- "Powerbeats Pro" wraps to two lines in a 3-up grid at 393 pt. Either shorten, or go 2-up.

### Screen 2 — Gestures
Closest to HIG already. The gesture list is effectively a correct inset-grouped table.
- Make it literally that: system separators inset to the text origin, 44 pt minimum rows, chevrons as `NSTextAlignment` trailing accessories.
- Nav bar with back button is right; give it a real large-title treatment.
- Footnote needs the contrast fix above.

### Screen 3 — Feedback
- The 2×2 signature grid is custom but defensible — it's a picker, not a list. Keep it, but give the selected state more than a red border: HIG wants selection legible without relying on colour alone (add a checkmark or filled background).
- Waveform card is decorative — mark it `accessibilityHidden` and make sure the label above carries the meaning.
- Strength slider: Light / Firm labels need the contrast fix.

## 6. Keep

Don't lose these — they're already right:

- **9:41** status bar time (Apple's convention in all marketing screens)
- Dark mode as the default presentation
- Beats red as a single accent against near-black
- The information hierarchy on screen 2 — tap vocabulary as a scannable list is the correct pattern

---

### Verified against
- [UI Design Dos and Don'ts](https://developer.apple.com/design/tips/) — 44 pt targets, 11 pt minimum text, 16 pt button spacing
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) — type scale, layout, colour

Contrast figures measured directly from the exported PNGs; everything else is the standard iOS scale.
