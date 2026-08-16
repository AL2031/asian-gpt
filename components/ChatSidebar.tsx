"use client";

import { SealMark } from "./SealMark";
import { PenSquare } from "lucide-react";

interface ChatSidebarProps {
  onNewChat: () => void;
  historyTitles: string[];
  open: boolean;
}

export function ChatSidebar({ onNewChat, historyTitles, open }: ChatSidebarProps) {
  return (
    <aside
      className={`ink-panel flex h-full flex-col bg-ink-panel text-paper-raised transition-all duration-200 ${
        open ? "w-64" : "w-0 overflow-hidden"
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <SealMark size={30} />
        <span className="font-display text-lg font-semibold tracking-tight">AsianGPT</span>
      </div>

      <div className="px-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-stamp border border-line-dark px-3 py-2 text-sm text-paper-raised/90 hover:bg-white/5"
        >
          <PenSquare size={15} />
          New chat
        </button>
      </div>

      <div className="scroll-thin mt-4 flex-1 overflow-y-auto px-3">
        <p className="px-1 pb-1.5 text-[11px] uppercase tracking-wide text-paper-raised/40">
          This session
        </p>
        <ul className="flex flex-col gap-0.5">
          {historyTitles.map((title, i) => (
            <li
              key={i}
              className="truncate rounded-stamp px-2.5 py-1.5 text-sm text-paper-raised/75 hover:bg-white/5"
            >
              {title}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-line-dark px-4 py-3 text-[11px] text-paper-raised/40">
        Chat via Groq · Images via Hugging Face
      </div>
    </aside>
  );
}
