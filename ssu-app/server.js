const http = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || "3000", 10);

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    // Let Socket.IO handle its own polling endpoints; avoid Next adding redirects/headers
    if (req.url && req.url.startsWith("/socket.io")) {
      return; // socket.io has its own 'request' listener attached below
    }

    // Global CORS preflight responder for API routes
    if (req.method === "OPTIONS" && req.url && req.url.startsWith("/api/")) {
      const allowHeaders =
        req.headers["access-control-request-headers"] ||
        "Content-Type, Authorization, X-Requested-With";
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": allowHeaders,
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      });
      res.end();
      return;
    }

    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          "http://localhost:3001",
          "https://ssu-social-newwave.vercel.app"  // Production
        ];

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS: " + origin));
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  const chatNamespace = io.of("/api");

  chatNamespace.on("connection", (socket) => {
    console.log(`New client connected on /api: ${socket.id}`);
    console.log(
      `Total clients connected on /api: ${chatNamespace.server.engine.clientsCount}`
    );

    socket.on("message", (data) => {
      chatNamespace.emit("message", data);
    });

    socket.on("messageRead", (data) => {
      chatNamespace.emit("messageRead", data);
    });

    socket.on("comment", (data) => {
      chatNamespace.emit("comment", data);
    });

    socket.on("deleteComment", (data) => {
      chatNamespace.emit("deleteComment", data);
    });

  });


  server.listen(port, () => {
    setTimeout(() => {
      console.log(`Next.js + Socket.IO server listening on port ${port}`);
    }, 1000);
  });
});
