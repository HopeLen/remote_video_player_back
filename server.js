const express = require("express");

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

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });

  socket.on("loadUrl", (data) => {
    console.log(`User ${socket.id} loaded a new song: `);
    console.log(data);

    socket.to(data.roomId).emit("loadUrl", data);
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User: ${socket.id} joined room: ${roomId}`);
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
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
});
