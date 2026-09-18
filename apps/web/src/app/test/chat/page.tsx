"use client";

import * as React from "react";
import { FiInbox, FiStar } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/agent-dock/chat-panel";
import { PendingTray } from "@/components/agent-dock/pending-tray";
import type { PendingItem } from "@/components/agent-dock/pending-tray";

/* ------------------------------------------------------------------ */
/*  Mock data – purely visual, no service calls                       */
/* ------------------------------------------------------------------ */

const MOCK_PENDING: PendingItem[] = [
  {
    id: "1",
    kind: "send_email",
    channel: "Gmail",
    summary: "Reply to Sarah Dupont confirming availability Thursday at 3pm.",
    draftPayload: {
      to: ["sarah.dupont@ecole.fr"],
      subject: "Re: Meeting Thursday",
      body: "Hi Sarah,\n\nThank you for your email. I'm available Thursday at 3pm.\n\nBest regards",
    },
  },
  {
    id: "2",
    kind: "create_event",
    channel: "Google Calendar",
    summary: "Meeting with Sarah Dupont — Thursday 3:00 PM to 4:00 PM.",
    draftPayload: {},
  },
  {
    id: "3",
    kind: "send_email",
    channel: "Gmail",
    summary: "Weekly attendance report to Principal Martin — 24 students present, 2 absent.",
    draftPayload: {
      to: ["martin@ecole.fr"],
      subject: "Rapport d'assiduité hebdomadaire",
      body: "Bonjour M. Martin,\n\n24 élèves présents, 2 absents cette semaine.\n\nCordialement",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Test Page                                                         */
/* ------------------------------------------------------------------ */

export default function ChatTestPage() {
  const [chatOpen, setChatOpen] = React.useState(false);
  const [trayOpen, setTrayOpen] = React.useState(false);
  const [pendingItems, setPendingItems] = React.useState(MOCK_PENDING);

  const handleApprove = (id: string) =>
    setPendingItems((p) => p.filter((i) => i.id !== id));

  const handleReject = (id: string) =>
    setPendingItems((p) => p.filter((i) => i.id !== id));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Agent Dock — Visual Test
      </h1>

      <p className="max-w-md text-center text-sm text-muted-foreground">
        This page renders the ChatPanel and PendingTray components with mock
        data. No backend service is connected.
      </p>

      {/* ---- Dock buttons (mirroring AgentDock) ---- */}
      <div className="fixed right-4 bottom-4 z-40 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="relative rounded-full"
          onClick={() => setTrayOpen(true)}
        >
          <FiInbox />
          Pending
          {pendingItems.length > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
              {pendingItems.length}
            </span>
          )}
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

      {/* ---- Real ChatPanel component (mock mode — no fetch) ---- */}
      <ChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        onSend={() => "This is a mock response. No backend is connected."}
      />

      {/* ---- Real PendingTray component with mock data ---- */}
      <PendingTray
        open={trayOpen}
        onOpenChange={setTrayOpen}
        items={pendingItems}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
