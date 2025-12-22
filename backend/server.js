const express = require("express");
const http = require("http");
const cors = require("cors");
const { setupSocket, drivers, users, getIO } = require("./sockets");
const prisma = require("./prismaClient");

const activeRides = require("./activeRides"); // Import active rides management

const allowedOrigins = [
  "http://localhost:3000",
  "https://logistics-ankits-projects-8e1d9412.vercel.app",
  "https://logistics-hs8g.vercel.app"
];

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());


// Add these routes to backend/server.js

// 1. Create a persistent Ride Request
app.post("/api/ride-request", async (req, res) => {
  try {
    const { 
      userId, userName, userPhone, 
      pickup, pickupLat, pickupLon, 
      dropoff, dropoffLat, dropoffLon, 
      offerPrice, serviceType, details 
    } = req.body;

    // Check if user already has an active request
    const existing = await prisma.rideRequest.findFirst({
      where: { 
        userId, 
        status: { in: ["SEARCHING", "NEGOTIATING"] },
        expiresAt: { gt: new Date() }
      }
    });

    if (existing) {
      return res.json(existing); // Return existing active request
    }

    const newRequest = await prisma.rideRequest.create({
      data: {
        userId, userName, userPhone,
        pickup, pickupLat, pickupLon,
        dropoff, dropoffLat, dropoffLon,
        offerPrice: parseFloat(offerPrice),
        serviceType, details,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
      }
    });

    // Notify nearby drivers via Socket (using the exported IO)
    const io = getIO();
    Object.values(drivers).forEach((driver) => {
       // Re-implement your haversine logic here to filter nearby drivers
       if (driver.lat && driver.lon) {
          // Send the simplified payload needed for the UI
          io.to(driver.socketId).emit("new_ride_request", newRequest);
       }
    });

    res.status(201).json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create ride request" });
  }
});

// 2. Get Active Request (For User Reconnection)
app.get("/api/ride-request/active/:userId", async (req, res) => {
  try {
    const activeRequest = await prisma.rideRequest.findFirst({
      where: {
        userId: req.params.userId,
        status: { in: ["SEARCHING", "NEGOTIATING"] },
        expiresAt: { gt: new Date() }
      },
      include: { responses: true } // Include driver bids
    });
    res.json(activeRequest || null);
  } catch (err) {
    res.status(500).json({ error: "Error fetching active request" });
  }
});

// 3. Get Nearby Requests (For Driver Reconnection)
app.get("/api/ride-request/nearby", async (req, res) => {
  const { lat, lon } = req.query;
  // In a real app, use PostGIS. Here we fetch active and filter in JS for simplicity or use raw SQL.
  // For simplicity, returning all active requests:
  const activeRequests = await prisma.rideRequest.findMany({
    where: {
      status: { in: ["SEARCHING", "NEGOTIATING"] },
      expiresAt: { gt: new Date() }
    }
  });
  
  // Filter logic (optional, dependent on your haversine function availability)
  // const nearby = activeRequests.filter(...) 
  
  res.json(activeRequests);
});


// Save confirmed ride
// ... existing imports

app.post("/api/rides/confirm", async (req, res) => {
  try {
    const {
      requestId, // <--- Extract the Request ID
      userId, driverId, pickup, pickupLat, pickupLon,
      dropoff, dropoffLat, dropoffLon,
      offerPrice, counterPrice
    } = req.body;

    const parsedOfferPrice = offerPrice !== undefined ? parseFloat(offerPrice) : null;
    const parsedCounterPrice = counterPrice !== undefined ? parseFloat(counterPrice) : null;

    // 1. Create the Final Ride
    const ride = await prisma.ride.create({
      data: {
        userId,
        driverId,
        pickup,
        pickupLat,
        pickupLon,
        dropoff,
        dropoffLat,
        dropoffLon,
        status: "confirmed",
        offerPrice: parsedOfferPrice,
        counterPrice: parsedCounterPrice,
        confirmedAt: new Date(),
      },
    });

    // 2. Mark the Bid/Request as CONFIRMED (FIX)
    // This stops it from showing up as an "active" request in the future
    if (requestId) {
      await prisma.rideRequest.update({
        where: { id: requestId },
        data: { status: "CONFIRMED" }
      }).catch(err => console.log("Error updating request status:", err));
    }

    // ... existing socket notification logic ...
    const io = getIO();
    const userSocketId = users[userId];
    const driverData = drivers[driverId];

    Object.values(drivers).forEach((drv) => {
      io.to(drv.socketId).emit("ride_confirmed", ride);
    });

    if (userSocketId) io.to(userSocketId).emit("ride_confirmed", ride);

    // Add to activeRides
    if(ride){
      activeRides[ride.id] = { 
        userSocketId, 
        driverSocketId: driverData ? driverData.socketId : null, 
        driverId, 
        userId 
      };
    }

    res.status(201).json(ride);
  } catch (err) {
    console.error("Error confirming ride:", err);
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Express backend running on http://localhost:${PORT}`);
});