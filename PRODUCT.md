# Product

## Register

product

## Users

LingoLens serves adult language learners who want real-world reading material at a level they can actually understand. Readers browse and read published adaptations without accounts, switch between reading levels for the same source item, and subscribe to locale-and-level-specific RSS feeds.

It also serves admins and content editors who manually add source texts, generate target-language adaptations, review AI output, edit or regenerate individual levels, and publish only after review. Future language editors need the system to support new locales, scripts, reading frameworks, and scaffolds without schema rewrites.

## Product Purpose

LingoLens turns source content into multilingual, leveled reading experiences. Its core model is:

```text
source content + target locale + reading level = adaptation
```

The MVP starts with Latin American Spanish (`es-419`) and four levels: Super Beginner, Beginner, Intermediate, and Natural. Success means readers can discover, read, switch levels, and subscribe to feeds smoothly, while admins can create, generate, review, publish, archive, and troubleshoot adaptations safely.

## Brand Personality

The product should feel smart, calm, and trustworthy. It is a premium editorial reading app and literary assistant for adults, not a gamified language drill. The tone should be clear, quietly confident, learner-friendly, and respectful of both source material and reader attention.

## Anti-references

Do not make LingoLens feel like a generic SaaS dashboard, a streak-based language game, a neon education app, or a mascot-led beginner product. Avoid cartoon characters, XP/streak mechanics, heavy shadows, excessive gradients, noisy dashboards, cramped modals for long-form editing, hardcoded Spanish-only assumptions, and visual choices that make reading feel secondary to chrome.

## Design Principles

1. Editorial calm over gamification.
2. Comprehension without condescension.
3. Preserve the source-to-adaptation mental model everywhere.
4. Trust through reviewability, clear states, and explicit publication controls.
5. Multilingual by structure, not by one-off language branches.

## Accessibility & Inclusion

Reader surfaces should prioritize semantic HTML, clear heading hierarchy, readable line length, strong contrast, visible focus states, keyboard access, and reduced cognitive load for long-form reading. Locale-aware `lang` and `dir` handling matters because future locales may require RTL layout, ruby/furigana-style annotations, romanization, or script-specific scaffolds. Rendered Markdown must remain sanitized, images need meaningful alt text where available, and important generation, review, loading, error, and empty states should be explicit rather than inferred.
