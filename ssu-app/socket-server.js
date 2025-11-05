const http = require("http");
const { Server } = require("socket.io");

const port = process.env.PORT || 3002;

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for WebSocket connections
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);
  console.log(`Total clients connected: ${io.engine.clientsCount}`);

  socket.on("message", (data) => {
    io.emit("message", data);
  });

  socket.on("messageRead", (data) => {
    io.emit("messageRead", data);
  });

  socket.on("comment", (data) => {
    io.emit("comment", data);
  });

  socket.on("deleteComment", (data) => {
    io.emit("deleteComment", data);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`Socket.IO server listening on port ${port}`);
});
