import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useId, useState } from "react";
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
import { applyTheme } from "@/core/theme";
import { useAppState } from "@/core/useAppState";
import { WIDGET_CATALOG } from "@/core/widgetCatalog";
import {
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
  setWeatherCity,
  setWidgetSide,
  setWidgetVisibility,
} from "@/core/workspaceHost";

export default function SettingsApp() {
  const { workspace, data, ready } = useAppState();
  const [cityDraft, setCityDraft] = useState(data.weather.city);
  const [pomoDraft, setPomoDraft] = useState(data.pomodoro);
  const [cityMsg, setCityMsg] = useState("");
  const [savingCity, setSavingCity] = useState(false);
  const [savingPomo, setSavingPomo] = useState(false);
  const edgeGapId = useId();
  const widgetGapId = useId();
  const cityId = useId();

  useEffect(() => {
    setCityDraft(data.weather.city);
  }, [data.weather.city]);

  useEffect(() => {
    setPomoDraft(data.pomodoro);
  }, [data.pomodoro]);

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
            onClick={() => void getCurrentWebviewWindow().hide()}
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
                value={workspace.theme ?? "dark"}
                onValueChange={(value) => {
                  if (value === "light" || value === "dark") {
                    applyTheme(value);
                    void setTheme(value);
                  }
                }}
                aria-label="Theme"
              >
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
                    value={state.side}
                    onValueChange={(value) => {
                      if (value === "left" || value === "right") {
                        void setWidgetSide(widget.id, value);
                      }
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
                value={workspace.edgeGap}
                onValueChange={(next) =>
                  void setArrangeGaps(next, workspace.widgetGap)
                }
              />
            </SettingsRow>
            <SettingsRow label="Gap between widgets (px)" htmlFor={widgetGapId}>
              <NumberInput
                id={widgetGapId}
                min={0}
                max={48}
                className="w-[84px]"
                value={workspace.widgetGap}
                onValueChange={(next) =>
                  void setArrangeGaps(workspace.edgeGap, next)
                }
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
                  setSavingCity(true);
                  void setWeatherCity(cityDraft).finally(() => {
                    setSavingCity(false);
                    setCityMsg(`Updated → ${cityDraft.trim() || "—"}`);
                  });
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
                      max={180}
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
            <SettingsRow label="Quit Glass Widgets">
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
