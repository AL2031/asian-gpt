import { ChatMessage } from "@/lib/types";
import { SealMark } from "./SealMark";
import { ImageIcon, User } from "lucide-react";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-stamp bg-ink-panel flex items-center justify-center">
            <User size={16} className="text-paper-raised" />
          </div>
        ) : (
          <SealMark size={32} className="stamp-in" />
        )}
      </div>

      <div className={`max-w-[75%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        {message.kind && message.kind !== "text" && (
          <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-ink-soft">
            <ImageIcon size={11} />
            {message.kind === "generated-image" ? "Generated" : "Edited"}
          </span>
        )}

        {message.image && (
          <img
            src={message.image}
            alt={message.kind === "text" ? "Attached image" : message.content || "Image"}
            className="rounded-stamp border border-line max-w-full max-h-96 object-contain bg-paper-raised"
          />
        )}

        {message.content && (
          <div
            className={`rounded-stamp px-4 py-2.5 leading-relaxed whitespace-pre-wrap break-words ${
              isUser
                ? "bg-ink text-paper-raised rounded-tr-sm"
                : "bg-paper-raised border border-line text-ink rounded-tl-sm"
            }`}
          >
            {message.content}
            {message.pending && <span className="cursor-blink">▍</span>}
          </div>
        )}
      </div>
    </div>
  );
}
