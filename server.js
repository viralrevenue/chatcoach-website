const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId, role) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.role = role;
    console.log(`${role} joined room: ${roomId}`);
    socket.on("chat-message", (msg) => {
      // Send to everyone in the same room
      io.to(socket.roomId).emit("chat-message", {
        role: socket.role,
        message: msg,
      });
    });
  });

  socket.on("offer", (offer) => {
    socket.to(socket.roomId).emit("offer", offer);
  });

  socket.on("answer", (answer) => {
    socket.to(socket.roomId).emit("answer", answer);
  });

  socket.on("candidate", (candidate) => {
    socket.to(socket.roomId).emit("candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

http.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});
