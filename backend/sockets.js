const prisma = require("./prismaClient");

let io;
const drivers = {}; 
const users = {};  
 

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
    const R = 6371; 
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Register
    socket.on("register", ({ type, id, lat, lon, rideId }) => {
      if (!id) return;
      if (type === "driver") {
        drivers[id] = { socketId: socket.id, lat, lon };
        socket.driverId = id; 
        if (rideId) socket.join(`ride-${rideId}`);
      }
      if (type === "user") {
        users[id] = socket.id;
        socket.userId = id; 
        if (rideId) socket.join(`ride-${rideId}`);
      }
    });

    // Driver Location Update
    socket.on("update_driver_location", (data) => {
      const driverId = socket.driverId;
      if (driverId && drivers[driverId]) {
        drivers[driverId].lat = data.lat;
        drivers[driverId].lon = data.lon;
      }
    });

    // === CRITICAL FIX: Create DB Entry BEFORE Emitting ===
    socket.on("ride_request", async (data) => {
      console.log("Ride request received:", data);
      
      try {
        // 1. Create the persistent request in the DB
        const savedRequest = await prisma.rideRequest.create({
          data: {
            userId: data.userId,
            userName: data.name, 
            userPhone: data.phone, 
            pickup: data.pickup,
            pickupLat: parseFloat(data.pickupLat),
            pickupLon: parseFloat(data.pickupLon),
            dropoff: data.dropoff,
            dropoffLat: parseFloat(data.dropoffLat),
            dropoffLon: parseFloat(data.dropoffLon),
            offerPrice: parseFloat(data.offerPrice),
            serviceType: data.serviceType,
            details: data.details,
            status: "SEARCHING",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
          }
        });

        console.log("Request created with ID:", savedRequest.id);

        // 2. Attach the new DB ID to the payload sent to drivers
        const payload = {
          ...data,
          requestId: savedRequest.id, // <--- This ensures the Driver gets the ID
          id: savedRequest.id
        };

        // 3. Emit to nearby drivers
        const { pickupLat, pickupLon } = data;
        Object.values(drivers).forEach((driver) => {
          if (
            driver.lat !== undefined && driver.lon !== undefined &&
            haversine(pickupLat, pickupLon, driver.lat, driver.lon) <= 10
          ) {
            io.to(driver.socketId).emit("new_ride_request", payload);
          }
        });

      } catch (err) {
        console.error("Error creating ride request in DB:", err);
      }
    });

    // Unified Response Handler (Accept/Counter)
    const handleDriverResponse = async (data, isCounter) => {
      console.log(`Driver ${isCounter ? 'Counter' : 'Response'} received:`, data);
      
      if (!data.requestId) {
        console.error("Error: requestId is missing. Make sure ride_request creates the DB entry first.");
        return;
      }

      try {
        const dbStatus = isCounter ? 'countered' : (data.status === 'accepted' ? 'offered' : data.status);
        const price = parseFloat(isCounter ? data.counterPrice : (data.offerPrice || data.counterPrice));

        const response = await prisma.rideResponse.create({
          data: {
            requestId: data.requestId, 
            driverId: data.driverId,
            status: dbStatus,
            price: price,
            driverName: data.driverName, 
            driverPhone: data.driverPhone 
          }
        });

        await prisma.rideRequest.update({
          where: { id: data.requestId },
          data: { status: "NEGOTIATING" }
        });

        const userSocketId = users[data.userId];
        const eventName = isCounter ? "driver_counter_response" : "driver_response";
        
        if (userSocketId) {
          io.to(userSocketId).emit(eventName, {
            ...data,
            responseId: response.id,
            status: dbStatus 
          });
        }
      } catch (e) {
        console.error("Error saving driver response:", e);
      }
    };

    socket.on("driver_response", (data) => handleDriverResponse(data, false));
    socket.on("driver_counter_response", (data) => handleDriverResponse(data, true));

    socket.on("user_counter_response", (data) => {
      const driverData = drivers[data.driverId];
      if (driverData && driverData.socketId) {
        io.to(driverData.socketId).emit("user_counter_response", data);
      }
    });

    socket.on("driver_location_update", ({ rideId, lat, lon }) => {
      if (!rideId) return;
      io.to(`ride-${rideId}`).emit("driver_location", { lat, lon, rideId });
    });


    // === NEW: Assigned Driver Logic ===
    
    // 1. Driver joins using the unique code
    socket.on("join_assigned_ride", async ({ code }) => {
      try {
        console.log(`Attempting to join with code: ${code}`);
        // Verify code in DB
        const ride = await prisma.ride.findFirst({
          where: { 
            driverVerificationCode: code,
            assignmentStatus: { in: ["assigned", "in_progress"] },
            completed: false
          }
        });

        if (!ride) {
          socket.emit("error", { message: "Invalid or expired code" });
          return;
        }

        // Mark as verified if not already (first login)
        if (!ride.isDriverVerified) {
          await prisma.ride.update({
            where: { id: ride.id },
            data: { 
              isDriverVerified: true, 
              assignmentStatus: "in_progress" 
            }
          });
        }

        // Store socket info
        socket.assignedRideId = ride.id;
        socket.join(`ride-${ride.id}`); // Join the specific ride room
        
        // Notify User and Manager that driver has connected
        io.to(`ride-${ride.id}`).emit("driver_connected", { 
          rideId: ride.id,
          message: "Driver has connected and is ready."
        });
        
        // Send ride details back to driver
        socket.emit("ride_details", ride);

      } catch (error) {
        console.error("Error joining assigned ride:", error);
        socket.emit("error", { message: "Server error during verification" });
      }
    });

    // 2. Assigned Driver Location Update
    socket.on("assigned_driver_location", ({ lat, lon }) => {
      const rideId = socket.assignedRideId;
      if (!rideId) return;

      // Broadcast to everyone in the ride room (User and Manager)
      io.to(`ride-${rideId}`).emit("driver_location", { 
        lat, 
        lon, 
        rideId 
      });

    // === NEW: Ride Status Updates (Start/Complete) ===
    socket.on("ride_status_update", ({ rideId, status }) => {
      console.log(`Ride ${rideId} status update: ${status}`);
      // Broadcast to User and Manager tracking this ride
      io.to(`ride-${rideId}`).emit("ride_status_update", { 
        rideId, 
        status 
      });
    });
      
      // Optional: Update DB for persistence
      // prisma.ride.update({ where: { id: rideId }, data: { dropoffLat: lat, dropoffLon: lon } }).catch(() => {});
    });

    socket.on("disconnect", () => {
      if (socket.userId) delete users[socket.userId];
      if (socket.driverId) delete drivers[socket.driverId];
    });
  });
}

module.exports = { setupSocket, drivers, users, getIO: () => io };