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
    console.log("User disconnected");
  });

  socket.on("loadUrl", (data) => {
    console.log("playing a new song: ");
    console.log(data)
  });
});
