let io;
const drivers = {};
const users = {};

function setupSocket(server) {
  io = require("socket.io")(server, {
    cors: { origin: "http://localhost:3000" }
  });

  io.on("connection", (socket) => {
      socket.on("register", ({ type, id }) => {
          if (type === "driver") drivers[socket.id] = id;
          if (type === "user") users[socket.id] = id;
          console.log(`New client connected: ${socket.id} (${type})`);
          console.log("Current users:", users);
        console.log("Current drivers:", drivers);
    });

    socket.on("ride_request", (data) => {
        console.log("Ride request received:", data);
      Object.keys(drivers).forEach((sid) => {
        io.to(sid).emit("new_ride_request", data);
      });
    });

    socket.on("driver_response", (data) => {
      console.log("Driver response received:", data);
      const userSocketId = Object.keys(users).find(
        (sid) => users[sid] === data.userId
      );
      if (userSocketId) {
        io.to(userSocketId).emit("driver_response", data);
      }
      else {
        console.log("User not connected:", data.userId);
      }
    });

    socket.on("driver_counter_response", (data) => {
      console.log("Driver counter response received:", data);
      const userSocketId = Object.keys(users).find(
        (sid) => users[sid] === data.userId
      );
      if (userSocketId) {
        io.to(userSocketId).emit("driver_counter_response", data);
      }
      else {
        console.log("User not connected for counter response:", data.userId);
      }
    });

    socket.on("user_counter_response", (data) => {
      const driverSocketId = Object.keys(drivers).find(
        (sid) => drivers[sid] === data.driverId
      );
      if (driverSocketId) {
        io.to(driverSocketId).emit("user_counter_response", data);
      }
    });

    


    socket.on("disconnect", () => {
      delete drivers[socket.id];
      delete users[socket.id];
    });
  });
}

module.exports = { setupSocket, drivers, users, getIO: () => io };
