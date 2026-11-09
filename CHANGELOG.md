# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0-beta.2] - 2026-11-09

Pre-release (beta).

### Added

- Clock widget: choose a time zone in Settings → Clock (default: device time)

### Fixed

- Theme switch now updates native window backgrounds (missing Tauri permission)
- Crypto: delisted Binance pairs no longer show frozen prices; missing coins fall back to CoinGecko

### Changed

- Dependencies updated: Vite 8, ESLint 10, TypeScript 6.0, Tauri 2.12 (JS + Rust)

## [0.2.0-beta.0] - 2026-08-03

Pre-release (beta). Not a stable v1 — expect bugs and breaking changes.

### Changed

- Notes widget uses a live rich-text editor (TipTap); markdown formats as you type — no Edit/Preview toggle
- About panel shows version and Beta label

## [0.1.0] - 2026-07-23

### Added

- Initial open-source release of Arc
- Desktop widgets: Clock, Calendar, Crypto, Weather, Notes, Pomodoro
- Workspace settings: theme, arrange, keep-on-top, lock, autostart
- Optional Jalali calendar / Persian locale support

[Unreleased]: https://github.com/ahuryx/arc/compare/v0.2.0-beta.2...HEAD
[0.2.0-beta.2]: https://github.com/ahuryx/arc/compare/v0.2.0-beta.1...v0.2.0-beta.2
[0.2.0-beta.0]: https://github.com/ahuryx/arc/compare/v0.1.0...v0.2.0-beta.0
[0.1.0]: https://github.com/ahuryx/arc/releases/tag/v0.1.0
