# Widget App — domain language

Tray-hosted desktop widgets with Win11 chrome. Tauri 2 host; React widget UIs.

## Terms

| Term | Meaning |
|------|---------|
| **Widget** | One frameless webview (`widget-<id>`) + React content |
| **Workspace** | Shell prefs: visibility, positions, lock, keep-on-top, arrange, autostart, **theme** |
| **Widget data** | Content prefs: notes tabs, weather city, calendar mode, pomodoro durations |
| **WorkspaceHost** | Deep module for tray + settings + widget lifecycle actions |
| **Theme** | Workspace-owned `dark` \| `light` \| `system`; CSS `data-theme` + native chrome follow resolved OS/preference |
| **Locale / CalendarMode** | Default English + Gregorian; optional Jalali (شمسی) via Settings — FA text uses Vazirmatn |
| **GlassSurface** | Transparent window + acrylic/mica effects + CSS tint (aspirational; runtime is solid chrome today) |
| **LiveFeed** | Polling snapshot stream (`subscribe` / `getSnapshot`) for crypto & weather |
| **Catalog** | Widget metadata only (controller-safe; no React); owns fitted content heights |
| **Registry** | Catalog + React components (widget webviews only) |
| **Controller** | Hidden webview that owns tray + window lifecycle |
| **Settings window** | Dedicated window for workspace + widget data |
| **Arrange** | Stack visible widgets into left/right columns by per-widget `side` |
| **Auto-arrange** | When on (default), show/hide/side/gap changes re-stack automatically |
| **Side** | Per-widget `left` \| `right` column for arrange |

## Seams (keep thin)

- Controller imports **catalog**, never **registry**
- Settings UI, tray, and widget lifecycle call **WorkspaceHost**, not store/manager directly
- Widget content persists via `updateWidgetData` / host helpers; layout via `updateWorkspace` / `updateWidgetState`
- Theme lives on **Workspace**, not Widget data; host applies CSS + native chrome
- `settingsStore` / `widgetManager` = host implementation only
