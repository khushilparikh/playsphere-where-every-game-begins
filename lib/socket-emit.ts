// Lets API route handlers broadcast real-time events to connected clients.
// The Socket.IO server instance is created once in server.js and attached
// to the Node global object — this only works because PlaySphere runs on a
// custom Node server (see server.js) rather than a purely serverless
// deployment, where a persistent WebSocket server isn't available.
import type { Server } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var io: Server | undefined;
}

export function emitEvent(event: string, payload: unknown) {
  if (global.io) {
    global.io.emit(event, payload);
  } else if (process.env.NODE_ENV !== "production") {
    console.warn(`[socket] global.io not set — "${event}" was not broadcast. Are you running "npm run dev" (server.js), not "next dev"?`);
  }
}

// Task 14, Phase 4: sends an event only to one user's private room,
// instead of broadcasting to every connected client like emitEvent()
// does. The client joins its own room by emitting "identify" right after
// connecting (see lib/socket-client.ts#useNotificationSocket and the
// matching server.js handler) — rooms are keyed by userId.
export function emitToUser(userId: string, event: string, payload: unknown) {
  if (global.io) {
    global.io.to(userId).emit(event, payload);
  } else if (process.env.NODE_ENV !== "production") {
    console.warn(`[socket] global.io not set — "${event}" was not sent to user ${userId}.`);
  }
}
