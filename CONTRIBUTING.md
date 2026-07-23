# Contributing to Arc

Thanks for your interest in contributing. This guide covers how to set up the project, the kinds of contributions that help most, and how we review changes.

## Code of Conduct

Participation is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By contributing, you agree to uphold it.

## Ways to contribute

- Report bugs and suggest features via [GitHub Issues](https://github.com/ahuryx/arc/issues)
- Improve docs (README, CONTRIBUTING, comments that clarify domain terms)
- Fix bugs or polish existing widgets
- Add carefully scoped features that fit the tray-hosted widget model

Before large work, open an issue so we can align on design. Domain terms live in [CONTEXT.md](CONTEXT.md) — prefer that vocabulary in PRs and discussions.

## Development setup

1. Install [Node.js](https://nodejs.org/) 20+, [pnpm](https://pnpm.io/), and [Rust](https://www.rust-lang.org/tools/install)
2. Install [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS
3. Clone and run:

```bash
git clone https://github.com/ahuryx/arc.git
cd arc
pnpm install
pnpm tauri dev
```

Recommended editor extensions: Tauri + rust-analyzer (see `.vscode/extensions.json`).

## Architecture notes

Keep seams thin (see CONTEXT.md):

- Controller imports **catalog**, never **registry**
- Settings, tray, and widget lifecycle go through **WorkspaceHost**
- Theme lives on **Workspace**, not widget data
- Widget content → `updateWidgetData`; layout → `updateWorkspace` / `updateWidgetState`

Match existing patterns: TypeScript + React for UI, Rust/Tauri for host concerns, Tailwind + existing UI components for styling.

## Pull requests

1. Fork the repo and create a branch from `main` (`fix/…`, `feat/…`, or `docs/…`)
2. Keep changes focused — one concern per PR when practical
3. Ensure the app builds and the path you touched still works under `pnpm tauri dev`
4. Fill out the PR template: what changed, why, and how you tested
5. Link related issues

We appreciate clear commit messages that explain intent (why), not only the diff (what).

## Reporting bugs

Use the bug report template and include:

- Arc / OS version
- Steps to reproduce
- Expected vs actual behavior
- Logs or screenshots when useful

## Security

Do not open public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
