const express = require("express");
const http = require("http");
const cors = require("cors");
const { setupSocket, drivers, users, getIO } = require("./sockets");
const prisma = require("./prismaClient");

const activeRides = require("./activeRides"); // Import active rides management

const app = express();
// app.use(cors({ origin: "http://localhost:3000" }));
app.use(cors({
  origin: "https://logistics-ankits-projects-8e1d9412.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
// app.use(cors({
//     origin: "*", // ⚠️ For dev only. Use specific domains in production!
//     methods: ["GET", "POST"],
//     credentials: true,
//   }));
app.use(express.json());

// Save confirmed ride
app.post("/api/rides/confirm", async (req, res) => {
  try {
    const {
      userId, driverId, pickup, pickupLat, pickupLon,
      dropoff, dropoffLat, dropoffLon,
      offerPrice, counterPrice
    } = req.body;
    const parsedOfferPrice = offerPrice !== undefined ? parseFloat(offerPrice) : null;
    const parsedCounterPrice = counterPrice !== undefined ? parseFloat(counterPrice) : null;
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

    // Find socket IDs
    const io = getIO();
    const userSocketId = Object.keys(users).find((sid) => users[sid] === userId);
    const driverSocketId = Object.keys(drivers).find((sid) => drivers[sid].id === driverId);

    // Emit to all drivers, and the specific user and driver
    Object.keys(drivers).forEach((sid) => {
      io.to(sid).emit("ride_confirmed", ride);
    });
    if (userSocketId) io.to(userSocketId).emit("ride_confirmed", ride);
    res.status(201).json(ride);

    if(ride && userSocketId && driverSocketId){
      activeRides[ride.id] = { userSocketId, driverSocketId, driverId: driverId , userId: userId };
      console.log(`Active ride added: ${ride.id} with user ${userId} and driver ${driverId}`);
      console.log(activeRides);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Express backend running on http://localhost:${PORT}`);
});
