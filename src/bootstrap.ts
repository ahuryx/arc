import { bootWorkspace } from "./core/workspaceHost";
import { initTray } from "./core/trayController";
import { loadSettings } from "./core/settingsStore";

declare global {
  interface Window {
    __widgetAppBooted?: boolean;
  }
}

export async function bootstrap(): Promise<void> {
  if (window.__widgetAppBooted) {
    return;
  }
  window.__widgetAppBooted = true;

  await loadSettings();

  try {
    await initTray();
  } catch (error) {
    console.error("[bootstrap] initTray failed", error);
  }

  try {
    await bootWorkspace();
  } catch (error) {
    console.error("[bootstrap] bootWorkspace failed", error);
  }
}

void bootstrap().catch((error) => {
  console.error("[bootstrap] fatal", error);
  window.__widgetAppBooted = false;
});
