# GasMeUp Design System — "Midnight Violet"

Dark-only, violet-accented, card-based. Tokens live in `src/styles/theme.ts`; shared
navigation chrome in `src/styles/navigation.ts`. Screens should not hardcode colours,
font sizes, radii or spacing — import them from the theme or use a shared component.

## Principles

1. **One accent.** Violet (`color.primary` #7C5CFF) marks the primary action and the
   selected state. Everything else is neutral ink. Green/red are reserved for money
   (owed to you / you owe) and status.
2. **Results first.** Each screen leads with the answer (trip cost, balances, fuel
   economy); inputs and secondary actions sit around it.
3. **No dead ends.** Every list has a loading, empty and error state (`EmptyState`),
   and errors offer a retry or next step instead of raw messages (`friendlyError`).
4. **Calm surfaces.** Depth comes from three surface steps and hairline borders, not
   heavy shadows. Only the hero card and primary buttons glow.
5. **Fewer steps.** Prefer doing the work for the user (auto-calculating a trip once
   both ends are chosen, auto-focusing the next field) over extra buttons.

## Tokens

| Group | Tokens |
| --- | --- |
| Surfaces | `bg` → `surface` (cards, sheets) → `surfaceRaised` (inputs, rows in cards) → `surfacePressed` |
| Text | `text`, `textSecondary`, `textTertiary`, `textOnPrimary` |
| Brand | `primary`, `primaryPressed`, `primaryText` (violet as text/icon), `primarySoft` (tinted fills) |
| Status | `success`/`successSoft`, `danger`/`dangerSoft`, `warning`/`warningSoft` |
| Spacing | 4-pt scale: `xxs 2`, `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 20`, `xxl 24`, `xxxl 32`, `huge 48` |
| Radius | `sm 8`, `md 12` (inputs), `lg 16` (buttons), `xl 22` (cards), `xxl 28` (sheets), `pill` |
| Type (Inter) | `display 44`, `title1 30`, `title2 22`, `title3 18`, `headline 16`, `body 16`, `callout 15`, `subhead 14`, `footnote 13`, `caption 12`, `overline 12 caps` |
| Sizes | controls 50pt tall, small controls 36pt, icon buttons 40pt, screen gutter 20pt |

## Components (`src/components`)

| Component | Use |
| --- | --- |
| `Page` | Every screen. Safe area, top glow, gutter, optional `scroll`, sticky `footer`. Pass `safeTop={false}` under a stack header. |
| `ScreenHeader` | Large left-aligned title for tab roots, with optional eyebrow, subtitle and icon actions. |
| `Text` | All text. `variant` from the type scale, `tone` for colour. |
| `Button` | `primary` (one per screen), `secondary`, `ghost`, `danger`, `success`; `md` or `sm`. |
| `IconButton` | Circular icon actions with optional badge. Always give an `accessibilityLabel`. |
| `Input` / `AutocompleteInput` | Labelled fields with focus, error and locked states; inline `SuggestionList`. |
| `Card` | Grouped content. `padded={false}` for lists. |
| `ListRow` | Rows in lists and settings: leading avatar/icon, title/subtitle, value or trailing control, chevron. |
| `Table` | A `Card` list of rows with built-in loading and empty states. |
| `SectionHeader` | Overline label above a group. |
| `SegmentedControl` | 2–4 mutually exclusive options. |
| `Modal` (sheet) | Bottom sheet for every modal: title, subtitle, `tall` for maps. One sheet at a time. |
| `EmptyState` | Icon + title + message + optional action, for empty and error states. |
| `Avatar`, `Badge` | Gravatar with initials fallback; small status pills. |

## Copy

Sentence case for titles and buttons ("Save trip", not "Save Trip"). Speak to the
user ("You owe Alex"), keep errors actionable, and avoid exposing technical detail.
