# hoangluongtran.dev

[![Netlify Status](https://api.netlify.com/api/v1/badges/438ac737-e47b-4d20-9728-fbf7200be682/deploy-status)](https://app.netlify.com/projects/animated-jelly-01b57b/deploys)
[![Hugo](https://img.shields.io/badge/Hugo-0.164.0%20extended-ff4088?logo=hugo)](https://gohugo.io/)
[![AsciiDoc](https://img.shields.io/badge/content-AsciiDoc-4b8bbe)](https://asciidoc.org/)

Personal blog and portfolio of a backend engineer working in Java and Spring.
It is a static site: no backend, no database, no client-side framework — Hugo
renders every page at build time and Netlify serves the result.

Content is bilingual: Vietnamese at the root, English under `/en/`.

**Live:** <https://hoangluongtran.dev/> · **English:** <https://hoangluongtran.dev/en/>

---

## Features

- **AsciiDoc content** — rendered by Asciidoctor with Rouge syntax
  highlighting. `rouge-css = "class"` emits token classes instead of inline
  hex colors, so code blocks follow the site's dark mode.
- **Bilingual (vi / en)** — Hugo multilingual, with translation optional per
  page: a page that has no translation yet falls back gracefully instead of
  404ing.
- **Auto-generated social cards** — every page's 1200×630 OpenGraph/Twitter
  image is composed at build time inside Hugo itself
  (`layouts/partials/opengraph/get-featured-image.html`). No external image
  service, no cards uploaded by hand.
- **Client-side search** — [Pagefind](https://pagefind.app/), lazy-loaded on
  first focus, scoped to the current language, with `/` as a keyboard shortcut.
- **Progressive enhancement** — the dark/light toggle, reading-progress bar and
  search live in one dependency-free `assets/js/main.js`. The site is fully
  readable with JavaScript disabled.
- **Privacy-first analytics** — a hand-written GA4 partial with
  `anonymize_ip`, `client_storage: "none"` (no persistent cookie), respecting
  Do Not Track, and loaded only when `HUGO_ENV=production`.
- **Newsletter signup** via Netlify Forms (`data-netlify` + honeypot) — no
  serverless function and no third-party JavaScript.
- **Full-content RSS** for the blog section only (`layouts/blog/rss.xml`).

## Tech stack

| Layer | Tool | Version |
| --- | --- | --- |
| Static site generator | Hugo **extended** | 0.164.0 (pinned in `netlify.toml`) |
| Content format | AsciiDoc via Asciidoctor | 2.0.26 (`Gemfile.lock`) |
| Syntax highlighting | Rouge | 5.1.0 (`Gemfile.lock`) |
| Ruby runtime | Ruby + Bundler | 3.4.10 |
| Styling | Dart Sass + PostCSS (autoprefixer, cssnano) | see `package.json` |
| Search | Pagefind | fetched at build time via `npx -y` |
| Hosting / CI | Netlify (Node 24) | — |
| Analytics | Google Analytics 4 | privacy-enhanced |

Pagefind is intentionally **not** a `package.json` dependency — it runs once
after Hugo as a post-processing step over `public/`, so `npx -y pagefind` is
enough.

## Prerequisites

- **Hugo, extended edition** — the SCSS pipeline (`css.Sass`) exists only in
  the extended build. Verify with:

  ```bash
  hugo version   # the output must contain the word "extended"
  ```

- **Ruby ≥ 3.x and Bundler** — AsciiDoc is rendered by an external
  `asciidoctor` binary, not by Hugo. `[markup.asciidocExt] failureLevel =
  "fatal"` in `hugo.toml` means a missing gem fails the build outright rather
  than silently degrading.
- **Node.js ≥ 18** — used for the PostCSS pipeline and to run Pagefind. Use
  Node 24 to match Netlify.

## Getting started

```bash
git clone git@github.com:hoangluongtran0309/hoangluongtran.dev.git
cd hoangluongtran.dev

bundle install   # asciidoctor + rouge
npm install      # postcss, autoprefixer, cssnano

hugo server      # http://localhost:1313
```

## Commands

| Purpose | Command |
| --- | --- |
| Fast dev loop (search disabled) | `hugo server` |
| Dev loop with working search | `hugo && npx pagefind --site public && hugo server --renderStaticToDisk` |
| Include drafts and future-dated posts | `hugo server -D -F` |
| Production build (identical to Netlify) | `hugo && npx -y pagefind --site public` |
| Pre-commit check | `hugo --gc --minify` |
| Broken internal links, deprecated template APIs | `hugo --printPathWarnings` |

> **Why plain `hugo server` has no search.** Pagefind generates `/pagefind/` by
> scanning the built `public/` directory, which does not exist under the dev
> server's in-memory filesystem. `assets/js/main.js` catches the failed dynamic
> `import()` and the search box stays inert — this is expected, not a bug. To
> exercise search locally, re-run both build commands whenever content changes;
> the dev server does not re-index Pagefind on the fly.

## Project structure

```text
.
├── archetypes/
│   ├── blog.adoc            # template for `hugo new content/blog/...`
│   └── default.md
├── assets/                  # processed by Hugo Pipes (fingerprinted, minified)
│   ├── fonts/               # raw, non-subset TTFs — used ONLY by images.Text
│   ├── images/
│   │   ├── avatar.jpg
│   │   └── twittercard/template.png   # social card background
│   ├── js/main.js           # theme toggle, reading progress, Pagefind search
│   └── scss/main.scss
├── content/
│   ├── _index.{vi,en}.adoc  # homepage hero copy
│   ├── about/
│   ├── blog/                # posts live here as page bundles
│   ├── newsletter/
│   └── projects/
├── i18n/                    # vi.toml, en.toml — every UI string
├── layouts/
│   ├── _default/            # baseof, list, single, terms
│   ├── blog/                # single.html, rss.xml
│   ├── projects/single.html
│   ├── taxonomy/tag.html
│   ├── index.html           # homepage: hero + search + recent posts
│   ├── 404.html
│   └── partials/            # grouped by domain: opengraph/, post/, ...
├── static/                  # copied verbatim: favicon, robots.txt, web fonts
│   └── fonts/               # subsetted .woff2 for the browser
├── hugo.toml
├── netlify.toml
├── Gemfile / Gemfile.lock
├── package.json
└── postcss.config.js
```

Two font directories, on purpose: `static/fonts/*.woff2` are subsetted files
the browser downloads, while `assets/fonts/*.ttf` are full, non-subset files
that Hugo's `images.Text` needs to draw social cards — it cannot resolve a font
by system name the way CSS can.

`archetypes/blog.adoc` must keep the `.adoc` extension. Hugo looks up
archetypes by section **and** extension; an archetype named `blog.md` would
silently fall back to `default.md`, producing front matter without `tags`,
`images` and `summary`.

## Writing a post

```bash
hugo new content/blog/2026/<slug>/index.vi.adoc
```

The path must end in `.adoc` for the archetype above to apply. This creates a
[page bundle](https://gohugo.io/content-management/page-bundles/) — a directory
holding the article and its images together:

```text
content/blog/2026/my-post/
├── index.vi.adoc
├── index.en.adoc     # optional, created by hand
└── diagram.png
```

Front matter generated by the archetype — `title` is pre-filled from the bundle
directory name, the rest is yours to complete:

```yaml
---
title: "My Post"
date: 2026-09-01T09:00:00+07:00
tags: []
images: []
summary: ""
draft: true
---
```

`summary` is used for the meta description and social card, so keep it filled
in. Images belong inside the bundle, referenced relatively — never in
`static/`:

```asciidoc
image::diagram.png[Hexagonal architecture diagram]
```

### Adding a translation

Create `index.en.adoc` beside `index.vi.adoc` in the same bundle. Hugo pairs
translations by base filename, so no `translationKey` is needed, and both
language versions share the same images. Translating is optional: an
untranslated page is a normal state, handled by
`layouts/partials/language-switcher.html`.

### AsciiDoc quick reference

The differences from Markdown that actually catch you out:

| Goal | AsciiDoc |
| --- | --- |
| Section headings | `== Heading 2`, `=== Heading 3` |
| Bold / italic | `*bold*` / `_italic_` |
| Inline code | `` `code` `` |
| Code block | `[source,java]` then `----` … `----` |
| Admonition | `NOTE: …`, `TIP: …`, `WARNING: …` |
| Link | `https://example.com[Link text]` |
| Image | `image::cover.png[Alt text]` |
| Table | `\|===` … `\|===` |
| Cross-reference | `<<section-id,Link text>>` |

An `= Title` level-1 heading is not needed — the `title` front matter field
provides it.

### Publishing

Set `draft: false`, commit the whole bundle, and push. Netlify builds and
deploys automatically. Opening a pull request instead produces a deploy preview
with drafts visible, which is the easiest way to proofread an article at full
size.

## Internationalization

- **File-suffix inside one bundle** (`index.vi.adoc` + `index.en.adoc`), not
  separate `content/vi/` and `content/en/` trees. This keeps images shared
  between language versions and each article self-contained.
- **Every UI string goes through `i18n/vi.toml` and `i18n/en.toml`**, called as
  `{{ i18n "key" }}`. Exceptions are brand names, machine-readable `datetime`
  attributes and URL path segments. `assets/js/main.js` cannot call `i18n`, so
  it receives already-translated labels through `data-*` attributes and
  hardcodes no language strings.
- **Menus are declared per-language** in `hugo.toml`
  (`[[languages.<lang>.menu.main]]`) — Hugo does not translate a global menu
  item's `.Name`.
- **Dates must use `{{ .Date | time.Format "..." }}`** (a Hugo function, which
  localizes month names to the page language). `.Date.Format` is a Go method
  and never localizes — reserve it for fixed machine-readable values such as
  `datetime="..."` and ISO 8601 timestamps in OpenGraph tags.
- **`netlify.toml` redirects `/en/*` to `/en/404.html`.** Without it, Netlify
  serves the Vietnamese `public/404.html` for every unmatched path, including
  English ones, which makes the site look like it silently drops back to
  Vietnamese.

Run `hugo --printPathWarnings` after touching anything language-related; Hugo
warns immediately when a deprecated multilingual API is used.

## Search

Pagefind indexes only elements marked `data-pagefind-body`, which today is the
article element in `layouts/blog/single.html` — so blog posts are searchable
and navigation pages are not. The search UI is inline on the homepage; there is
no separate `/search/` page. The index is split per language automatically from
`<html lang>`, and `assets/js/main.js` also passes the language explicitly.

## Social cards

`layouts/partials/opengraph/get-featured-image.html` overlays the post title,
site name and tags onto `assets/images/twittercard/template.png` using chained
`images.Text` filters — no external tooling. Do not upload cards by hand.

To verify one after a build, open `public/<path>/index.html`, find the URL in
`<meta name="twitter:image">`, and check that the rendered image shows the
right title and tags.

## Deployment

Netlify builds from `netlify.toml` — treat that file as the source of truth and
change build settings there, not in the Netlify UI:

- Build command: `hugo && npx -y pagefind --site public`, publish directory
  `public`.
- Pinned toolchain: `HUGO_VERSION = 0.164.0`, `NODE_VERSION = 24`,
  `RUBY_VERSION = 3.4.10`.
- Deploy previews and branch deploys build with `-D -F -b $DEPLOY_PRIME_URL/`
  so drafts and future-dated posts are reviewable before merge.

`public/` and `resources/` are gitignored on purpose — Netlify rebuilds both.

## Checklist before merging

- [ ] `hugo --gc --minify` completes with no errors or shortcode warnings
- [ ] `hugo --printPathWarnings` reports no broken internal links
- [ ] `hugo && npx -y pagefind --site public` succeeds and search returns the
      expected results in both languages
- [ ] Social card renders the correct title and tags
- [ ] Layout checked at mobile width
- [ ] Netlify deploy preview builds successfully
