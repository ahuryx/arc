import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-section";
import { SettingsSkeleton } from "@/components/settings/settings-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppState } from "@/core/useAppState";
import { WIDGET_CATALOG } from "@/core/widgetCatalog";
import {
  closeSettings,
  quitApp,
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

const GAP_COMMIT_MS = 250;

export default function SettingsApp() {
  const { workspace, data, ready } = useAppState();
  const [cityDraft, setCityDraft] = useState(data.weather.city);
  const [pomoDraft, setPomoDraft] = useState(data.pomodoro);
  const [edgeDraft, setEdgeDraft] = useState(workspace.edgeGap);
  const [widgetGapDraft, setWidgetGapDraft] = useState(workspace.widgetGap);
  const [cityMsg, setCityMsg] = useState("");
  const [savingCity, setSavingCity] = useState(false);
  const [savingPomo, setSavingPomo] = useState(false);
  const edgeGapId = useId();
  const widgetGapId = useId();
  const cityId = useId();
  const gapTimer = useRef<number | undefined>(undefined);
  const edgeRef = useRef(edgeDraft);
  const widgetGapRef = useRef(widgetGapDraft);

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
    <div className="card">
      <header className="wh" data-tauri-drag-region>
        <span className="wh-title">Settings</span>
        <div className="wh-actions" data-no-drag>
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
        <div className="wb wb-scroll">
          <SettingsSkeleton />
        </div>
      ) : (
        <div className="wb wb-scroll flex flex-col gap-3 px-4 py-3">
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
            <SettingsRow label="Shamsi calendar">
              <Toggle
                checked={data.calendar.mode === "jalali"}
                onCheckedChange={(checked) =>
                  void setCalendarMode(checked ? "jalali" : "gregorian")
                }
                aria-label="Enable Shamsi calendar"
              />
            </SettingsRow>
            <SettingsRow label="Clock format">
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
            {data.calendar.mode === "jalali" ? (
              <p className="fa text-[11px] text-muted-foreground" dir="rtl">
                تاریخ شمسی با فونت وزیرمتن در ویجت ساعت و تقویم نمایش داده می‌شود.
              </p>
            ) : null}
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
                      // Radix allows clear — ignore empty so side never blanks.
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
                onCheckedChange={(checked) => void setAutoArrange(checked)}
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
                onCheckedChange={(checked) => void setKeepOnTopSetting(checked)}
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
            <SettingsRow label="Gap between widgets (px)" htmlFor={widgetGapId}>
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

          <SettingsSection title="General">
            <SettingsRow label="Start with Windows">
              <Toggle
                checked={workspace.startWithWindows}
                onCheckedChange={(checked) => void setAutostart(checked)}
                aria-label="Start with Windows"
              />
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
        </div>
      )}
    </div>
  );
}
