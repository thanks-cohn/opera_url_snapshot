# Opera URL Snapshot

**A portable, one-click browser archaeology tool.**

## **Install first — Opera**

**Nothing needs to be built, installed, compiled, or made executable. No `chmod` is required.**

Clone with SSH:

```bash
cd ~/dev
git clone git@github.com:thanks-cohn/opera_url_snapshot.git
cd opera_url_snapshot
realpath extension
```

Then:

1. Open **`opera://extensions`** in Opera.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension` directory printed by `realpath extension`.
5. Pin **URL Snapshot** to the toolbar.
6. Open a normal webpage and click the extension icon.

Captures are saved beneath Opera's configured Downloads directory:

```text
<Downloads>/url_snapshots/<timestamp>/
```

For a typical Linux setup, that is:

```text
~/Downloads/url_snapshots/<timestamp>/
```

To inspect recent captures:

```bash
find ~/Downloads/url_snapshots -type f | sort | tail -n 10
```

> **Font note:** GitHub controls README fonts and colors, so a repository cannot reliably force JetBrains Mono or Roboto Mono. All commands are placed in fenced code blocks so GitHub displays them in a clear monospace programming font. Users who configure JetBrains Mono or Roboto Mono as their browser monospace font will see that font here.

---

## What this is

Opera URL Snapshot records **what was already present at the moment of capture**. It takes a PNG screenshot of the visible viewport and creates a matching JSON file containing the page title, URL, metadata, viewport state, document structure, performance entries, media information, and other data already exposed by the browser.

It is **not a web crawler**. It does not follow links, reload pages, scroll automatically, fetch resources, run OCR, summarize content, or attempt to reconstruct an entire site.

Think of it as archaeology rather than crawling: **one observed page, one moment, one visual artifact, and one provenance record.**

## What one click creates

Each capture creates a timestamped directory containing exactly two paired files:

```text
url_snapshots/
└── 20260804T070101.381Z/
    ├── 20260804T070101.381Z-the-garden-kings-example-com-a83f91c2.png
    └── 20260804T070101.381Z-the-garden-kings-example-com-a83f91c2.json
```

The PNG and JSON always use the same basename.

The filename uses:

```text
TIMESTAMP + FIRST 10 TITLE CHARACTERS + LAST 5 TITLE CHARACTERS + DOMAIN + UNIQUE ID
```

The full, unshortened page title is preserved inside the JSON. For titles of 15 characters or fewer, the title is used once without overlapping fragments.

## Portable by default

No compiler, package manager, server, account, or API key is required.

The extension can be loaded directly from the `extension/` directory in Opera, Chrome, Chromium, Brave, Vivaldi, and Edge.

The portable version saves beneath the browser's configured Downloads directory:

```text
<Downloads>/url_snapshots/<timestamp>/
```

This is the only filesystem location a normal browser extension can use portably without installing a native program.

### Custom absolute directories

Writing directly to an arbitrary path such as:

```text
~/url_snapshots/<timestamp>/
```

while bypassing the browser Downloads directory requires a small Native Messaging helper. That helper is planned as an optional companion, not a requirement for ordinary use.

The intended cross-platform behavior is:

- Linux: `~/url_snapshots/<timestamp>/`
- macOS: `~/url_snapshots/<timestamp>/`
- Windows: `%USERPROFILE%\url_snapshots\<timestamp>\`

Until the helper is installed, the zero-install extension remains fully usable and stores captures under the browser Downloads directory.

## Install in other Chromium browsers

Open the browser's extensions page, enable Developer mode, choose **Load unpacked**, and select the `extension` directory.

The code uses standard Manifest V3 Chromium extension APIs.

## Capture behavior

When the toolbar button is clicked, the extension:

1. records one timestamp;
2. reads the active tab;
3. captures the visible viewport as PNG;
4. asks the current document for passive metadata already available in memory;
5. creates a sanitized page-name fragment using the first 10 and last 5 characters;
6. creates one shared basename;
7. writes the PNG and JSON into one timestamped folder;
8. reports success or a clear failure through the extension badge.

## Data collected

The JSON is versioned as:

```json
{
  "schema": "url-viewport-snapshot/v1"
}
```

It can include:

- full page title and shortened filename fragment;
- complete active URL and parsed URL components;
- tab title, favicon URL, status, pinned state, muted state, and related tab properties;
- document URL, base URI, referrer, language, direction, encoding, content type, visibility, focus, and reported last-modified value;
- every existing `<meta>` element;
- normalized Open Graph and Twitter metadata;
- every existing `<link>` element, including canonical and alternate links;
- embedded JSON-LD source and parse status;
- viewport, screen, scroll position, page geometry, and device-pixel ratio;
- heading outline and passive element counts;
- selected text and a safe description of the active element;
- image, audio, and video element metadata already exposed by the document;
- navigation, paint, resource, and other performance entries already recorded by the browser;
- browser language, timezone, online state, hardware concurrency, touch capability, and selected media-query preferences;
- explicit status and error records when a category is absent, unsupported, restricted, or fails.

## What it deliberately does not do

The extension does not:

- crawl links;
- make additional HTTP requests;
- fetch canonical pages, favicons, manifests, images, or media;
- reload the page;
- scroll the page;
- trigger lazy loading;
- click, expand, dismiss, or alter page elements;
- stitch a full-page screenshot;
- run OCR;
- generate summaries, classifications, or AI tags;
- read cookies;
- read `localStorage`, `sessionStorage`, or IndexedDB;
- collect passwords, form values, payment information, clipboard contents, or authentication tokens;
- save the complete DOM.

**Comprehensive observation does not mean collecting secrets.**

## Restricted pages

Browsers block extensions from injecting scripts into some pages, including browser settings, extension stores, and certain internal or protected documents.

On such pages, URL Snapshot records whatever tab-level information is available and reports the document section as restricted instead of pretending that data was captured.

## Filename examples

Long title:

```text
The Garden of Forgotten Kings
```

Sanitized title:

```text
the-garden-of-forgotten-kings
```

Filename fragment:

```text
the-garden-kings
```

Short title:

```text
About Us
```

Filename fragment:

```text
about-us
```

## Project structure

```text
extension/
├── manifest.json
├── background.js
└── content.js
```

The extension is intentionally plain JavaScript so it can be inspected, copied, archived, and loaded without a build tool.

## Privacy and provenance

The JSON should be understood as a provenance record of browser-observable state, not as proof that every value was authored honestly by the website. For example, a page can provide misleading metadata or a synthetic `lastModified` value.

The screenshot records the visible viewport only. It does not include Opera's address bar, tabs, sidebar, or other browser chrome.

## Current status

The repository contains the portable extension implementation. The optional Native Messaging helper for arbitrary absolute output directories is a separate portability layer and remains optional so the basic tool stays immediately usable.

## License

No license has been selected yet.
