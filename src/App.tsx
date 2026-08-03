import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

import { useWidgetLifecycle } from '@/core/useWidgetLifecycle';
import { WIDGET_BY_LABEL } from '@/core/widgetRegistry';
import { WidgetShell } from '@/shell/widget-shell';

function readWindowLabel(): string {
  const fromQuery = new URLSearchParams(window.location.search).get('label');
  if (fromQuery) return fromQuery;

  try {
    return getCurrentWebviewWindow().label;
  } catch {
    return '';
  }
}

function App() {
  const label = readWindowLabel();
  useWidgetLifecycle();

  if (!label) {
    return (
      <div className="p-4 text-sm text-red-300">
        Tauri window API unavailable in this context.
      </div>
    );
  }

  const widget = WIDGET_BY_LABEL[label];

  if (!widget) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Unknown widget window: {label}
      </div>
    );
  }

  const WidgetComponent = widget.component;

  return (
    <WidgetShell title={widget.title} widgetId={widget.id}>
      <WidgetComponent />
    </WidgetShell>
  );
}

export default App;
