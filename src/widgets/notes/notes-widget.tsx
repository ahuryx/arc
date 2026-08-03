import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { openUrl } from "@tauri-apps/plugin-opener";
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

function editorMarkdown(editor: Editor): string {
  return (
    editor.storage as unknown as { markdown: { getMarkdown: () => string } }
  ).markdown.getMarkdown();
}

/** First non-empty line of note (markdown markers stripped), else Note N. */
function tabLabel(body: string, index: number): string {
  const line = body
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  if (!line) return `Note ${index + 1}`;
  const cleaned = line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/[*_`~]/g, "")
    .trim();
  const label = cleaned || line;
  return label.length > 18 ? `${label.slice(0, 18)}…` : label;
}

export function NotesWidget() {
  const { data } = useAppState();
  const notes = data.notes;
  const active =
    notes.tabs.find((tab) => tab.id === notes.active) ?? notes.tabs[0];
  const [value, setValue] = useState(active?.body ?? "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "note-link",
        },
      }),
      Placeholder.configure({
        placeholder: "Write a note…",
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: active?.body ?? "",
    editorProps: {
      attributes: {
        class: "note-editor outline-none min-h-full",
        dir: "auto",
      },
      handleClick(_view, _pos, event) {
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest("a");
        const href = anchor?.getAttribute("href");
        if (href) {
          event.preventDefault();
          void openUrl(href);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: next }) => {
      setValue(editorMarkdown(next));
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const md = active?.body ?? "";
    if (md === editorMarkdown(editor)) {
      setValue(md);
      return;
    }
    editor.commands.setContent(md);
    setValue(md);
  }, [active?.id, active?.body, editor]);

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
        <div className="thin-scroll flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {notes.tabs.map((tab, index) => {
            const label =
              tab.id === notes.active
                ? tabLabel(value, index)
                : tabLabel(tab.body, index);
            const activeTab = tab.id === notes.active;
            return (
              <div
                key={tab.id}
                className={cn(
                  "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[11px] transition-colors",
                  activeTab
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <button
                  type="button"
                  className="max-w-[7.5rem] truncate"
                  aria-label={`Open ${label}`}
                  aria-pressed={activeTab}
                  onClick={() => selectTab(tab.id)}
                  title={label}
                >
                  {label}
                </button>
                {notes.tabs.length > 1 ? (
                  <button
                    type="button"
                    className="grid size-3.5 place-items-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
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
      <div
        className="thin-scroll note-markdown min-h-0 flex-1 overflow-auto rounded-md border border-border bg-muted px-2.5 py-2.5 text-[12.5px] leading-relaxed"
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
