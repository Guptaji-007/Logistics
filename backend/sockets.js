let io;
const drivers = {};
const users = {};
const activeRides = require("./activeRides");


const allowedOrigins = [
  "http://localhost:3000",
  "https://logistics-ankits-projects-8e1d9412.vercel.app"
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
      socket.on("register", ({ type, id, lat, lon }) => {
          if (type === "driver") {
            drivers[socket.id] = { id, lat, lon };
            // Update activeRides with new driver socket id for all rides of this driver
            // Object.entries(activeRides).forEach(([rideId, ride]) => {
            //   if (ride.driverId === id) {
            //     ride.driverSocketId = socket.id;
            //     console.log(`Updated activeRides for ride ${rideId}: new driverSocketId = ${socket.id}`);
            //   }
            // });
          }
          if (type === "user") users[socket.id] = id;
          // if (type === "user") {
          //   users[socket.id] = id;
            // Object.entries(activeRides).forEach(([rideId, ride]) => {
            //   if (ride.userId === id) {
            //     ride.userSocketId = socket.id;
            //     console.log(`Updated activeRides for ride ${rideId}: new user SocketId = ${socket.id}`);
            //   }
            // });
          // }

          console.log(`New client connected: ${socket.id} (${type})`);
          console.log("Current users:", users);
          console.log("Current drivers:", drivers);
    });
  
     socket.on("update_driver_location", (data) => {
      if(drivers[socket.id]) {
          drivers[socket.id].lat = data.lat;
          drivers[socket.id].lon = data.lon;
          console.log(`Updated location for driver ${socket.id}:`, data);
      }
  });


    socket.on("register1", ({ type, id, rideId, lat, lon }) => {
      if (type === "driver") {
        drivers[socket.id] = { id, lat, lon };
        if (rideId) {
          const room = `ride-${rideId}`;
          socket.join(room);
          // Optionally update activeRides here if needed
          console.log(`Driver ${id} joined room ${room}`);
        }
      }
      if (type === "user") {
        users[socket.id] = id;
        if (rideId) {
          const room = `ride-${rideId}`;
          socket.join(room);
          console.log(`User ${id} joined room ${room}`);
        }
      }
      console.log(`New client connected: ${socket.id} (${type})`);
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

    // socket.on("driver_location_update", ({ rideId, lat, lon }) => {
    //   const ride = activeRides[rideId];
    //   const driver = drivers[socket.id];
    //   console.log("driver_location_update received from socket:", socket.id, "for ride:", rideId);
    //   if (ride) {
    //     console.log("Expected driverId:", ride.driverId);
    //   }
    //   // if (ride && ride.driverId && drivers[socket.id] && drivers[socket.id].id === ride.driverId) {
    //   //   io.to(ride.userSocketId).emit("driver_location", { lat, lon, rideId });
    //   //   console.log("Emitted driver_location to userSocketId:", ride.userSocketId);
    //   // } else {
    //   //   console.log("driver_location_update ignored: not the assigned driver");
    //   // }
    //   // if (ride && ride.driverSocketId === socket.id) {
    //   if (ride && ride.driverId === driver.id ) {
        
    //     io.to(ride.userSocketId).emit("driver_location", { lat, lon, rideId });
    //     console.log("Emitted driver_location to userSocketId: email", users[ride.userSocketId], "rideId:", rideId, "lat:", lat, "lon:", lon);
    //   } else {
    //     console.log("driver_location_update ignored: not the assigned driver socket");
    //   }
    // });
    socket.on("driver_location_update", ({ rideId, lat, lon }) => {
      if (!rideId) return;
      const room = `ride-${rideId}`;
      io.to(room).emit("driver_location", { lat, lon, rideId });
      // Optionally log or handle errors
    });

    socket.on("disconnect", () => {
      delete drivers[socket.id];
      delete users[socket.id];
    });
  });
}

module.exports = { setupSocket, drivers, users, getIO: () => io };


