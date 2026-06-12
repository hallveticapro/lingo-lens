# LingoLens Stitch Design Analysis

This document summarizes the Stitch export in `lingo-lens-design/` and translates it into implementation guidance for Codex.

## Export Contents

Expected files:

- `lingo-lens-design/lingolens_design_system/DESIGN.md`
- `lingo-lens-design/lingolens_home_2/screen.png`
- `lingo-lens-design/lingolens_reader_2/screen.png`
- `lingo-lens-design/admin_dashboard_2/screen.png`
- `lingo-lens-design/admin_new_content/screen.png`
- `lingo-lens-design/admin_review_versions/screen.png`

Ignore `__MACOSX` and `.DS_Store` files if they appear after unzipping.

## Overall Design Direction

The Stitch design is strongest when treated as a premium editorial reading product, not a gamified language app or generic SaaS admin. The public pages should feel calm, literary, adult, and trustworthy. The admin pages should still carry the same typography, spacing, and restrained color system rather than switching to a default dashboard aesthetic.

## Design Tokens

### Colors

Core palette from the export:

- `#FAF9F6` — warm off-white background / paper tone
- `#FFFFFF` — card/surface layer
- `#1A1C1A` — main body text
- `#45474D` — muted text
- `#051125` — very dark navy, primary CTA and strong UI
- `#1B263B` — navy primary container
- `#9A442D` / terracotta family — RSS, accents, caution/destructive actions
- `#81B29A` / sage family — success, positive, subtle confirmation
- `#E3E2E0`, `#C5C6CD`, `#75777D` — borders/outline variants

### Typography

- Headlines: Playfair Display, bold editorial serif.
- Reading body: Source Serif 4, comfortable long-form serif.
- UI text: Inter, crisp sans-serif for nav, labels, buttons, forms, metadata.
- Reading body should avoid over-wide lines; target 65–75 characters on desktop.

### Shape and Depth

- Main cards: 16px radius, white background, thin border, very soft shadow.
- Buttons/inputs: 8px radius.
- Pills/chips: full radius.
- Shadows should be subtle and ambient, not heavy.

## Screen Notes

### Homepage

The homepage uses a centered editorial hero with large serif headline: “Read the world in Spanish at your level.” The layout has a simple top nav, two CTAs, a three-step how-it-works section, latest article cards, and a quiet footer.

Implementation priorities:

- Keep the hero spacious.
- Use large serif type for the headline.
- CTA buttons should be centered and simple.
- Article cards should show image, source tag, level chips, title, excerpt, and date.
- Do not overcrowd the home page with product settings.

### Reader Page

The reader page is the visual centerpiece. It uses a two-column desktop layout: main reading column and right sidebar. The main column contains breadcrumb, badges, large title, dek, metadata, image, level switcher, and body. The right sidebar contains vocabulary, comprehension, and RSS subscription cards.

Implementation priorities:

- Preserve the comfortable article column width.
- Use a sticky or stable right sidebar only if it does not harm mobile/responsive behavior.
- Level switcher should be pill-style and prominent under the hero image.
- Article body should use large, readable serif text with generous line-height.
- Sidebar cards should not visually overpower the article.

### Admin Dashboard

The admin dashboard uses a left sidebar, editorial title treatment, summary cards, and a content table. It should feel like a refined CMS, not a default admin template.

Implementation priorities:

- Left sidebar with active state.
- Summary cards for Published, Drafts, Needs Review, Failed Generations.
- Recent content table with search/filter controls.
- Empty states should preserve table structure but explain what to do next.

### New Content Page

The new content page is a full-page form with a centered form card. It includes source metadata, citation details, large source text textarea, and level-selection cards.

Implementation priorities:

- Do not use a modal.
- Keep long article text easy to paste/edit.
- Source metadata and citation fields should be grouped clearly.
- Level options should be card-like checkboxes.
- Save Draft and Generate Versions actions should be at the bottom.

### Review Versions Page

The review page has level tabs, editable generated fields, vocabulary editor, comprehension editor, QA notes panel, and publish/regenerate controls.

Implementation priorities:

- Level tabs must be clear and quick to switch.
- Editable content should be spacious enough for long text.
- QA notes should remain visible on desktop as a right-side panel.
- Regenerate action should be distinct from save/publish.

### Feeds Page

No Stitch screenshot exists. Design it from the same system. A good implementation is a public page with a serif heading, short explanation, and four feed cards for the `es-419` levels with copy/open actions.

## Implementation Warning

Do not let the visual build collapse into generic generated UI. If a component library is used, heavily customize it to the Stitch tokens and layouts. The public reader page is the most important screen to get right first.
