const express = require("express");
const http = require("http");
const cors = require("cors");
const { setupSocket, drivers, users, getIO } = require("./sockets");
const prisma = require("./prismaClient");

const activeRides = require("./activeRides"); 

const allowedOrigins = [
  "http://localhost:3000",
  "https://logistics-ankits-projects-8e1d9412.vercel.app",
  "https://logistics-hs8g.vercel.app",
  "https://logistics-zwhe.onrender.com/"
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

// Helper: Haversine Formula for distance
const haversine = (lat1, lon1, lat2, lon2) => {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
      return res.json(existing); 
    }

    const newRequest = await prisma.rideRequest.create({
      data: {
        userId, userName, userPhone,
        pickup, pickupLat, pickupLon,
        dropoff, dropoffLat, dropoffLon,
        offerPrice: parseFloat(offerPrice),
        serviceType, details,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
      }
    });

    // Notify nearby drivers via Socket
    const io = getIO();
    
    // PREPARE PAYLOAD WITH REQUEST ID
    const payload = {
      ...newRequest,
      requestId: newRequest.id // <--- CRITICAL FIX: Frontend expects this field
    };

    Object.values(drivers).forEach((driver) => {
       if (driver.lat && driver.lon) {
          // Check distance (10km radius)
          const dist = haversine(
             parseFloat(pickupLat), 
             parseFloat(pickupLon), 
             parseFloat(driver.lat), 
             parseFloat(driver.lon)
          );

          if (dist <= 10) {
            io.to(driver.socketId).emit("new_ride_request", payload);
            console.log(`Emitted request ${newRequest.id} to driver ${driver.socketId} (${dist.toFixed(2)}km away)`);
          }
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
      include: { responses: true } 
    });
    res.json(activeRequest || null);
  } catch (err) {
    res.status(500).json({ error: "Error fetching active request" });
  }
});

// 3. Get Nearby Requests (For Driver Reconnection)
// backend/server.js

// ... imports

// 3. Get Nearby Requests (UPDATED for Persistence)
app.get("/api/ride-request/nearby", async (req, res) => {
  const { lat, lon, driverId } = req.query; // <--- Accept driverId
  
  if (!lat || !lon) {
    return res.json([]);
  }

  try {
    // Fetch active requests (SEARCHING or NEGOTIATING only)
    // This ensures CONFIRMED rides are NOT returned.
    const activeRequests = await prisma.rideRequest.findMany({
      where: {
        status: { in: ["SEARCHING", "NEGOTIATING"] },
        expiresAt: { gt: new Date() }
      },
      include: {
        // Include responses ONLY from this specific driver
        // This lets the frontend know if this driver already countered
        responses: {
          where: { driverId: driverId || "undefined_driver" } 
        }
      }
    });
    
    // Filter by distance
    const nearby = activeRequests.filter(req => {
      const dist = haversine(
        parseFloat(req.pickupLat), 
        parseFloat(req.pickupLon), 
        parseFloat(lat), 
        parseFloat(lon)
      );
      return dist <= 10; // 10km radius
    });
    
    res.json(nearby);
  } catch(e) {
    console.error("Error fetching nearby:", e);
    res.status(500).json([]);
  }
});

// ... rest of server.js
// Save confirmed ride
app.post("/api/rides/confirm", async (req, res) => {
  try {
    const {
      requestId, 
      userId, driverId, 
      offerPrice, counterPrice,
      // We accept these from body, but we will fallback to DB if missing
      pickup, pickupLat, pickupLon,
      dropoff, dropoffLat, dropoffLon
    } = req.body;

    // 1. Fetch the original request to ensure we have valid location data
    let requestDetails = {};
    if (requestId) {
      const dbRequest = await prisma.rideRequest.findUnique({
        where: { id: requestId }
      });
      if (dbRequest) {
        requestDetails = dbRequest;
      }
    }

    // Validation: Ensure we have data from somewhere
    const finalPickup = pickup || requestDetails.pickup;
    if (!finalPickup) {
      return res.status(400).json({ error: "Missing ride details (pickup location)" });
    }

    const parsedOfferPrice = offerPrice !== undefined ? parseFloat(offerPrice) : (requestDetails.offerPrice || null);
    const parsedCounterPrice = counterPrice !== undefined ? parseFloat(counterPrice) : null;

    // 2. Create the Final Ride using DB data as fallback
    const ride = await prisma.ride.create({
      data: {
        userId,
        driverId,
        pickup: finalPickup,
        pickupLat: pickupLat || requestDetails.pickupLat,
        pickupLon: pickupLon || requestDetails.pickupLon,
        dropoff: dropoff || requestDetails.dropoff,
        dropoffLat: dropoffLat || requestDetails.dropoffLat,
        dropoffLon: dropoffLon || requestDetails.dropoffLon,
        status: "confirmed",
        offerPrice: parsedOfferPrice,
        counterPrice: parsedCounterPrice,
        confirmedAt: new Date(),
      },
    });

    // 3. Mark the Bid/Request as CONFIRMED
    if (requestId) {
      await prisma.rideRequest.update({
        where: { id: requestId },
        data: { status: "CONFIRMED" }
      }).catch(err => console.log("Error updating request status:", err));
    }

    const io = getIO();
    const userSocketId = users[userId];
    const driverData = drivers[driverId];

    Object.values(drivers).forEach((drv) => {
      io.to(drv.socketId).emit("ride_confirmed", ride);
    });

    if (userSocketId) io.to(userSocketId).emit("ride_confirmed", ride);

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

// ... rest of server.js

const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Express backend running on http://localhost:${PORT}`);
});