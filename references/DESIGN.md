---
name: LingoLens Design System
colors:
  surface: '#faf9f6'
  surface-lowest: '#ffffff'
  surface-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#45474d'
  outline: '#c5c6cd'
  outline-strong: '#75777d'
  primary: '#051125'
  primary-container: '#1b263b'
  primary-fixed: '#d7e2ff'
  secondary: '#9a442d'
  secondary-container: '#e07a5f'
  secondary-fixed: '#ffdbd2'
  tertiary: '#81b29a'
  tertiary-fixed: '#bbeed4'
  error: '#ba1a1a'
typography:
  display:
    fontFamily: Playfair Display
    fallback: Georgia, serif
  reader:
    fontFamily: Source Serif 4
    fallback: Georgia, serif
  ui:
    fontFamily: Inter
    fallback: ui-sans-serif, system-ui, sans-serif
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  unit: 8px
  container-max: 1140px
  gutter: 24px
  mobile-margin: 20px
  desktop-margin: 40px
---

# Design

This root design file is the agent-friendly summary of the visual source of truth. The detailed Stitch export remains in `lingo-lens-design/lingolens_design_system/DESIGN.md`, and the implemented tokens live in `app/globals.css`.

## Brand & Style

LingoLens uses a modern editorial reading aesthetic: calm, literary, adult, trustworthy, and learner-friendly. The UI should feel like a premium digital magazine or literary assistant, with the product chrome quietly supporting long-form reading and careful admin review.

Avoid visual language from generic SaaS dashboards and gamified language apps. The interface should not depend on mascot energy, streak mechanics, neon palettes, heavy shadows, excessive gradients, or dense analytics-style cards.

## Colors

Use the warm paper background `#FAF9F6` as the default page surface. Primary structural UI uses deep navy `#051125` and navy `#1B263B`. Terracotta `#9A442D` / `#E07A5F` is the discovery and action accent, used sparingly. Sage `#81B29A` is for success, positive secondary accents, and subtle learning support.

Surfaces should layer softly: white or near-white cards on paper backgrounds, thin gray borders, and very low-opacity navy shadows. Keep contrast readable, especially in metadata, chips, buttons, feeds, and admin tables.

## Typography

Headlines use Playfair Display with Georgia fallback. Reading bodies use Source Serif 4 with Georgia fallback and should stay around 65-75 characters per line on desktop. UI labels, nav, buttons, metadata, forms, and admin surfaces use Inter with system sans fallbacks.

Use display type for true editorial hierarchy: home hero, article title, page title, and section title. Keep compact panels, tables, cards, forms, and admin controls in tighter UI type so the product remains scannable.

## Layout & Spacing

Use a centered content width of about 1140px for broad pages, with 24px gutters and 20px mobile side margins. Reading pages should keep the article column comfortably narrow and place supporting vocabulary, comprehension, and RSS panels in a right sidebar on desktop.

Favor generous vertical rhythm for public reading experiences and denser but still calm spacing for admin workflows. Admin content creation and review should be full-page workflows, not cramped modals.

## Components

Buttons use 8px radius, clear focus states, and high-contrast navy primary treatment. Secondary buttons are outlined or transparent. Tertiary discovery actions may use terracotta text without adding visual weight.

Cards use white or near-white surfaces, subtle borders, 16px radius, and soft ambient shadows. Do not nest cards inside cards. Repeated article cards should foreground title, source metadata, locale, level, and image when available.

Chips and badges should be pill-shaped and understated. Reading-level controls should feel prominent and tactile without becoming game-like. Inputs and textareas use 8px radius, clear labels, helpful errors, and visible focus treatment.

## Motion & Interaction

Motion should be restrained: subtle hover lifts, soft color shifts, and clear pressed/focus states. Avoid playful bounce, gamified celebration, or decorative animation that competes with reading.

## Accessibility

Design for keyboard navigation, focus visibility, sufficient contrast, readable text sizes, and reduced motion. Locale-aware reading experiences must preserve `lang` and `dir` semantics, and image-heavy surfaces should keep alt text and captions useful for readers and feeds.
