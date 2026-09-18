"use client";

import * as React from "react";
import { FiCheck, FiEdit2, FiX } from "react-icons/fi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface EmailDraft {
  to?: string[];
  subject?: string;
  body?: string;
}

export interface PendingItem {
  id: string;
  kind: string;
  channel: string;
  summary: string;
  draftPayload: unknown;
}

export interface PendingTrayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: PendingItem[];
  error?: string | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onUpdateDraft?: (
    id: string,
    draftPayload: EmailDraft,
  ) => void;
  approvePending?: boolean;
  rejectPending?: boolean;
  updatePending?: boolean;
}

export function PendingTray({
  open,
  onOpenChange,
  items = [],
  error,
  onApprove = () => {},
  onReject = () => {},
  onUpdateDraft = () => {},
  approvePending = false,
  rejectPending = false,
  updatePending = false,
}: PendingTrayProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<EmailDraft>({});

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>Pending actions</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {items.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nothing awaiting approval. Ask the AI to draft an email or event.
            </p>
          )}

          {items.map((item) => {
            const email = item.draftPayload as EmailDraft;
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border p-3"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <Badge variant="outline">
                    {item.kind.replace("_", " ")}
                  </Badge>

                  <span className="text-[10px] text-muted-foreground">
                    {item.channel}
                  </span>
                </div>

                {isEditing && item.kind === "send_email" ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={(draft.to ?? []).join(", ")}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          to: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="To"
                    />

                    <Input
                      value={draft.subject ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          subject: e.target.value,
                        }))
                      }
                      placeholder="Subject"
                    />

                    <Textarea
                      value={draft.body ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          body: e.target.value,
                        }))
                      }
                      placeholder="Body"
                    />

                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => {
                          onUpdateDraft(item.id, {
                            ...email,
                            ...draft,
                          });
                          setEditingId(null);
                        }}
                        disabled={updatePending}
                      >
                        Save
                      </Button>

                      <Button
                        size="lg"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-foreground/90">
                    {item.summary}
                  </p>
                )}

                {!isEditing && (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => onApprove(item.id)}
                      disabled={approvePending}
                    >
                      <FiCheck />
                      Approve
                    </Button>

                    {item.kind === "send_email" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDraft(email);
                          setEditingId(item.id);
                        }}
                      >
                        <FiEdit2 />
                        Edit
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onReject(item.id)}
                      disabled={rejectPending}
                    >
                      <FiX />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}