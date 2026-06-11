---
name: LingoLens Design System
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#45474d'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545e76'
  primary: '#051125'
  on-primary: '#ffffff'
  primary-container: '#1b263b'
  on-primary-container: '#828da7'
  inverse-primary: '#bbc6e2'
  secondary: '#9a442d'
  on-secondary: '#ffffff'
  secondary-container: '#fc9174'
  on-secondary-container: '#742814'
  tertiary: '#00160d'
  on-tertiary: '#ffffff'
  tertiary-container: '#002d1e'
  on-tertiary-container: '#679881'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#bbc6e2'
  on-primary-fixed: '#101b30'
  on-primary-fixed-variant: '#3c475d'
  secondary-fixed: '#ffdbd2'
  secondary-fixed-dim: '#ffb4a1'
  on-secondary-fixed: '#3c0800'
  on-secondary-fixed-variant: '#7c2e19'
  tertiary-fixed: '#bbeed4'
  tertiary-fixed-dim: '#9fd1b8'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#1f4f3c'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Source Serif 4
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1140px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 40px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is rooted in a **Modern Editorial** aesthetic, moving away from the gamified, high-energy tropes of traditional language apps toward a "Literary Assistant" experience. The brand personality is smart, calm, and trustworthy, targeting adult learners who value depth and context over streaks and mascots.

The visual style leverages **Minimalism** with a **Tactile** touch. It emphasizes high-quality typography, generous whitespace (breathing room), and a sophisticated color palette that reduces cognitive load. The UI should feel like a premium digital magazine—intellectual, global, and quietly confident.

## Colors

The palette is designed for long-form reading and focused study. 

- **Primary (Navy - #1B263B):** Used for core UI structure, primary buttons, and authoritative elements.
- **Secondary (Terracotta - #E07A5F):** An accent for interactive highlights, progress indicators, or "call to discovery" moments. Use sparingly to maintain a calm environment.
- **Tertiary (Sage - #81B29A):** Used for success states, secondary accents, and "correct" feedback, providing a grounded, organic feel.
- **Background (Soft Off-White - #FAF9F6):** A warm, paper-like foundation that reduces eye strain compared to pure white.
- **Borders (#E5E5E5):** Thin, subtle dividers that define structure without adding visual noise.

## Typography

Typography is the cornerstone of this design system. We use a dual-font strategy to balance editorial elegance with functional clarity.

- **Headlines:** Use **Playfair Display**. It provides a high-contrast, sophisticated look that signals an "editorial" experience.
- **Reading Body:** Use **Source Serif 4**. It is highly legible for long-form content, translations, and definitions. Body text should target 65-75 characters per line to ensure optimal reading comfort.
- **UI Elements:** Use **Inter**. This clean sans-serif is reserved for navigation, buttons, labels, and metadata, providing a sharp functional contrast to the serif content.

## Layout & Spacing

This design system utilizes a **Fixed Grid** for desktop to ensure comfortable reading widths, and a fluid layout for mobile.

- **Desktop:** 12-column grid, max-width 1140px, centered. Main reading content should ideally occupy the center 8 columns (approx. 720px) to prevent overly long line lengths.
- **Mobile:** Single column with 20px side margins. 
- **Spacing Rhythm:** Based on an 8px baseline. Use `stack-lg` (48px) to separate major sections, and `stack-sm` (12px) for related elements within a card or list item.
- **Whitespace:** Prioritize "passive whitespace" between blocks of text to allow the user to digest information without feeling overwhelmed.

## Elevation & Depth

To maintain a sophisticated, flat-yet-layered look, we use **Tonal Layers** and **Ambient Shadows**:

- **Level 0 (Base):** The off-white background (#FAF9F6).
- **Level 1 (Cards/Surface):** Pure white (#FFFFFF) with a 1px border (#E5E5E5). This creates a crisp "paper-on-table" effect.
- **Shadows:** Use extremely soft, low-opacity shadows for interactive elements. (e.g., `box-shadow: 0 4px 20px rgba(27, 38, 59, 0.04)`). Avoid heavy, dark shadows.
- **Hover States:** Elements should subtly lift (slight shadow increase) or shift background color to a very light tint of the primary color.

## Shapes

The shape language is "Soft Professional." 

- **Cards & Containers:** Use `rounded-lg` (16px) for main content cards to create an approachable feel.
- **Buttons & Inputs:** Use `rounded-md` (8px) for a slightly sharper, more functional appearance.
- **Media/Images:** Always use a subtle 4px-8px radius to avoid harsh corners that conflict with the soft typography.

## Components

### Buttons
- **Primary:** Navy background, white Inter text, 8px radius. High contrast, used for the main action (e.g., "Start Lesson").
- **Secondary:** Transparent background, 1px Navy border, Navy text.
- **Tertiary:** Terracotta text with no border, used for less critical discovery actions.

### Cards
- White background, 1px subtle gray border, 16px radius. 
- Content inside cards should have generous internal padding (min 24px).

### Input Fields
- 1px border (#E5E5E5), 8px radius. 
- Focus state: Border changes to Navy (#1B263B) with a soft 2px glow.

### Chips/Tags
- Used for vocabulary categories or grammar points. 
- Soft Sage (#81B29A) or Navy (#1B263B) at 10% opacity with matching dark text. 100px radius (pill).

### Lists
- Clean, unboxed lists for definitions. Use thin horizontal dividers (#E5E5E5).
- Vocabulary terms in Serif Bold, definitions in Sans-Serif Regular.

### Progress Indicators
- Linear, thin (4px) bars using Sage (#81B29A). Avoid "circular rings" which can feel too game-like.