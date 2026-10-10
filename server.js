// Custom Node server: runs Next.js request handling AND a Socket.IO server
// on the same HTTP server/port. This is required because Next.js API Routes
// alone (especially under serverless deployment) cannot hold open a
// persistent WebSocket connection — Socket.IO needs a long-lived Node
// process, which this file provides for both development and production.
//
// package.json's "dev"/"start" scripts point here instead of straight at
// `next dev` / `next start`.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("[socket] client connected:", socket.id);

    // Task 14, Phase 4: the client sends its own userId right after
    // connecting (see lib/socket-client.ts#useNotificationSocket). Joining
    // a room named after the userId lets emitToUser() (lib/socket-emit.ts)
    // deliver notifications to just that person instead of broadcasting
    // to everyone connected — a plain socket.io room is enough here since
    // this is a single Node process; a multi-instance deployment would
    // need a shared adapter (e.g. Redis) for rooms to work across
    // instances, same caveat as lib/rate-limit.ts's in-memory store.
    socket.on("identify", (userId) => {
      if (typeof userId === "string" && userId) {
        socket.join(userId);
      }
    });

    socket.on("disconnect", () => {
      console.log("[socket] client disconnected:", socket.id);
    });
  });

  // Expose the io instance to API route handlers via lib/socket-emit.ts
  global.io = io;

  httpServer.listen(port, () => {
    console.log(`> PlaySphere ready on http://${hostname}:${port}  (Next.js + Socket.IO)`);
  });
});
