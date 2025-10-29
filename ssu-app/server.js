const http = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || '3000', 10);

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    // Let Socket.IO handle its own polling endpoints; avoid Next adding redirects/headers
    if (req.url && req.url.startsWith('/socket.io')) {
      return; // socket.io has its own 'request' listener attached below
    }
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // path remains default '/socket.io'
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    console.log(`Total clients connected: ${io.engine.clientsCount}`);

    socket.on('message', (data) => {
      io.emit('message', data);
    });

    socket.on('messageRead', (data) => {
      io.emit('messageRead', data);
    });

    socket.on('comment', (data) => {
      io.emit('comment', data);
    });

    socket.on('deleteComment', (data) => {
      io.emit('deleteComment', data);
    });

    socket.on('disconnect', () => {});
  });

  server.listen(port, () => {
    setTimeout(() => {
      console.log(`Next.js + Socket.IO server listening on port ${port}`);
    }, 1000);
  });
});


