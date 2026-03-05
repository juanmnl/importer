<p align="center">
  <img src="./assets/brand/logo-black.svg" alt="Photo Importer" width="260" />
</p>

<p align="center">
  Import photos and videos from cameras and SD cards.
</p>

<p align="center">
  <em>Canceled Adobe, so no more Lightroom Classic for me.<br/>I realized I missed the way it imported photos, so I built my own :) (with the help of Claudio)</em>
</p>

<p align="center">
  <a href="https://github.com/juanmnl/importer/releases/latest">
    <img src="https://img.shields.io/github/v/release/juanmnl/importer?include_prereleases&label=download&color=black" alt="Download" />
  </a>
</p>

---

<!-- screenshots go here -->
<!-- <p align="center"><img src="./assets/screenshots/main.png" width="720" /></p> -->

## Features

- **Auto-detect volumes** — Cameras and SD cards detected on mount
- **EXIF metadata** — Read date, camera model, lens, and dimensions
- **Folder patterns** — Organize imports by `YYYY/YYYY-MM-DD` or custom patterns
- **Duplicate detection** — Skip files that already exist at the destination
- **Pick / Reject workflow** — Flag keepers and rejects before importing
- **Light & dark themes** — Follows system preference

## Download

Grab the latest alpha from [**Releases**](https://github.com/juanmnl/importer/releases/latest).

> **Unsigned app** — macOS will block the first launch. Go to
> **System Settings → Privacy & Security** and click **Open Anyway**.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Click` | Focus thumbnail |
| `Double-click` | Detail view |
| `⌘ + Click` | Toggle select |
| `Shift + Click` | Range select |
| `⌘ + A` | Select all |
| `P` / `X` / `U` | Pick / Reject / Clear flag |
| `← → ↑ ↓` | Navigate |
| `Esc` | Deselect / Back |

## Build from Source

```bash
git clone https://github.com/juanmnl/importer.git
cd importer
npm ci
npm start        # dev mode
npm run make     # build DMG + ZIP
```

Requires **Node 20+** and **macOS** (Electron targets Darwin).

## License

[MIT](./LICENSE)
