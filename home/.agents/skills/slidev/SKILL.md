---
name: slidev
description: Creates Slidev presentations as Markdown slide decks for developers. Use when user says "make slides", "create a presentation", "make a slide deck", "write a talk", "presentation about", "slides for", "slidev", or asks to turn notes/content into a presentation. Outputs a slides.md file in ~/presentations/ and provides the command to run it.
metadata:
  author: rfhold
  version: "1.1"
  category: productivity
  tags: slidev, presentation, slides, markdown, talk
---

# Slidev

Creates developer-friendly Markdown slide presentations using Slidev. Outputs `slides.md` to `~/presentations/<topic>/` and provides the run command.

CRITICAL: Never auto-run the presentation. Always output the command for the user to run themselves.
CRITICAL: Use `bunx @slidev/cli` — NOT `npx slidev` (wrong package name).

## Workflow

### Step 1 — Gather requirements

If the user provides a topic or outline, use it. Otherwise ask:
- What is the presentation topic?
- Who is the audience (devs, general, executives)?
- Roughly how many slides?
- Any specific sections or talking points?

### Step 2 — Plan the slide structure

Before writing, outline the slides:
1. Cover slide (title + subtitle)
2. Agenda / overview (optional, >5 slides)
3. Content slides (one idea per slide)
4. Code/diagram slides as needed
5. Summary / Thank You

### Step 3 — Create the file

CRITICAL: Create the directory first if it doesn't exist.

```bash
mkdir -p ~/presentations/<slugified-topic>
```

Write `~/presentations/<slugified-topic>/slides.md`.

### Step 4 — Tell the user how to run it

After writing, output these commands:

```bash
# Start the dev server (opens at http://localhost:3030)
bunx @slidev/cli ~/presentations/<topic>/slides.md --open

# Export to PDF (requires playwright-chromium)
bunx @slidev/cli export ~/presentations/<topic>/slides.md
```

## Slide Writing Guidelines

- One idea per slide — short, punchy bullets
- Use `v-clicks` for progressive list reveals on all bullet lists
- Add presenter notes (HTML comments at end of each slide) with talking points
- Default theme: the custom **Aura** theme at `~/dot/.config/slidev/theme-aura` — use `theme: ../../dot/.config/slidev/theme-aura` (relative from `~/presentations/<topic>/slides.md`). No `fonts:` block needed — the theme's `package.json` defaults to Inter + Fira Code.
- Default transition: `slide-left` (set in theme defaults — omit from frontmatter unless overriding)
- Use `mdc: true` for inline styling

### Layout Selection Guide

| Situation | Layout |
|-----------|--------|
| Title/cover | `cover` (default for first slide) |
| Key statement | `center` or `statement` |
| Two concepts side-by-side | `two-cols` |
| Show an image with explanation | `image-right` or `image-left` |
| Section divider | `section` |
| Quote | `quote` |
| Final slide | `end` or `center` |
| Code focus | `default` with large code block |
| Embed a webpage/demo | `iframe` |

### Starter Template

```md
---
theme: ../../dot/.config/slidev/theme-aura
title: <Title>
mdc: true
---

# Title

Subtitle or tagline

<!-- Presenter note: welcome the audience, introduce yourself -->

---
layout: center
---

# Agenda

<v-clicks>

- Topic One
- Topic Two
- Topic Three

</v-clicks>

---

# Slide Title

<v-clicks>

- Key point one
- Key point two
- Key point three

</v-clicks>

<!-- Presenter note: elaborate here -->

---
layout: center
class: text-center
---

# Thank You

Questions?

<PoweredBySlidev />
```

## Reference

For full syntax details, layouts, components, and CLI flags, see `references/slidev-reference.md`.
