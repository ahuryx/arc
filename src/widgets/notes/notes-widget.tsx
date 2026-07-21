import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/core/useAppState";
import { updateNotesData } from "@/core/workspaceHost";
import { cn } from "@/lib/utils";

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
    const id = window.setTimeout(() => {
      void updateNotesData({
        ...notes,
        tabs: notes.tabs.map((tab) =>
          tab.id === active.id ? { ...tab, body: value } : tab,
        ),
      });
    }, 400);
    return () => window.clearTimeout(id);
  }, [value, active, notes]);

  function addTab(): void {
    const id = `tab-${Date.now()}`;
    void updateNotesData({
      tabs: [...notes.tabs, { id, body: "" }],
      active: id,
    });
  }

  function removeTab(id: string): void {
    if (notes.tabs.length <= 1) return;
    const tabs = notes.tabs.filter((tab) => tab.id !== id);
    void updateNotesData({
      tabs,
      active: notes.active === id ? tabs[0].id : notes.active,
    });
  }

  return (
    <div className="flex h-full flex-col gap-2 px-2.5 pb-2.5 pt-2">
      <div className="flex items-center gap-1">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {notes.tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={cn("tab", tab.id === notes.active && "active")}
            >
              <button
                type="button"
                aria-label={`Open note ${index + 1}`}
                aria-pressed={tab.id === notes.active}
                onClick={() =>
                  void updateNotesData({ ...notes, active: tab.id })
                }
              >
                {index + 1}
              </button>
              {notes.tabs.length > 1 ? (
                <button
                  type="button"
                  className="tab-close"
                  aria-label={`Close tab ${index + 1}`}
                  onClick={() => removeTab(tab.id)}
                >
                  <X className="size-2.5" />
                </button>
              ) : null}
            </div>
          ))}
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
