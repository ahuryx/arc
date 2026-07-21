import React from "react";
import ReactDomClient from "react-dom/client";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { CONTROLLER_LABEL, SETTINGS_LABEL } from "./core/constants";
import "./index.css";

function getCreateRoot() {
  const mod = ReactDomClient as unknown as {
    createRoot?: typeof ReactDomClient.createRoot;
    default?: { createRoot: typeof ReactDomClient.createRoot };
  };
  const createRoot = mod.createRoot ?? mod.default?.createRoot;
  if (!createRoot) {
    throw new Error("react-dom/client createRoot unavailable");
  }
  return createRoot;
}

function windowRole(): "controller" | "settings" | "widget" {
  try {
    const label = getCurrentWebviewWindow().label;
    if (label === CONTROLLER_LABEL) {
      return "controller";
    }
    if (label === SETTINGS_LABEL) {
      return "settings";
    }
  } catch {
    // plain Vite
  }
  const role = new URLSearchParams(window.location.search).get("role");
  if (role === "controller") {
    return "controller";
  }
  if (role === "settings") {
    return "settings";
  }
  return "widget";
}

function showBootError(error: unknown): void {
  const message =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error("[boot]", error);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<pre style="padding:12px;color:#fecaca;white-space:pre-wrap;font:12px/1.4 ui-monospace,monospace">${message.replace(/</g, "&lt;")}</pre>`;
  }
}

function mount(
  importer: () => Promise<{ default: React.ComponentType }>,
): void {
  void importer()
    .then(({ default: App }) => {
      const rootEl = document.getElementById("root");
      if (!rootEl) {
        throw new Error("#root missing");
      }
      getCreateRoot()(rootEl).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
    })
    .catch(showBootError);
}

const role = windowRole();
if (role === "controller") {
  void import("./bootstrap").catch(showBootError);
} else if (role === "settings") {
  mount(() => import("./settings/settings-app"));
} else {
  mount(() => import("./App"));
}
