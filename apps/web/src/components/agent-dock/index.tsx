"use client";

import * as React from "react";
import { FiInbox, FiStar } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { ChatPanel } from "./chat-panel";
import { PendingTray } from "./pending-tray";

export function AgentDock() {
  const [chatOpen, setChatOpen] = React.useState(false);
  const [trayOpen, setTrayOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");

  // Opened from the command palette's "Ask AI" entry.
  React.useEffect(() => {
    const onAsk = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: string }>).detail;
      setPrompt(detail?.prompt ?? "");
      setChatOpen(true);
    };

    window.addEventListener("hedwigs:ask-ai", onAsk);
    return () => window.removeEventListener("hedwigs:ask-ai", onAsk);
  }, []);

  return (
    <>
      <div
        id="tour-dock"
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2"
      >
        <Button
          variant="outline"
          size="sm"
          className="relative rounded-full"
          onClick={() => setTrayOpen(true)}
        >
          <FiInbox />
          Pending
        </Button>

        <Button
          size="sm"
          className="rounded-full"
          onClick={() => setChatOpen(true)}
        >
          <FiStar />
          Ask AI
        </Button>
      </div>

      <ChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialPrompt={prompt}
      />

      <PendingTray
        open={trayOpen}
        onOpenChange={setTrayOpen}
      />
    </>
  );
}