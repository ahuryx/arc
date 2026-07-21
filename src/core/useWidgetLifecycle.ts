import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getWorkspace, updateWidgetState } from "./settingsStore";
import { WIDGET_BY_LABEL } from "./widgetRegistry";
import {
  flushWindowPosition,
  noteWindowPosition,
} from "./widgetManager";

const POSITION_FLUSH_MS = 280;

export function useWidgetLifecycle(): void {
  useEffect(() => {
    let win;
    try {
      win = getCurrentWebviewWindow();
    } catch {
      return;
    }

    const widget = WIDGET_BY_LABEL[win.label];
    if (!widget) {
      return;
    }

    let unlistenClose: (() => void) | undefined;
    let unlistenMove: (() => void) | undefined;
    let flushTimer: number | undefined;

    void win
      .onCloseRequested(async (event) => {
        event.preventDefault();
        await win.hide();
        await updateWidgetState(widget.id, { visible: false });
      })
      .then((fn) => {
        unlistenClose = fn;
      });

    // Use event payload — no extra outerPosition IPC per move.
    // Memory-only during drag; one persist after settle (fixes FPS hitch).
    void win
      .onMoved((event) => {
        if (getWorkspace().locked) {
          return;
        }
        noteWindowPosition(widget.id, event.payload.x, event.payload.y);
        if (flushTimer != null) {
          window.clearTimeout(flushTimer);
        }
        flushTimer = window.setTimeout(() => {
          flushTimer = undefined;
          void flushWindowPosition();
        }, POSITION_FLUSH_MS);
      })
      .then((fn) => {
        unlistenMove = fn;
      });

    return () => {
      unlistenClose?.();
      unlistenMove?.();
      if (flushTimer != null) {
        window.clearTimeout(flushTimer);
        void flushWindowPosition();
      }
    };
  }, []);
}
