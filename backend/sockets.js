let io;
const drivers = {}; // Maps driverId -> { socketId, lat, lon }
const users = {};   // Maps userId -> socketId
const activeRides = require("./activeRides");

const allowedOrigins = [
  "http://localhost:3000",
  "https://logistics-ankits-projects-8e1d9412.vercel.app",
  "https://logistics-hs8g.vercel.app"
];

function setupSocket(server) {
  io = require("socket.io")(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    }
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
      console.log(`New client connected: ${socket.id}`);

      // Unified register event handling both initial connection and page refreshes
      socket.on("register", ({ type, id, lat, lon, rideId }) => {
          if (!id) return;

          if (type === "driver") {
            // Store by driverId so we can find it easily later
            drivers[id] = { socketId: socket.id, lat, lon };
            socket.driverId = id; // Tag socket for disconnect cleanup

            if (rideId) {
              const room = `ride-${rideId}`;
              socket.join(room);
              console.log(`Driver ${id} rejoined room ${room}`);
            }
          }
          
          if (type === "user") {
            // Store by userId
            users[id] = socket.id;
            socket.userId = id; // Tag socket for disconnect cleanup

            if (rideId) {
              const room = `ride-${rideId}`;
              socket.join(room);
              console.log(`User ${id} rejoined room ${room}`);
            }
          }

          console.log(`Registered ${type}: ${id} on socket ${socket.id}`);
          console.log("Current users (ID -> Socket):", users);
          console.log("Current drivers (ID -> Data):", drivers);
    });
  
    socket.on("update_driver_location", (data) => {
      const driverId = socket.driverId;
      if (driverId && drivers[driverId]) {
          drivers[driverId].lat = data.lat;
          drivers[driverId].lon = data.lon;
          console.log(`Updated location for driver ${driverId}:`, data);
          
          // If the driver is in a ride room, emit location to that room immediately
          // (Optional: depends on if client sends rideId in this event or if we track it)
          // if (activeRides...) 
      }
    });

    socket.on("ride_request", (data) => {
        console.log("Ride request received:", data);
        const { pickupLat, pickupLon } = data;
        
        // Iterate over values since drivers is now keyed by driverId
        Object.values(drivers).forEach((driver) => {
          if (
            driver.lat !== undefined &&
            driver.lon !== undefined &&
            haversine(pickupLat, pickupLon, driver.lat, driver.lon) <= 10
          ) {
            io.to(driver.socketId).emit("new_ride_request", data);
          }
        });
    });

    socket.on("driver_response", (data) => {
      console.log("Driver response received:", data);
      // Direct lookup using userId
      const userSocketId = users[data.userId];
      
      if (userSocketId) {
        io.to(userSocketId).emit("driver_response", data);
      } else {
        console.log("User not connected:", data.userId);
      }
    });

    socket.on("driver_counter_response", (data) => {
      console.log("Driver counter response received:", data);
      const userSocketId = users[data.userId];
      
      if (userSocketId) {
        io.to(userSocketId).emit("driver_counter_response", data);
      } else {
        console.log("User not connected for counter response:", data.userId);
      }
    });

    socket.on("user_counter_response", (data) => {
      const driverData = drivers[data.driverId];
      
      if (driverData && driverData.socketId) {
        io.to(driverData.socketId).emit("user_counter_response", data);
      } else {
        console.log("Driver not connected for user counter response:", data.driverId);
      }
    });

    socket.on("driver_location_update", ({ rideId, lat, lon }) => {
      if (!rideId) return;
      const room = `ride-${rideId}`;
      // Emitting to the room ensures the user gets it if they are joined
      io.to(room).emit("driver_location", { lat, lon, rideId });
    });

    socket.on("disconnect", () => {
      // Cleanup using tags
      if (socket.userId) {
        delete users[socket.userId];
        console.log(`User ${socket.userId} disconnected`);
      }
      if (socket.driverId) {
        delete drivers[socket.driverId];
        console.log(`Driver ${socket.driverId} disconnected`);
      }
    });
  });
}

module.exports = { setupSocket, drivers, users, getIO: () => io };