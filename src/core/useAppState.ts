import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

import type { AppState, WidgetData, WorkspaceSettings } from './types';

import { getState, loadSettings } from './settingsStore';
import { applyTheme, watchSystemTheme } from './theme';
import { APP_STATE_CHANGED_EVENT } from './types';

export function useAppState(): {
  state: AppState;
  workspace: WorkspaceSettings;
  data: WidgetData;
  ready: boolean;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<AppState>(() => getState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    applyTheme(state.workspace.theme);
  }, [state.workspace.theme]);

  useEffect(() => {
    if (state.workspace.theme !== 'system') return;
    return watchSystemTheme(() => {
      applyTheme('system');
    });
  }, [state.workspace.theme]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    const onLocal = (event: Event) => {
      const { detail } = event as CustomEvent<AppState>;
      setState(detail);
      setReady(true);
    };

    window.addEventListener(APP_STATE_CHANGED_EVENT, onLocal);

    void loadSettings()
      .then((next) => {
        if (cancelled) return;
        setState(next);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setReady(true);
      });

    void listen<AppState>(APP_STATE_CHANGED_EVENT, (event) => {
      setState(event.payload);
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
      setReady(true);
    },
  };
}
