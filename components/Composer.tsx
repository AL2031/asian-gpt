"use client";

import { ChangeEvent, KeyboardEvent, useRef } from "react";
import { Paperclip, Sparkles, X, ArrowUp, Eye, Wand2 } from "lucide-react";

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  mode: "chat" | "generate";
  onModeChange: (m: "chat" | "generate") => void;
  attachedImage: string | null;
  onAttachImage: (dataUrl: string) => void;
  onRemoveImage: () => void;
  attachMode: "ask" | "edit";
  onAttachModeChange: (m: "ask" | "edit") => void;
  onSend: () => void;
  busy: boolean;
}

export function Composer({
  value,
  onChange,
  mode,
  onModeChange,
  attachedImage,
  onAttachImage,
  onRemoveImage,
  attachMode,
  onAttachModeChange,
  onSend,
  busy,
}: ComposerProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAttachImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && value.trim()) onSend();
    }
  }

  const placeholder = attachedImage
    ? attachMode === "edit"
      ? "Describe how to edit this image..."
      : "Ask something about this image..."
    : mode === "generate"
    ? "Describe the image to generate..."
    : "Message AsianGPT...";

  return (
    <div className="border-t border-line bg-paper px-4 pb-4 pt-3 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {attachedImage && (
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <img
                src={attachedImage}
                alt="Attached"
                className="h-16 w-16 rounded-stamp border border-line object-cover"
              />
              <button
                onClick={onRemoveImage}
                aria-label="Remove attached image"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-paper-raised"
              >
                <X size={12} />
              </button>
            </div>

            <div className="flex overflow-hidden rounded-stamp border border-line">
              <button
                onClick={() => onAttachModeChange("ask")}
                aria-pressed={attachMode === "ask"}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  attachMode === "ask"
                    ? "bg-ink text-paper-raised"
                    : "bg-paper-raised text-ink-soft hover:text-ink"
                }`}
              >
                <Eye size={13} />
                Ask about it
              </button>
              <button
                onClick={() => onAttachModeChange("edit")}
                aria-pressed={attachMode === "edit"}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  attachMode === "edit"
                    ? "bg-ink text-paper-raised"
                    : "bg-paper-raised text-ink-soft hover:text-ink"
                }`}
              >
                <Wand2 size={13} />
                Edit it
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-stamp border border-line bg-paper-raised px-3 py-2 focus-within:ring-2 focus-within:ring-seal/40">
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Attach an image"
            title="Attach an image to ask about or edit"
            className="mb-1 shrink-0 rounded-stamp p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
          >
            <Paperclip size={18} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-soft focus:outline-none"
            style={{ minHeight: "28px" }}
          />

          <button
            onClick={() => onModeChange(mode === "generate" ? "chat" : "generate")}
            disabled={!!attachedImage}
            aria-pressed={mode === "generate"}
            title="Generate an image instead of chatting"
            className={`mb-1 flex shrink-0 items-center gap-1 rounded-stamp px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              mode === "generate"
                ? "bg-jade text-paper-raised"
                : "text-ink-soft hover:bg-paper hover:text-ink"
            }`}
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Generate</span>
          </button>

          <button
            onClick={onSend}
            disabled={busy || !value.trim()}
            aria-label="Send message"
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-stamp bg-seal text-paper-raised transition-transform hover:enabled:scale-105 disabled:opacity-40"
          >
            <ArrowUp size={16} />
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-ink-soft">
          AsianGPT can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
