import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/core/useAppState";
import { updateNoteTabBody, updateNotesData } from "@/core/workspaceHost";
import type { NotesData } from "@/core/types";
import { cn } from "@/lib/utils";

function withDirtyBody(
  tabs: NotesData["tabs"],
  tabId: string | undefined,
  body: string,
): NotesData["tabs"] {
  if (!tabId) return tabs;
  return tabs.map((tab) =>
    tab.id === tabId && tab.body !== body ? { ...tab, body } : tab,
  );
}

/** First non-empty line of note, else Note N. */
function tabLabel(body: string, index: number): string {
  const line = body
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  if (!line) return `Note ${index + 1}`;
  return line.length > 18 ? `${line.slice(0, 18)}…` : line;
}

export function NotesWidget() {
  const { data } = useAppState();
  const notes = data.notes;
  const active =
    notes.tabs.find((tab) => tab.id === notes.active) ?? notes.tabs[0];
  const [value, setValue] = useState(active?.body ?? "");

  useEffect(() => {
    setValue(active?.body ?? "");
  }, [active?.id, active?.body]);

  useEffect(() => {
    if (!active || value === active.body) return;
    const tabId = active.id;
    const id = window.setTimeout(() => {
      void updateNoteTabBody(tabId, value);
    }, 400);
    return () => window.clearTimeout(id);
  }, [value, active?.id, active?.body]);

  function selectTab(nextId: string): void {
    if (nextId === notes.active) return;
    void updateNotesData({
      tabs: withDirtyBody(notes.tabs, active?.id, value),
      active: nextId,
    });
  }

  function addTab(): void {
    const id = `tab-${Date.now()}`;
    void updateNotesData({
      tabs: [
        ...withDirtyBody(notes.tabs, active?.id, value),
        { id, body: "" },
      ],
      active: id,
    });
  }

  function removeTab(id: string): void {
    if (notes.tabs.length <= 1) return;
    const tabs = withDirtyBody(notes.tabs, active?.id, value).filter(
      (tab) => tab.id !== id,
    );
    void updateNotesData({
      tabs,
      active: notes.active === id ? tabs[0].id : notes.active,
    });
  }

  return (
    <div className="flex h-full flex-col gap-2 px-2.5 pb-2.5 pt-2">
      <div className="flex items-center gap-1">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {notes.tabs.map((tab, index) => {
            const label =
              tab.id === notes.active
                ? tabLabel(value, index)
                : tabLabel(tab.body, index);
            return (
              <div
                key={tab.id}
                className={cn("tab", tab.id === notes.active && "active")}
              >
                <button
                  type="button"
                  className="max-w-[7.5rem] truncate"
                  aria-label={`Open ${label}`}
                  aria-pressed={tab.id === notes.active}
                  onClick={() => selectTab(tab.id)}
                  title={label}
                >
                  {label}
                </button>
                {notes.tabs.length > 1 ? (
                  <button
                    type="button"
                    className="tab-close"
                    aria-label={`Close ${label}`}
                    onClick={() => removeTab(tab.id)}
                  >
                    <X className="size-2.5" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label="Add tab"
          onClick={addTab}
        >
          <Plus />
        </Button>
      </div>
      <textarea
        className="editor"
        placeholder="Write a note…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        dir="auto"
      />
    </div>
  );
}
