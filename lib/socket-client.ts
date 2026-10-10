"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

let sharedSocket: Socket | null = null;

export function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io({ path: "/socket.io" });
  }
  return sharedSocket;
}

/**
 * Subscribes to live match updates broadcast by the server (see
 * app/api/matches/[id]/route.ts + server.js). Returns the current list of
 * matches, kept in sync in real time as scores change.
 */
export function useLiveMatchSocket(initial: any[] = []) {
  const [matches, setMatches] = useState<any[]>(initial);
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      setMatches(initial);
      initialised.current = true;
    }
  }, [initial]);

  useEffect(() => {
    const socket = getSocket();

    function upsert(match: any) {
      setMatches((prev) => {
        const idx = prev.findIndex((m) => m.id === match.id);
        if (idx === -1) return [match, ...prev];
        const copy = [...prev];
        copy[idx] = match;
        return copy;
      });
    }

    socket.on("match:update", upsert);
    socket.on("match:created", upsert);

    return () => {
      socket.off("match:update", upsert);
      socket.off("match:created", upsert);
    };
  }, []);

  return matches;
}

/**
 * Task 14, Phase 4 — subscribes to real-time notifications for the given
 * user over the existing Socket.IO connection. Joins that user's private
 * room (see server.js's "identify" handler) and prepends any notification
 * pushed by lib/notify.ts#notifyUser to the given initial list, so the
 * sidebar bell / notification panel update instantly without a manual
 * refresh or poll.
 */
export function useNotificationSocket(userId: string | null | undefined, initial: any[] = []) {
  const [notifications, setNotifications] = useState<any[]>(initial);
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      setNotifications(initial);
      initialised.current = true;
    }
  }, [initial]);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socket.emit("identify", userId);

    function onNew(notification: any) {
      setNotifications((prev) => {
        const idx = prev.findIndex((n) => n.id === notification.id);
        if (idx === -1) return [notification, ...prev];
        const copy = [...prev];
        copy[idx] = notification; // grouped update replaces the existing row in place
        return copy;
      });
    }

    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, [userId]);

  return notifications;
}

/**
 * Task 21, Phase 5 — real-time direct messages. Reuses the same per-user
 * room joined by useNotificationSocket's "identify" call (whichever hook
 * mounts first joins the room; joining twice is a harmless no-op), just
 * listens for the "message:new" event instead. `otherUserId` scopes
 * delivery to messages from/to the specific person the thread is open
 * with — messages from a different conversation are ignored here (the
 * conversation-list page would need its own, simpler subscription if it
 * wants live previews too).
 */
export function useDirectMessageSocket(myUserId: string | null | undefined, otherUserId: string | null | undefined, initial: any[] = []) {
  const [messages, setMessages] = useState<any[]>(initial);
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      setMessages(initial);
      initialised.current = true;
    }
  }, [initial]);

  // Reset when switching conversations so an old thread's messages don't
  // linger while the new thread's initial fetch is still loading.
  useEffect(() => {
    initialised.current = false;
  }, [otherUserId]);

  useEffect(() => {
    if (!myUserId) return;
    const socket = getSocket();
    socket.emit("identify", myUserId);

    function onNew(message: any) {
      if (message.fromId !== otherUserId && message.toId !== otherUserId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    }

    socket.on("message:new", onNew);
    return () => {
      socket.off("message:new", onNew);
    };
  }, [myUserId, otherUserId]);

  return messages;
}

/**
 * Subscribes to the ball-by-ball / point-by-point event log for a single
 * match (see app/api/matches/[id]/events/route.ts). Takes the initial
 * fetched list and appends new events broadcast live over Socket.IO.
 */
export function useMatchEvents(matchId: string | null, initial: any[] = []) {
  const [events, setEvents] = useState<any[]>(initial);
  const lastMatchId = useRef<string | null>(null);

  useEffect(() => {
    if (matchId !== lastMatchId.current) {
      setEvents(initial);
      lastMatchId.current = matchId;
    }
  }, [initial, matchId]);

  useEffect(() => {
    if (!matchId) return;
    const socket = getSocket();
    function onEvent(event: any) {
      if (event.matchId !== matchId) return;
      setEvents((prev) => (prev.some((e) => e.id === event.id) ? prev : [...prev, event]));
    }
    socket.on("match:event", onEvent);
    return () => {
      socket.off("match:event", onEvent);
    };
  }, [matchId]);

  return events;
}
