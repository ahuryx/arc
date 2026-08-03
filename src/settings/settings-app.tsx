import { useEffect, useId, useRef, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { X } from "lucide-react";
import {
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-section";
import { CryptoSettingsPanel } from "@/components/settings/crypto-settings-panel";
import { SettingsSkeleton } from "@/components/settings/settings-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppState } from "@/core/useAppState";
import { WIDGET_CATALOG } from "@/core/widgetCatalog";
import {
  SETTINGS_FOCUS_TAB_EVENT,
  SETTINGS_TABS,
  parseSettingsTab,
  type SettingsTabId,
} from "@/core/settingsNav";
import {
  closeSettings,
  quitApp,
  resetToDefaults,
  runAutoArrange,
  setArrangeGaps,
  setAutoArrange,
  setAutostart,
  setCalendarMode,
  setKeepOnTopSetting,
  setLocked,
  setPomodoroDurations,
  setTheme,
  setTimeFormat,
  setWeatherCity,
  setWidgetSide,
  setWidgetVisibility,
} from "@/core/workspaceHost";
import { cn } from "@/lib/utils";

const GAP_COMMIT_MS = 250;
const GITHUB_URL = "https://github.com/ahuryx/arc";
const AHURYX_URL = "https://ahuryx.com";

function initialTab(): SettingsTabId {
  return (
    parseSettingsTab(new URLSearchParams(window.location.search).get("tab")) ??
    "general"
  );
}

export default function SettingsApp() {
  const { workspace, data, ready } = useAppState();
  const [tab, setTab] = useState<SettingsTabId>(initialTab);
  const [cityDraft, setCityDraft] = useState(data.weather.city);
  const [pomoDraft, setPomoDraft] = useState(data.pomodoro);
  const [edgeDraft, setEdgeDraft] = useState(workspace.edgeGap);
  const [widgetGapDraft, setWidgetGapDraft] = useState(workspace.widgetGap);
  const [cityMsg, setCityMsg] = useState("");
  const [savingCity, setSavingCity] = useState(false);
  const [savingPomo, setSavingPomo] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const edgeGapId = useId();
  const widgetGapId = useId();
  const cityId = useId();
  const gapTimer = useRef<number | undefined>(undefined);
  const edgeRef = useRef(edgeDraft);
  const widgetGapRef = useRef(widgetGapDraft);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listen<{ tab: string }>(SETTINGS_FOCUS_TAB_EVENT, (event) => {
      const next = parseSettingsTab(event.payload.tab);
      if (next) setTab(next);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, []);

  useEffect(() => {
    setCityDraft(data.weather.city);
  }, [data.weather.city]);

  useEffect(() => {
    setPomoDraft(data.pomodoro);
  }, [data.pomodoro]);

  useEffect(() => {
    setEdgeDraft(workspace.edgeGap);
    edgeRef.current = workspace.edgeGap;
  }, [workspace.edgeGap]);

  useEffect(() => {
    setWidgetGapDraft(workspace.widgetGap);
    widgetGapRef.current = workspace.widgetGap;
  }, [workspace.widgetGap]);

  useEffect(() => {
    return () => {
      if (gapTimer.current != null) window.clearTimeout(gapTimer.current);
    };
  }, []);

  function scheduleGaps(edge: number, widgetGap: number): void {
    edgeRef.current = edge;
    widgetGapRef.current = widgetGap;
    if (gapTimer.current != null) window.clearTimeout(gapTimer.current);
    gapTimer.current = window.setTimeout(() => {
      gapTimer.current = undefined;
      void setArrangeGaps(edgeRef.current, widgetGapRef.current);
    }, GAP_COMMIT_MS);
  }

  return (
    <div className="relative flex size-full flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
      <header
        className="flex h-8 shrink-0 items-center justify-between border-b border-border px-2.5 pe-1.5"
        data-tauri-drag-region
      >
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Settings
        </span>
        <div className="flex items-center gap-0.5" data-no-drag>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground"
            title="Close"
            aria-label="Close"
            onClick={() => void closeSettings()}
          >
            <X className="size-3" />
          </Button>
        </div>
      </header>

      {!ready ? (
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <SettingsSkeleton />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <nav
            className="flex w-30 shrink-0 flex-col gap-0.5 overflow-y-auto border-e border-border bg-muted/30 p-1.5"
            aria-label="Settings sections"
          >
            {SETTINGS_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "rounded-md px-2 py-1.5 text-start text-[12px] transition-colors",
                  tab === item.id
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
                aria-current={tab === item.id ? "page" : undefined}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto px-4 py-3">
            {tab === "general" ? (
              <>
                <SettingsSection title="Appearance">
                  <SettingsRow label="Theme">
                    <ToggleGroup
                      type="single"
                      size="sm"
                      value={workspace.theme}
                      onValueChange={(value) => {
                        if (
                          value === "light" ||
                          value === "dark" ||
                          value === "system"
                        ) {
                          void setTheme(value);
                        }
                      }}
                      aria-label="Theme"
                    >
                      <ToggleGroupItem value="system">System</ToggleGroupItem>
                      <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
                      <ToggleGroupItem value="light">Light</ToggleGroupItem>
                    </ToggleGroup>
                  </SettingsRow>
                </SettingsSection>

                <SettingsSection title="Widgets — show & side">
                  {WIDGET_CATALOG.map((widget) => {
                    const state = workspace.widgets[widget.id];
                    return (
                      <SettingsRow key={widget.id} label={widget.title}>
                        <ToggleGroup
                          type="single"
                          size="sm"
                          value={state.side ?? "left"}
                          onValueChange={(value) => {
                            if (value !== "left" && value !== "right") return;
                            if (value === state.side) return;
                            void setWidgetSide(widget.id, value);
                          }}
                          aria-label={`${widget.title} side`}
                        >
                          <ToggleGroupItem value="left" aria-label="Left">
                            Left
                          </ToggleGroupItem>
                          <ToggleGroupItem value="right" aria-label="Right">
                            Right
                          </ToggleGroupItem>
                        </ToggleGroup>
                        <Toggle
                          checked={state.visible}
                          onCheckedChange={(checked) =>
                            void setWidgetVisibility(widget.id, checked)
                          }
                          aria-label={`Show ${widget.title}`}
                        />
                      </SettingsRow>
                    );
                  })}
                </SettingsSection>

                <SettingsSection title="Layout">
                  <SettingsRow label="Auto-arrange">
                    <Toggle
                      checked={workspace.autoArrange}
                      onCheckedChange={(checked) =>
                        void setAutoArrange(checked)
                      }
                      aria-label="Auto-arrange"
                    />
                  </SettingsRow>
                  <SettingsRow label="Lock widgets in place">
                    <Toggle
                      checked={workspace.locked}
                      onCheckedChange={(checked) => void setLocked(checked)}
                      aria-label="Lock widgets in place"
                    />
                  </SettingsRow>
                  <SettingsRow label="Keep widgets on top">
                    <Toggle
                      checked={workspace.keepOnTop}
                      onCheckedChange={(checked) =>
                        void setKeepOnTopSetting(checked)
                      }
                      aria-label="Keep widgets on top"
                    />
                  </SettingsRow>
                  <SettingsRow label="Edge gap (px)" htmlFor={edgeGapId}>
                    <NumberInput
                      id={edgeGapId}
                      min={0}
                      max={80}
                      className="w-[84px]"
                      value={edgeDraft}
                      onValueChange={(next) => {
                        setEdgeDraft(next);
                        scheduleGaps(next, widgetGapRef.current);
                      }}
                    />
                  </SettingsRow>
                  <SettingsRow
                    label="Gap between widgets (px)"
                    htmlFor={widgetGapId}
                  >
                    <NumberInput
                      id={widgetGapId}
                      min={0}
                      max={48}
                      className="w-[84px]"
                      value={widgetGapDraft}
                      onValueChange={(next) => {
                        setWidgetGapDraft(next);
                        scheduleGaps(edgeRef.current, next);
                      }}
                    />
                  </SettingsRow>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-1 w-full"
                    onClick={() => void runAutoArrange()}
                  >
                    Auto-arrange now
                  </Button>
                </SettingsSection>

                <SettingsSection title="App">
                  <SettingsRow label="Launch at startup">
                    <Toggle
                      checked={workspace.startWithWindows}
                      onCheckedChange={(checked) => void setAutostart(checked)}
                      aria-label="Launch at startup"
                    />
                  </SettingsRow>
                  <SettingsRow label="Reset to defaults">
                    <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={resetting}
                        >
                          Reset
                        </Button>
                      </DialogTrigger>
                      <DialogContent showCloseButton={false}>
                        <DialogHeader>
                          <DialogTitle>Reset to defaults?</DialogTitle>
                          <DialogDescription>
                            Widget layout, crypto list, and other prefs will be
                            restored to first-run defaults.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={resetting}
                            onClick={() => setResetOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={resetting}
                            onClick={() => {
                              setResetting(true);
                              void resetToDefaults()
                                .then(() => setResetOpen(false))
                                .finally(() => setResetting(false));
                            }}
                          >
                            {resetting ? "Resetting…" : "Reset"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </SettingsRow>
                  <SettingsRow label="Quit">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void quitApp()}
                    >
                      Quit
                    </Button>
                  </SettingsRow>
                </SettingsSection>
              </>
            ) : null}

            {tab === "clock" ? (
              <SettingsSection title="Clock">
                <SettingsRow label="Time format">
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={data.clock?.timeFormat === "12" ? "12" : "24"}
                    onValueChange={(value) => {
                      if (value === "12" || value === "24") {
                        void setTimeFormat(value);
                      }
                    }}
                    aria-label="Clock format"
                  >
                    <ToggleGroupItem value="12">12h</ToggleGroupItem>
                    <ToggleGroupItem value="24">24h</ToggleGroupItem>
                  </ToggleGroup>
                </SettingsRow>
              </SettingsSection>
            ) : null}

            {tab === "calendar" ? (
              <SettingsSection title="Calendar">
                <SettingsRow label="Shamsi calendar">
                  <Toggle
                    checked={data.calendar.mode === "jalali"}
                    onCheckedChange={(checked) =>
                      void setCalendarMode(checked ? "jalali" : "gregorian")
                    }
                    aria-label="Enable Shamsi calendar"
                  />
                </SettingsRow>
                {data.calendar.mode === "jalali" ? (
                  <p
                    className="font-fa text-[11px] text-muted-foreground"
                    dir="rtl"
                  >
                    تاریخ شمسی با فونت وزیرمتن در ویجت ساعت و تقویم نمایش داده
                    می‌شود.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Uses Gregorian dates by default. Shamsi also updates the
                    clock widget date line.
                  </p>
                )}
              </SettingsSection>
            ) : null}

            {tab === "crypto" ? <CryptoSettingsPanel value={data.crypto} /> : null}

            {tab === "weather" ? (
              <SettingsSection title="Weather location">
                <div className="flex gap-2">
                  <Input
                    id={cityId}
                    className="h-8 flex-1"
                    placeholder="City name…"
                    value={cityDraft}
                    onChange={(event) => setCityDraft(event.target.value)}
                    aria-label="Weather city"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingCity}
                    onClick={() => {
                      const trimmed = cityDraft.trim();
                      if (!trimmed) {
                        setCityMsg("Enter a city name");
                        return;
                      }
                      setSavingCity(true);
                      void setWeatherCity(trimmed)
                        .then(() => setCityMsg(`Updated → ${trimmed}`))
                        .catch(() => setCityMsg("Could not save city"))
                        .finally(() => setSavingCity(false));
                    }}
                  >
                    {savingCity ? "Saving…" : "Update"}
                  </Button>
                </div>
                {cityMsg ? (
                  <p className="text-[11px] text-muted-foreground" role="status">
                    {cityMsg}
                  </p>
                ) : null}
              </SettingsSection>
            ) : null}

            {tab === "notes" ? (
              <SettingsSection title="Notes">
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  Write notes in the Notes widget. Markdown formats as you type —
                  headings, lists, links, bold, and code.
                </p>
              </SettingsSection>
            ) : null}

            {tab === "pomodoro" ? (
              <SettingsSection title="Pomodoro (minutes)">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["work", "Focus"],
                      ["short", "Short"],
                      ["long", "Long"],
                    ] as const
                  ).map(([key, label]) => {
                    const fieldId = `${key}-duration`;
                    return (
                      <div key={key} className="flex flex-col gap-1.5">
                        <Label
                          htmlFor={fieldId}
                          className="text-[11px] text-muted-foreground"
                        >
                          {label}
                        </Label>
                        <NumberInput
                          id={fieldId}
                          min={1}
                          max={key === "work" ? 120 : 60}
                          className="w-full"
                          value={pomoDraft[key]}
                          onValueChange={(next) =>
                            setPomoDraft((prev) => ({ ...prev, [key]: next }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-1 w-full"
                  disabled={savingPomo}
                  onClick={() => {
                    setSavingPomo(true);
                    void setPomodoroDurations(pomoDraft).finally(() =>
                      setSavingPomo(false),
                    );
                  }}
                >
                  {savingPomo ? "Saving…" : "Save durations"}
                </Button>
              </SettingsSection>
            ) : null}

            {tab === "about" ? (
              <AboutPanel />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function AboutPanel() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    void getVersion()
      .then(setVersion)
      .catch(() => setVersion(null));
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 px-2 py-6 text-center">
      <img
        src="/logo.png"
        alt="Arc"
        width={96}
        height={96}
        className="h-auto w-full max-w-24"
      />
      <div className="flex flex-col items-center gap-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Arc
        </h2>
        <p className="text-[12px] text-muted-foreground">
          {version ? `v${version}` : "…"} · Beta
        </p>
        <p className="max-w-[18rem] text-[12.5px] leading-relaxed text-muted-foreground">
          Tray-hosted desktop widgets — clock, calendar, weather, crypto,
          notes, and pomodoro — with a clean modern chrome. Pre-release
          software; expect rough edges.
        </p>
      </div>
      <p className="text-[12px] text-foreground/80">
        Developed by{" "}
        <button
          type="button"
          className="font-medium text-foreground underline-offset-2 hover:underline"
          onClick={() => void openUrl(AHURYX_URL)}
        >
          Ahuryx Team
        </button>
      </p>
      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          className="text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => void openUrl(GITHUB_URL)}
        >
          github.com/ahuryx/arc
        </button>
        <button
          type="button"
          className="text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => void openUrl(AHURYX_URL)}
        >
          ahuryx.com
        </button>
      </div>
    </div>
  );
}
