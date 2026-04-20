const express = require("express");
const path = require("path");

const PORT = 3000;

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("Server running");
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Fix __dirname for ES modules
app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", async () => {
    console.log(`User ${socket.id} disconnected`);
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const sockets = await io.in(roomId).fetchSockets();

    const users = sockets.map((s) => ({
      id: s.id,
      name: s.data.name,
    }));

    io.to(roomId).emit("user-action", socket.id);
    io.to(roomId).emit("room-users", users);
  });

  socket.on("loadUrl", (data) => {
    console.log(`User ${socket.id} loaded a new song: `);
    console.log(data);

    socket.to(data.roomId).emit("loadUrl", data);
    io.to(data.roomId).emit("user-action", socket.id);
  });

  socket.on("joinRoom", async ({ roomId, name }) => {
    socket.join(roomId);

    // Store user data ON the socket
    socket.data.name = name;
    socket.data.roomId = roomId;

    // Get all sockets in the room
    const sockets = await io.in(roomId).fetchSockets();

    // Build user list
    const users = sockets.map((s) => ({
      id: s.id,
      name: s.data.name,
    }));

    // Send full list to everyone (or just the new user if you prefer)
    io.to(roomId).emit("room-users", users);
    io.to(roomId).emit("user-action", socket.id);
    console.log(`User: ${socket.id} named: ${name} joined room: ${roomId}`);
  });

  socket.on("leaveRoom", async (roomId) => {
    socket.leave(roomId);
    if (!roomId) return;

    const sockets = await io.in(roomId).fetchSockets();

    const users = sockets.map((s) => ({
      id: s.id,
      name: s.data.name,
    }));

    io.to(roomId).emit("user-action", socket.id);
    io.to(roomId).emit("room-users", users);
    console.log(`User: ${socket.id} left room: ${roomId}`);
  });

  socket.on("client:play", (data) => {
    console.log(
      `User ${socket.id} set the video of room: ${data.roomId} to ${data.playing}`,
    );

    io.to(data.roomId).emit("room:play");
  });

  socket.on("client:pause", (data) => {
    console.log(
      `User ${socket.id} set the video of room: ${data.roomId} to ${data.playing}`,
    );

    io.to(data.roomId).emit("room:pause");
  });
  socket.on("client:looped", (data) => {
    console.log(
      `User ${socket.id} set the loop of the video to ${data.looped} of the room ${data.roomId}`,
    );
    io.to(data.roomId).emit("server:looped", data.looped);
  });
});
