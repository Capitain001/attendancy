"use client";

import { useState } from "react";
import AgentChat from "@/components/agent-chat";

export default function AgentDock() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#172033]/20 transition-[background-color,transform] hover:-translate-y-px hover:bg-accent-hover" aria-label="Open SwayCue Agent">
        <span className="h-2 w-2 rounded-full bg-brand-lime" aria-hidden="true" />
        Ask SwayCue
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(94vw,31rem)] shadow-2xl shadow-[#172033]/20">
      <AgentChat compact onClose={() => setOpen(false)} />
    </div>
  );
}


"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgentMarkdown from "@/components/agent-markdown";
import { ArrowDownIcon, CheckIcon, ChevronDownIcon, CloseIcon, CopyIcon, EditIcon, MenuIcon, MoreIcon, PaperclipIcon, PlusIcon, RetryIcon, SearchIcon, SendIcon, SparklesIcon, StopIcon, TrashIcon } from "@/components/agent-icons";
import { fetchApiJson } from "@/lib/http/fetch-api-json";
import { INSTAGRAM_MEDIA_BUCKET, validateInstagramMediaFile, type InstagramComposerMedia } from "@/lib/postiz/publishing";
import { createClient } from "@/lib/supabase/client";

type AgentMessageAttachment = Omit<InstagramComposerMedia, "thumbnail"> & {
  thumbnail?: string;
  previewUrl?: string;
};
type AgentMessage = { id: string; role: "USER" | "ASSISTANT" | "TOOL"; content: string; attachments: AgentMessageAttachment[]; toolName: string | null; toolStatus: string | null; createdAt: string };
type PendingAction = { actionId: string; summary: string };
type Conversation = { id: string; title: string | null; pendingAction: PendingAction | null; messages: AgentMessage[] };
type ConversationSummary = { id: string; title: string | null; pendingAction: PendingAction | null; messageCount: number; updatedAt: string };
type ComposerAttachment = InstagramComposerMedia & { uploadToken: string; previewUrl: string };
type AgentChatProps = { compact?: boolean; onClose?: () => void };

const SUGGESTIONS = [
  { title: "Plan a Reel", detail: "Schedule media and its DM follow-up", prompt: "Help me schedule a new Instagram Reel and create a comment-to-DM campaign for it." },
  { title: "Review my week", detail: "See what is queued to publish", prompt: "Show me my upcoming posts and flag anything that still needs attention." },
  { title: "Build an automation", detail: "Turn comments into qualified DMs", prompt: "Help me create a comment-to-DM campaign with a follow gate and tracked link." },
  { title: "Workspace briefing", detail: "Summarise activity and next steps", prompt: "Give me a concise workspace briefing and tell me what I should do next." },
];

const CONFIRMATION_MESSAGES = new Set(["yes", "yep", "yeah", "confirm", "confirm it", "do it", "go ahead", "publish it", "schedule it", "create it"]);

function withoutPreview(item: ComposerAttachment): Omit<ComposerAttachment, "previewUrl"> {
  return { id: item.id, path: item.path, contentType: item.contentType, uploadToken: item.uploadToken, ...(item.alt ? { alt: item.alt } : {}), ...(item.thumbnail ? { thumbnail: item.thumbnail } : {}), ...(item.name ? { name: item.name } : {}) };
}

function isConfirmationMessage(value: string) {
  return CONFIRMATION_MESSAGES.has(value.toLowerCase().replace(/[.!?]+$/, "").trim());
}

function relativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((today - day) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "Previous 7 days";
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function MessageAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-[#eef0e8] hover:text-foreground">{children}</button>;
}

function SentAttachment({ attachment }: { attachment: AgentMessageAttachment }) {
  const source = attachment.previewUrl ?? attachment.path;
  if (!/^https?:\/\//i.test(source) && !source.startsWith("blob:")) return null;
  if (attachment.contentType.startsWith("video/")) {
    return <video src={source} controls preload="metadata" className="max-h-72 w-full rounded-xl bg-black object-contain" />;
  }
  if (source.startsWith("blob:")) {
    return <Image src={source} alt={attachment.alt ?? attachment.name ?? "Attached image"} width={640} height={480} unoptimized className="max-h-72 w-full rounded-xl object-cover" />;
  }
  // Postiz media hosts vary by installation, so these already validated HTTPS
  // URLs cannot be constrained with a static Next Image remotePatterns entry.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={source} alt={attachment.alt ?? attachment.name ?? "Attached image"} className="max-h-72 w-full rounded-xl object-cover" />;
}

export default function AgentChat({ compact = false, onClose }: AgentChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef<ComposerAttachment[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const pendingIdRef = useRef(0);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? conversations.filter((item) => (item.title || "Untitled chat").toLowerCase().includes(query)) : conversations;
  }, [conversations, search]);

  const groupedConversations = useMemo(() => {
    const groups = new Map<string, ConversationSummary[]>();
    for (const conversation of filteredConversations) {
      const label = relativeDate(conversation.updatedAt);
      groups.set(label, [...(groups.get(label) ?? []), conversation]);
    }
    return [...groups.entries()];
  }, [filteredConversations]);

  const currentTitle = conversations.find((item) => item.id === conversationId)?.title || "New chat";

  const loadConversation = useCallback(async (id?: string | null, showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const query = id ? `?conversationId=${encodeURIComponent(id)}` : "";
      const payload = await fetchApiJson<{ success: boolean; data: { conversation: Conversation | null; conversations: ConversationSummary[] } }>(`/api/agent/conversations${query}`, { cache: "no-store" });
      const conversation = payload.data.conversation;
      setConversations(payload.data.conversations ?? []);
      setConversationId(conversation?.id ?? null);
      setMessages(conversation?.messages ?? []);
      setPendingAction(conversation?.pendingAction ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the SwayCue agent");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadConversation(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadConversation]);

  useEffect(() => { attachmentsRef.current = attachments; }, [attachments]);
  useEffect(() => () => { attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)); abortRef.current?.abort(); }, []);
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  useEffect(() => { if (!showScrollButton) scrollToBottom(messages.length ? "smooth" : "auto"); }, [messages, pendingAction, sending, scrollToBottom, showScrollButton]);

  function onScroll() {
    const node = scrollRef.current;
    if (node) setShowScrollButton(node.scrollHeight - node.scrollTop - node.clientHeight > 160);
  }

  function startNewChat() {
    attachments.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    attachmentsRef.current = [];
    setConversationId(null); setMessages([]); setPendingAction(null); setText(""); setAttachments([]); setError(null); setHistoryOpen(false);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function switchConversation(id: string) {
    setOpenMenuId(null); setHistoryOpen(false); void loadConversation(id);
  }

  async function renameConversation(conversation: ConversationSummary) {
    const title = window.prompt("Rename chat", conversation.title || "Untitled chat")?.trim();
    setOpenMenuId(null);
    if (!title || title === conversation.title) return;
    try {
      await fetchApiJson("/api/agent/conversations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: conversation.id, title }) });
      setConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, title } : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not rename that chat"); }
  }

  async function deleteConversation(conversation: ConversationSummary) {
    setOpenMenuId(null);
    if (!window.confirm(`Delete “${conversation.title || "Untitled chat"}”? This cannot be undone.`)) return;
    try {
      await fetchApiJson(`/api/agent/conversations?conversationId=${encodeURIComponent(conversation.id)}`, { method: "DELETE" });
      const remaining = conversations.filter((item) => item.id !== conversation.id);
      setConversations(remaining);
      if (conversationId === conversation.id) {
        if (remaining[0]) await loadConversation(remaining[0].id);
        else startNewChat();
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete that chat"); }
  }

  async function uploadFiles(fileCollection: FileList | File[] | null) {
    if (!fileCollection || fileCollection.length === 0) return;
    const selected = Array.from(fileCollection);
    if (attachments.length + selected.length > 10) { setError("Attach at most 10 media files to one request."); return; }
    for (const file of selected) {
      const mediaError = validateInstagramMediaFile(file);
      if (mediaError) { setError(mediaError); return; }
    }
    setUploading(true); setError(null);
    try {
      const supabase = createClient();
      const uploaded: ComposerAttachment[] = [];
      for (const file of selected) {
        const authorization = await fetchApiJson<{ data: { path: string; token: string } }>("/api/postiz/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, type: file.type, size: file.size }) });
        const uploadResult = await supabase.storage.from(INSTAGRAM_MEDIA_BUCKET).uploadToSignedUrl(authorization.data.path, authorization.data.token, file, { contentType: file.type });
        if (uploadResult.error) throw uploadResult.error;
        const imported = await fetchApiJson<{ data: InstagramComposerMedia & { uploadToken: string } }>("/api/postiz/media", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: authorization.data.path, name: file.name, type: file.type, size: file.size }) });
        uploaded.push({ ...imported.data, previewUrl: URL.createObjectURL(file) });
      }
      setAttachments((current) => [...current, ...uploaded]);
      textareaRef.current?.focus();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not attach that media"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  function removeAttachment(index: number) {
    setAttachments((current) => { URL.revokeObjectURL(current[index].previewUrl); return current.filter((_, itemIndex) => itemIndex !== index); });
  }

  async function confirmAction() {
    if (!conversationId || !pendingAction || confirming) return;
    setConfirming(true); setError(null);
    try {
      const payload = await fetchApiJson<{ data: { conversation: Conversation } }>("/api/agent/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId, actionId: pendingAction.actionId }) });
      setMessages(payload.data.conversation.messages); setPendingAction(payload.data.conversation.pendingAction);
      await loadConversation(conversationId, false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "That action could not be completed"); await loadConversation(conversationId, false); }
    finally { setConfirming(false); }
  }

  async function sendMessage(messageOverride?: string) {
    const message = (messageOverride ?? text).trim();
    if ((!message && attachments.length === 0) || sending || uploading) return;
    if (pendingAction && attachments.length === 0 && isConfirmationMessage(message)) { setText(""); await confirmAction(); return; }
    setSending(true); setError(null); setShowScrollButton(false);
    pendingIdRef.current += 1;
    const sentAttachments = attachments;
    const optimistic: AgentMessage = { id: `pending-${pendingIdRef.current}`, role: "USER", content: message || "Please use the attached media.", attachments: sentAttachments.map((item) => ({ ...withoutPreview(item), previewUrl: item.previewUrl })), toolName: null, toolStatus: null, createdAt: "" };
    setMessages((current) => [...current, optimistic]); setText(""); setAttachments([]);
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const payload = await fetchApiJson<{ data: { conversation: Conversation; pendingAction: PendingAction | null } }>("/api/agent/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId, message: message || "Please use the attached media.", attachments: sentAttachments.map(withoutPreview) }), signal: controller.signal });
      setConversationId(payload.data.conversation.id); setMessages(payload.data.conversation.messages); setPendingAction(payload.data.pendingAction);
      sentAttachments.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      await loadConversation(payload.data.conversation.id, false);
    } catch (reason) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setAttachments(sentAttachments);
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "The SwayCue agent could not respond");
    } finally { abortRef.current = null; setSending(false); window.setTimeout(() => textareaRef.current?.focus(), 0); }
  }

  function stopResponse() { abortRef.current?.abort(); setSending(false); }
  async function copyMessage(message: AgentMessage) { await navigator.clipboard.writeText(message.content); setCopiedMessageId(message.id); window.setTimeout(() => setCopiedMessageId(null), 1_500); }
  function retryFrom(index: number) { const prior = messages.slice(0, index).reverse().find((item) => item.role === "USER"); if (prior) void sendMessage(prior.content); }

  const historySidebar = (
    <aside className={`${historyOpen ? "flex" : "hidden"} absolute inset-y-0 left-0 z-30 w-[17rem] flex-col border-r border-[#e5e7df] bg-[#f6f7f2] lg:static lg:flex ${compact ? "lg:hidden" : ""}`} aria-label="Chat history">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <button type="button" onClick={startNewChat} className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-[#dfe2da] bg-white px-3 text-left text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(23,32,51,0.04)] hover:bg-[#fbfcf8]"><PlusIcon className="size-4" /> New chat</button>
        <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close chat history" className="inline-flex size-10 items-center justify-center rounded-xl text-muted hover:bg-[#e9ebe3] lg:hidden"><CloseIcon className="size-5" /></button>
      </div>
      <div className="px-3 py-2">
        <label className="flex h-9 items-center gap-2 rounded-xl bg-[#e9ebe3] px-3 text-muted focus-within:ring-2 focus-within:ring-brand-coral/35"><SearchIcon className="size-4 shrink-0" /><input name="agent-chat-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" aria-label="Search chats" className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted" /></label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {groupedConversations.length === 0 ? <p className="px-3 py-8 text-center text-xs leading-5 text-muted">{search ? "No matching chats" : "Your conversations will appear here"}</p> : groupedConversations.map(([label, items]) => (
          <div key={label} className="mt-4 first:mt-2"><p className="px-3 pb-1.5 text-[11px] font-medium text-muted">{label}</p><div className="space-y-0.5">
            {items.map((conversation) => (
              <div key={conversation.id} className={`group relative flex items-center rounded-xl ${conversation.id === conversationId ? "bg-[#e4e7dd]" : "hover:bg-[#eceee7]"}`}>
                <button type="button" onClick={() => switchConversation(conversation.id)} className="min-w-0 flex-1 px-3 py-2.5 text-left"><span className="block truncate text-sm text-foreground">{conversation.title || "Untitled chat"}</span>{conversation.pendingAction && <span className="mt-0.5 block text-[10px] font-medium text-brand-coral-dark">Awaiting approval</span>}</button>
                <button type="button" onClick={() => setOpenMenuId(openMenuId === conversation.id ? null : conversation.id)} aria-label={`Actions for ${conversation.title || "Untitled chat"}`} className="mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted opacity-0 hover:bg-white/70 hover:text-foreground focus:opacity-100 group-hover:opacity-100"><MoreIcon className="size-4" /></button>
                {openMenuId === conversation.id && <div className="absolute right-2 top-10 z-40 w-32 rounded-xl border border-border bg-white p-1 shadow-xl"><button type="button" onClick={() => void renameConversation(conversation)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-[#f1f3ec]"><EditIcon className="size-3.5" /> Rename</button><button type="button" onClick={() => void deleteConversation(conversation)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-error hover:bg-[#fff1ec]"><TrashIcon className="size-3.5" /> Delete</button></div>}
              </div>
            ))}
          </div></div>
        ))}
      </div>
      <div className="border-t border-[#e2e4dc] px-4 py-3 text-[10px] leading-4 text-muted">Private to your SwayCue workspace</div>
    </aside>
  );

  return (
    <section className={`relative flex min-h-0 overflow-hidden border border-border bg-white shadow-[0_18px_50px_rgba(23,32,51,0.08)] ${compact ? "h-[min(82dvh,46rem)] rounded-2xl" : "h-[calc(100dvh-7.75rem)] min-h-[34rem] rounded-2xl"}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadFiles(event.dataTransfer.files); }}>
      {historyOpen && <button type="button" aria-label="Close chat history" onClick={() => setHistoryOpen(false)} className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px] lg:hidden" />}
      {historySidebar}
      <div className="relative flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-1.5"><button type="button" onClick={() => setHistoryOpen(true)} aria-label="Open chat history" className={`inline-flex size-9 items-center justify-center rounded-xl text-muted hover:bg-[#f1f3ec] hover:text-foreground ${!compact ? "lg:hidden" : ""}`}><MenuIcon className="size-5" /></button><button type="button" onClick={() => setHistoryOpen(true)} className="flex min-w-0 items-center gap-1.5 rounded-xl px-2 py-1.5 text-left hover:bg-[#f4f5f0]"><span className="max-w-[12rem] truncate text-sm font-semibold text-foreground sm:max-w-sm">{currentTitle}</span><ChevronDownIcon className="size-4 shrink-0 text-muted" /></button></div>
          <div className="flex items-center gap-1"><button type="button" onClick={startNewChat} aria-label="New chat" title="New chat" className="inline-flex size-9 items-center justify-center rounded-xl text-muted hover:bg-[#f1f3ec] hover:text-foreground"><EditIcon className="size-[18px]" /></button>{onClose && <button type="button" onClick={onClose} aria-label="Close SwayCue Agent" className="inline-flex size-9 items-center justify-center rounded-xl text-muted hover:bg-[#f1f3ec] hover:text-foreground"><CloseIcon className="size-5" /></button>}</div>
        </header>

        <div ref={scrollRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-40 pt-5 sm:px-8 sm:pt-8">
            {loading ? <div className="space-y-8 py-8" aria-label="Loading conversation"><div className="ml-auto h-12 w-2/5 animate-pulse rounded-2xl bg-[#eef0e9]" /><div className="h-24 w-4/5 animate-pulse rounded-2xl bg-[#f2f3ee]" /></div> : messages.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center pb-8"><div className="mx-auto w-full max-w-xl"><div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#172033] text-brand-lime shadow-lg shadow-[#172033]/15"><SparklesIcon className="size-6" /></div><h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">How can I help you grow today?</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted">Create content, schedule publishing, and launch the follow-up automation in one conversation.</p><div className="mt-8 grid gap-1 sm:grid-cols-2">{SUGGESTIONS.map((suggestion) => <button key={suggestion.title} type="button" onClick={() => { setText(suggestion.prompt); window.setTimeout(() => textareaRef.current?.focus(), 0); }} className="group rounded-xl px-3 py-2.5 text-left hover:bg-[#f3f5ed]"><span className="block text-sm font-medium text-foreground group-hover:text-brand-coral-dark">{suggestion.title}</span><span className="mt-0.5 block text-xs leading-5 text-muted">{suggestion.detail}</span></button>)}</div></div></div>
            ) : (
              <div className="space-y-7">{messages.map((message, index) => {
                if (message.role === "TOOL") return <div key={message.id} className="flex items-center gap-2 pl-11 text-xs text-muted"><span className={`inline-flex size-5 items-center justify-center rounded-full ${message.toolStatus === "completed" ? "bg-[#e4f3e9] text-success" : "bg-[#eef0e8] text-muted"}`}><CheckIcon className="size-3" /></span><span>{message.content}</span></div>;
                if (message.role === "USER") return <div key={message.id} className="flex justify-end"><div className="max-w-[88%] space-y-2 rounded-[1.35rem] rounded-br-md bg-[#eef0e8] p-2 text-sm leading-6 text-foreground sm:max-w-[78%]">{message.attachments?.length > 0 && <div className={`grid gap-1.5 ${message.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>{message.attachments.map((attachment, attachmentIndex) => <SentAttachment key={`${attachment.id}-${attachmentIndex}`} attachment={attachment} />)}</div>}<p className="whitespace-pre-wrap px-2 pb-0.5">{message.content}</p></div></div>;
                return <article key={message.id} className="group flex gap-3 sm:gap-4"><div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#172033] text-brand-lime"><SparklesIcon className="size-4" /></div><div className="min-w-0 flex-1"><div className="text-sm leading-7 text-foreground"><AgentMarkdown content={message.content} /></div><div className="mt-1 flex items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100"><MessageAction label="Copy response" onClick={() => void copyMessage(message)}>{copiedMessageId === message.id ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}</MessageAction><MessageAction label="Try again" onClick={() => retryFrom(index)}><RetryIcon className="size-4" /></MessageAction></div></div></article>;
              })}{sending && <div className="flex gap-4" role="status" aria-label="SwayCue is thinking"><div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#172033] text-brand-lime"><SparklesIcon className="size-4" /></div><div className="flex h-8 items-center gap-1"><span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" /><span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" /><span className="size-1.5 animate-bounce rounded-full bg-muted" /></div></div>}</div>
            )}
            {pendingAction && <div className="mt-8 ml-0 rounded-2xl border border-[#f5b5aa] bg-[#fff7f4] p-4 sm:ml-11 sm:p-5"><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-coral-dark shadow-sm"><CheckIcon className="size-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">Ready for your approval</p><p className="mt-1 text-sm leading-6 text-muted">{pendingAction.summary}</p><button type="button" onClick={() => void confirmAction()} disabled={confirming} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#172033] px-4 text-sm font-semibold text-white hover:bg-[#27334b] disabled:cursor-wait disabled:opacity-60">{confirming ? "Working…" : "Confirm action"}</button></div></div></div>}
          </div>
          {showScrollButton && <button type="button" onClick={() => { setShowScrollButton(false); scrollToBottom(); }} aria-label="Scroll to latest message" className="sticky bottom-4 left-1/2 z-10 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-white text-muted shadow-md hover:text-foreground"><ArrowDownIcon className="size-4" /></button>}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white via-white to-transparent px-3 pb-3 pt-12 sm:px-6 sm:pb-5"><div className="pointer-events-auto mx-auto max-w-3xl">
          {error && <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-[#f2c0b8] bg-[#fff7f4] px-3 py-2 text-xs leading-5 text-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="shrink-0 rounded p-0.5 hover:bg-white"><CloseIcon className="size-3.5" /></button></div>}
          <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="rounded-[1.6rem] border border-[#d9ddd3] bg-white p-2 shadow-[0_8px_35px_rgba(23,32,51,0.12)] focus-within:border-[#b9c0b4] focus-within:shadow-[0_10px_40px_rgba(23,32,51,0.16)]">
            <input ref={fileInputRef} name="agent-media" type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/bmp,image/tiff,video/mp4" multiple onChange={(event) => void uploadFiles(event.target.files)} />
            {attachments.length > 0 && <div className="flex gap-2 overflow-x-auto px-1 pb-2 pt-1">{attachments.map((item, index) => <div key={`${item.id}-${index}`} className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-border bg-[#f3f4ef]">{item.contentType === "video/mp4" ? <video src={item.previewUrl} aria-label={item.name ?? "Attached video"} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <Image src={item.previewUrl} alt={item.name ?? "Attached media"} width={72} height={72} unoptimized className="h-full w-full object-cover" />}<button type="button" onClick={() => removeAttachment(index)} aria-label={`Remove ${item.name ?? "attachment"}`} className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black"><CloseIcon className="size-3" /></button></div>)}</div>}
            <textarea ref={textareaRef} name="agent-message" value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void sendMessage(); } }} rows={1} maxLength={4_000} placeholder="Ask SwayCue anything" aria-label="Message SwayCue Agent" className="max-h-48 min-h-11 w-full resize-none overflow-y-auto border-0 bg-transparent px-3 py-2.5 text-sm leading-6 text-foreground outline-none [field-sizing:content] placeholder:text-[#8b9385]" />
            <div className="flex items-center justify-between px-1 pb-0.5"><div className="flex items-center gap-1"><button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || sending} aria-label="Attach media" title="Attach photos or MP4 video" className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-[#f0f2eb] hover:text-foreground disabled:opacity-50"><PaperclipIcon className="size-[18px]" /></button><span className="hidden text-[11px] text-muted sm:inline">{uploading ? "Uploading…" : attachments.length ? `${attachments.length} attached` : "Photos or MP4"}</span></div>{sending ? <button type="button" onClick={stopResponse} aria-label="Stop response" className="inline-flex size-9 items-center justify-center rounded-full bg-[#172033] text-white hover:bg-[#27334b]"><StopIcon className="size-4" /></button> : <button type="submit" disabled={uploading || (!text.trim() && attachments.length === 0)} aria-label="Send message" className="inline-flex size-9 items-center justify-center rounded-full bg-[#172033] text-white hover:bg-[#27334b] disabled:bg-[#dfe2da] disabled:text-[#9ba296]"><SendIcon className="size-[18px]" /></button>}</div>
          </form><p className="mt-2 text-center text-[10px] text-muted">SwayCue can make mistakes. Review publishing and automation details before confirming.</p>
        </div></div>
        {dragging && <div className="absolute inset-3 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-brand-coral bg-white/90 backdrop-blur-sm"><div className="text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#fff1ec] text-brand-coral-dark"><PaperclipIcon className="size-6" /></div><p className="mt-3 text-sm font-semibold text-foreground">Drop media to attach</p><p className="mt-1 text-xs text-muted">Photos and MP4 videos are supported</p></div></div>}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckIcon, CopyIcon } from "@/components/agent-icons";

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = String(children ?? "").replace(/\n$/, "");
  const language = className?.replace("language-", "") ?? "code";

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  if (!className) return <code className="rounded bg-[#eef0e8] px-1.5 py-0.5 font-mono text-[0.88em] text-foreground">{children}</code>;
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[#30394b] bg-[#172033] text-[#f5f7ee]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-white/55">
        <span>{language}</span>
        <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-white/10 hover:text-white">
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6"><code className={className}>{text}</code></pre>
    </div>
  );
}

const components: Components = {
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-coral-dark underline decoration-brand-coral/40 underline-offset-4 hover:decoration-brand-coral">{children}</a>,
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-semibold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-semibold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1.5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1.5 last:mb-0">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-brand-coral pl-4 text-muted">{children}</blockquote>,
  table: ({ children }) => <div className="my-4 overflow-x-auto rounded-xl border border-border"><table className="w-full border-collapse text-left text-sm">{children}</table></div>,
  th: ({ children }) => <th className="border-b border-border bg-[#f2f4ec] px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-border px-3 py-2 align-top last:border-b-0">{children}</td>,
  hr: () => <hr className="my-5 border-border" />,
  code: ({ className, children }) => <CodeBlock className={className}>{children}</CodeBlock>,
};

export default function AgentMarkdown({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>;
}