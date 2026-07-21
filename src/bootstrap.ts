import {
  applyFirstRunDefaults,
  setKeepOnTopSetting,
} from "./core/workspaceHost";
import { loadSettings, getWorkspace } from "./core/settingsStore";
import {
  applyVisibilityFromSettings,
  applyWindowFlags,
  ensureAllWindows,
} from "./core/widgetManager";
import { initTray } from "./core/trayController";

export async function bootstrap(): Promise<void> {
  await loadSettings();

  try {
    await initTray();
  } catch (error) {
    console.error("[bootstrap] initTray failed", error);
  }

  try {
    await applyFirstRunDefaults();
  } catch (error) {
    console.error("[bootstrap] applyFirstRunDefaults failed", error);
  }

  try {
    await ensureAllWindows();
    await applyVisibilityFromSettings();
    await applyWindowFlags();

    if (getWorkspace().keepOnTop) {
      await setKeepOnTopSetting(true);
    }
  } catch (error) {
    console.error("[bootstrap] window setup failed", error);
  }
}

void bootstrap().catch((error) => {
  console.error("[bootstrap] fatal", error);
});
