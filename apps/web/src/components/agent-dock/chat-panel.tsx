"use client";

import * as React from "react";
import { FiSend } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({
  open,
  onOpenChange,
  initialPrompt,
  onActivity,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
  onActivity?: () => void;
  /** When provided, bypasses the real /api/chat fetch (useful for visual-only testing). */
  onSend?: (messages: Msg[]) => string | Promise<string>;
}) {

  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open && initialPrompt) setInput(initialPrompt);
  }, [open, initialPrompt]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      let reply: string;

      if (onSend) {
        /* ---- Mock / visual-only mode ---- */
        reply = await Promise.resolve(onSend(next));
      } else {
        /* ---- Real streaming fetch ---- */
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });
        if (!res.ok || !res.body) {
          throw new Error(await res.text());
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        }
        reply = acc;
      }

      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: reply };
        return copy;
      });
      onActivity?.();
    } catch (err) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>Ask AI</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Try: &ldquo;reply to the last email from Sarah saying I&apos;m
              in&rdquo; or &ldquo;schedule a call with bob@x.com Thursday
              9am&rdquo;. I&apos;ll draft it for your approval.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {m.content || (busy ? "…" : "")}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            placeholder="Ask me to draft an email or event…"
            disabled={busy}
          />
          <Button size="icon-sm" onClick={() => void send()} disabled={busy}>
            <FiSend />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
