let io;
const drivers = {};
const users = {};

function setupSocket(server) {
  io = require("socket.io")(server, {
    cors: { origin: "http://localhost:3000" }
  });

  const haversine = (lat1, lon1, lat2, lon2) => {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  io.on("connection", (socket) => {
      socket.on("register", ({ type, id, lat, lon }) => {
          if (type === "driver") {
            drivers[socket.id] = { id, lat, lon };
          }
          if (type === "user") users[socket.id] = id;
          console.log(`New client connected: ${socket.id} (${type})`);
          console.log("Current users:", users);
          console.log("Current drivers:", drivers);
    });

    socket.on("ride_request", (data) => {
        console.log("Ride request received:", data);
        const { pickupLat, pickupLon } = data;
        console.log("Pickup coordinates:", pickupLat, pickupLon);
        Object.entries(drivers).forEach(([sid, driver]) => {
          if (
            driver.lat !== undefined &&
            driver.lon !== undefined &&
            haversine(pickupLat, pickupLon, driver.lat, driver.lon) <= 10
          ) {
            io.to(sid).emit("new_ride_request", data);
          }
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
        (sid) => drivers[sid].id === data.driverId
      );
      if (driverSocketId) {
        io.to(driverSocketId).emit("user_counter_response", data);
      } else {
        console.log("Driver not connected for user counter response:", data.driverId);
      }
    });

    socket.on("disconnect", () => {
      delete drivers[socket.id];
      delete users[socket.id];
    });
  });
}

module.exports = { setupSocket, drivers, users, getIO: () => io };
