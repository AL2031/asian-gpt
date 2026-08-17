"use client";

import { useRef, useState } from "react";
import { Menu } from "lucide-react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Composer } from "@/components/Composer";
import { MessageBubble } from "@/components/MessageBubble";
import { SealMark } from "@/components/SealMark";
import { ChatMessage } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function errorMessage(data: { error?: string; detail?: string }, fallback: string) {
  const base = data.error || fallback;
  return data.detail ? `${base}: ${data.detail}` : base;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"chat" | "generate">("chat");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachMode, setAttachMode] = useState<"ask" | "edit">("ask");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function pushMessage(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
  }

  function updateMessage(id: string, patch: Partial<ChatMessage>) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");
    setBusy(true);

    if (attachedImage) {
      if (attachMode === "edit") {
        await handleEditImage(text, attachedImage);
      } else {
        await handleChat(text, attachedImage);
      }
      setAttachedImage(null);
    } else if (mode === "generate") {
      await handleGenerateImage(text);
    } else {
      await handleChat(text);
    }

    setBusy(false);
  }

  /** Handles both plain text chat and "look at this image" requests - Groq
   *  switches to a vision-capable model automatically when an image is present. */
  async function handleChat(text: string, image?: string) {
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, kind: "text", image };
    const history = [...messages, userMsg];
    pushMessage(userMsg);

    const assistantId = uid();
    pushMessage({ id: assistantId, role: "assistant", content: "", kind: "text", pending: true });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content, image: m.image })),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(errorMessage(data, `Chat request failed (${res.status})`));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text2 = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              text2 += delta;
              updateMessage(assistantId, { content: text2, pending: true });
              scrollToBottom();
            }
          } catch {
            // ignore partial/malformed chunks
          }
        }
      }

      updateMessage(assistantId, { content: text2 || "(No response)", pending: false });
    } catch (err) {
      updateMessage(assistantId, {
        content: "Something went wrong reaching the model.",
        pending: false,
      });
      setError(err instanceof Error ? err.message : "Chat failed");
    }
  }

  async function handleGenerateImage(prompt: string) {
    const userMsg: ChatMessage = { id: uid(), role: "user", content: prompt, kind: "text" };
    pushMessage(userMsg);

    const assistantId = uid();
    pushMessage({
      id: assistantId,
      role: "assistant",
      content: "Generating image...",
      kind: "generated-image",
      pending: true,
    });

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(errorMessage(data, `Image generation failed (${res.status})`));

      updateMessage(assistantId, { content: prompt, image: data.image, pending: false });
    } catch (err) {
      updateMessage(assistantId, { content: "Couldn't generate that image.", pending: false });
      setError(err instanceof Error ? err.message : "Image generation failed");
    }
    scrollToBottom();
  }

  async function handleEditImage(prompt: string, sourceImage: string) {
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: prompt,
      image: sourceImage,
      kind: "text",
    };
    pushMessage(userMsg);

    const assistantId = uid();
    pushMessage({
      id: assistantId,
      role: "assistant",
      content: "Editing image...",
      kind: "edited-image",
      pending: true,
    });

    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, image: sourceImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(errorMessage(data, `Image edit failed (${res.status})`));

      updateMessage(assistantId, { content: prompt, image: data.image, pending: false });
    } catch (err) {
      updateMessage(assistantId, { content: "Couldn't edit that image.", pending: false });
      setError(err instanceof Error ? err.message : "Image edit failed");
    }
    scrollToBottom();
  }

  function handleNewChat() {
    setMessages([]);
    setInput("");
    setAttachedImage(null);
    setAttachMode("ask");
    setMode("chat");
    setError(null);
  }

  const historyTitles = messages
    .filter((m) => m.role === "user")
    .slice(0, 20)
    .map((m) => m.content || "Image");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-paper">
      <ChatSidebar onNewChat={handleNewChat} historyTitles={historyTitles} open={sidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            className="rounded-stamp p-1.5 text-ink-soft hover:bg-paper-raised hover:text-ink"
          >
            <Menu size={18} />
          </button>
          <span className="font-display text-sm font-semibold text-ink-soft">
            {mode === "generate" && !attachedImage ? "Image generation" : "Chat"}
          </span>
        </header>

        <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
                <SealMark size={44} />
                <h1 className="font-display text-2xl font-semibold text-ink">AsianGPT</h1>
                <p className="max-w-sm text-sm text-ink-soft">
                  Chat, generate images, or attach a photo to ask about it or edit it - all in one place.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-auto mb-1 w-full max-w-3xl px-4 sm:px-8">
            <p className="rounded-stamp border border-seal/30 bg-seal/10 px-3 py-2 text-xs text-seal-dark">
              {error}
            </p>
          </div>
        )}

        <Composer
          value={input}
          onChange={setInput}
          mode={mode}
          onModeChange={setMode}
          attachedImage={attachedImage}
          onAttachImage={setAttachedImage}
          onRemoveImage={() => setAttachedImage(null)}
          attachMode={attachMode}
          onAttachModeChange={setAttachMode}
          onSend={handleSend}
          busy={busy}
        />
      </div>
    </div>
  );
}
