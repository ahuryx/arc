# Arc

Tray-hosted desktop widgets — clock, calendar, weather, crypto, notes, and pomodoro — with a clean modern chrome.

Cross-platform desktop app for **Windows**, **macOS**, and **Linux**, built with [Tauri 2](https://tauri.app/), [React](https://react.dev/), and [TypeScript](https://www.typescriptlang.org/).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Build & Release](https://github.com/ahuryx/arc/actions/workflows/release.yml/badge.svg)](https://github.com/ahuryx/arc/actions/workflows/release.yml)

## Features

- **System tray host** — show, hide, arrange, and lock widgets from the tray
- **Built-in widgets** — Clock, Calendar, Crypto, Weather, Notes, Pomodoro
- **Workspace controls** — keep-on-top, auto-arrange (left/right columns), launch at startup, theme (`dark` / `light` / `system`)
- **Locale options** — English + Gregorian by default; optional Jalali (شمسی) calendar with Persian UI
- **Settings window** — configure workspace prefs and per-widget data in one place

## Screenshots

<!-- Add screenshots or a short demo GIF here -->

## Download

Prebuilt installers for Windows, macOS, and Linux are published on the [Releases page](https://github.com/ahuryx/arc/releases). Each release provides platform-native packages (`.msi`/`.exe`, `.dmg`/`.app`, AppImage/`.deb`).

To build from source instead, follow the steps below.

## Requirements

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Platform toolchain:
  - **Windows**: WebView2 (preinstalled on Win10/11)
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `webkit2gtk-4.1`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `build-essential`, etc. — see the [Tauri Linux prerequisites](https://v2.tauri.app/start/prerequisites/#linux)

For full prerequisites, see the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/).

## Quick start

```bash
git clone https://github.com/ahuryx/arc.git
cd arc
pnpm install
pnpm tauri dev
```

### Useful scripts

| Command | Description |
|--------|-------------|
| `pnpm dev` | Vite frontend only |
| `pnpm build` | Typecheck + production frontend build |
| `pnpm tauri dev` | Run the full desktop app |
| `pnpm tauri build` | Produce installers / bundles for the current platform |

## Project layout

```
src/                 React UI (widgets, settings, shell)
src/core/            Catalog, host, types, theme
src/widgets/         Per-widget React surfaces
src/settings/        Settings window
src/feeds/           Live data (crypto, weather)
src-tauri/           Rust / Tauri host (tray, windows, store)
CONTEXT.md           Domain language for contributors
```

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please do not file public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md).

## License

This project is licensed under the [MIT License](LICENSE).
