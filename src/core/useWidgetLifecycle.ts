import { useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { WIDGET_BY_LABEL } from "./widgetRegistry";
import {
  flushWidgetPosition,
  getWorkspaceSnapshot,
  noteWidgetPosition,
  setWidgetVisibility,
} from "./workspaceHost";

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
        await setWidgetVisibility(widget.id, false);
      })
      .then((fn) => {
        unlistenClose = fn;
      });

    // Event payload only — no outerPosition IPC per move.
    // Memory during drag; one persist after settle.
    void win
      .onMoved((event) => {
        if (getWorkspaceSnapshot().locked) {
          return;
        }
        noteWidgetPosition(widget.id, event.payload.x, event.payload.y);
        if (flushTimer != null) {
          window.clearTimeout(flushTimer);
        }
        flushTimer = window.setTimeout(() => {
          flushTimer = undefined;
          void flushWidgetPosition();
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
        void flushWidgetPosition();
      }
    };
  }, []);
}
