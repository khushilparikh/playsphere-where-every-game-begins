"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, MessageSquare } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { useApiGet } from "@/lib/use-api";
import { apiPost } from "@/lib/api-client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDirectMessageSocket } from "@/lib/socket-client";

interface Conversation {
  userId: string;
  name: string;
  avatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

function Avatar({ name, avatar, size = 40 }: { name?: string; avatar?: string | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-volt/15 font-bold text-volt"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        (name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)
      )}
    </span>
  );
}

function Thread({ otherUserId, otherName, otherAvatar }: { otherUserId: string; otherName: string; otherAvatar: string | null }) {
  const { user } = useAuth();
  const { data, refresh } = useApiGet<{ messages: any[] }>(`/api/messages/${otherUserId}`, [otherUserId]);
  const messages = useDirectMessageSocket(user?.id, otherUserId, data?.messages ?? []);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setText("");
    try {
      await apiPost(`/api/messages/${otherUserId}`, { content });
      refresh();
    } catch (e) {
      alert((e as Error).message);
      setText(content); // restore on failure so nothing is lost
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-court-line px-5 py-3.5">
        <Avatar name={otherName} avatar={otherAvatar} size={32} />
        <p className="text-sm font-semibold">{otherName}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {messages.map((m) => {
          const mine = m.fromId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "rounded-br-sm bg-volt text-court" : "rounded-bl-sm bg-court text-ink-muted"
                }`}
              >
                {m.content}
                <p className={`mt-0.5 text-[10px] ${mine ? "text-court/70" : "text-ink-faint"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-court-line p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message…"
          className="focus-ring flex-1 rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          aria-label="Send"
          className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-volt text-court disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function MessagesPageInner() {
  const searchParams = useSearchParams();
  const deepLinkUserId = searchParams.get("to");
  const { data, refresh } = useApiGet<{ conversations: Conversation[] }>("/api/messages");
  const conversations = data?.conversations ?? [];
  const [activeId, setActiveId] = useState<string | null>(deepLinkUserId);

  useEffect(() => {
    if (deepLinkUserId) setActiveId(deepLinkUserId);
  }, [deepLinkUserId]);

  const active = conversations.find((c) => c.userId === activeId);
  // Deep-linking to someone with no prior message history yet: show a
  // thread with just their id/name so the first message can still be sent.
  const activeName = active?.name ?? (activeId ? "New conversation" : "");
  const activeAvatar = active?.avatar ?? null;

  return (
    <div className="pb-16">
      <Topbar title="Messages" />
      <div className="mx-auto grid max-w-5xl gap-4 px-6 py-8 md:grid-cols-[280px_1fr]">
        <Card className="h-[70vh] overflow-y-auto p-0">
          {conversations.length === 0 && (
            <p className="p-5 text-center text-sm text-ink-faint">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.userId}
              onClick={() => {
                setActiveId(c.userId);
                refresh();
              }}
              className={`focus-ring flex w-full items-center gap-3 border-b border-court-line px-4 py-3 text-left transition-colors ${
                activeId === c.userId ? "bg-volt/10" : "hover:bg-court"
              }`}
            >
              <Avatar name={c.name} avatar={c.avatar} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  {c.unread > 0 && (
                    <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-volt px-1 text-[10px] font-bold text-court">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-ink-faint">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </Card>

        <Card className="h-[70vh] p-0">
          {activeId ? (
            <Thread otherUserId={activeId} otherName={activeName} otherAvatar={activeAvatar} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-faint">
              <MessageSquare size={28} />
              <p className="text-sm">Pick a conversation to start chatting.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}
