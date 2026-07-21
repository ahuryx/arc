import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { applyTheme } from "./theme";
import { getState, loadSettings } from "./settingsStore";
import {
  APP_STATE_CHANGED_EVENT,
  type AppState,
  type WidgetData,
  type WorkspaceSettings,
} from "./types";

export function useAppState(): {
  state: AppState;
  workspace: WorkspaceSettings;
  data: WidgetData;
  ready: boolean;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<AppState>(getState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    applyTheme(state.workspace.theme ?? "dark");
  }, [state.workspace.theme]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    const onLocal = (event: Event) => {
      const detail = (event as CustomEvent<AppState>).detail;
      if (!detail) return;
      setState(detail);
      applyTheme(detail.workspace.theme ?? "dark");
      setReady(true);
    };
    window.addEventListener(APP_STATE_CHANGED_EVENT, onLocal);

    void loadSettings()
      .then((next) => {
        if (cancelled) return;
        setState(next);
        applyTheme(next.workspace.theme ?? "dark");
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        applyTheme(getState().workspace.theme ?? "dark");
        setReady(true);
      });

    void listen<AppState>(APP_STATE_CHANGED_EVENT, (event) => {
      setState(event.payload);
      applyTheme(event.payload.workspace.theme ?? "dark");
      setReady(true);
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {
        /* no event bus outside Tauri */
      });

    return () => {
      cancelled = true;
      unlisten?.();
      window.removeEventListener(APP_STATE_CHANGED_EVENT, onLocal);
    };
  }, []);

  return {
    state,
    workspace: state.workspace,
    data: state.data,
    ready,
    refresh: async () => {
      const next = await loadSettings();
      setState(next);
      applyTheme(next.workspace.theme ?? "dark");
      setReady(true);
    },
  };
}

/** @deprecated use useAppState */
export function useAppSettings() {
  const { state, refresh } = useAppState();
  return { settings: state, refresh };
}
