// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

const path = require("path");

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

require("dotenv").config({
  path: path.resolve(__dirname, envFile),
});


// ============================================
// CRON JOBS
// ============================================

require("./cron/reminderJob");
require("./cron/keepAliveJob");


// ============================================
// PACKAGES
// ============================================

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("./config/socket");

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = require("./config/db");


// ============================================
// ROUTES IMPORT
// ============================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const carRoutes = require("./routes/carRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const customerRoutes = require("./routes/customerRoutes");
const itemRoutes = require("./routes/itemRoutes");
const jobCardRoutes = require("./routes/jobCardRoutes");


// ============================================
// CREATE EXPRESS APP
// ============================================

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
initSocket(io);
io.on("connection", (socket) => {
  socket.on("joinRoom", (userId) => {
    socket.join(userId);

    console.log(`User ${userId} joined room`);
    console.log(socket.rooms);
  });
  console.log("Client Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client Disconnected:", socket.id);
  });
});
const PORT = process.env.PORT || 5000;


// ============================================
// CONNECT TO MONGODB & AUTO-SYNC ADMIN & DATA
// ============================================

const ensureAdminAndData = async () => {
  try {
    const { User, Service } = require("./models");
    const bcrypt = require("bcrypt");
    const adminEmail = "23se02it070@ppsu.ac.in";
    const targetPassword = process.env.ADMIN_PASSWORD || "Darshita@0506";
    const hashedPassword = await bcrypt.hash(targetPassword, 12);

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: "Darshita Dhankecha",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "admin",
        isActive: true,
      });
      console.log("Created admin user:", adminEmail);
    } else {
      admin.passwordHash = hashedPassword;
      admin.role = "admin";
      admin.name = "Darshita Dhankecha";
      await admin.save();
      console.log("Synced admin password for:", adminEmail);
    }

    // Auto-seed collections if empty
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      const fs = require("fs");
      const path = require("path");
      const seedFilePath = path.resolve(__dirname, "../seedData.json");
      if (fs.existsSync(seedFilePath)) {
        const seedData = JSON.parse(fs.readFileSync(seedFilePath, "utf8"));
        const mongoose = require("mongoose");
        for (const [colName, docs] of Object.entries(seedData)) {
          if (!docs || docs.length === 0 || colName === "users") continue;
          const col = mongoose.connection.collection(colName);
          const count = await col.countDocuments();
          if (count === 0) {
            const formatted = docs.map((doc) => {
              const d = { ...doc };
              if (d._id) d._id = new mongoose.Types.ObjectId(d._id);
              if (d.customerId) d.customerId = new mongoose.Types.ObjectId(d.customerId);
              if (d.carId) d.carId = new mongoose.Types.ObjectId(d.carId);
              if (d.serviceId) d.serviceId = new mongoose.Types.ObjectId(d.serviceId);
              if (d.assignedTo && mongoose.Types.ObjectId.isValid(d.assignedTo)) {
                d.assignedTo = new mongoose.Types.ObjectId(d.assignedTo);
              }
              return d;
            });
            await col.insertMany(formatted);
            console.log(`Auto-seeded ${formatted.length} into ${colName}`);
          }
        }
      }
    }
  } catch (err) {
    console.warn("ensureAdminAndData warning:", err.message);
  }
};

connectDB().then(() => ensureAdminAndData());


// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));


// Parse JSON Body
app.use(express.json());

// Cookie Parser
app.use(cookieParser());

// Trust Proxy
app.set("trust proxy", 1);


// ============================================
// SESSION CONFIGURATION
// ============================================

const sessionConfig = {
  secret: process.env.SESSION_SECRET || "fallback",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
  },
};

const mongoSessionUrl = process.env.MONGO_URI || process.env.MONGODB_URI;
if (mongoSessionUrl) {
  try {
    sessionConfig.store = MongoStore.create({
      mongoUrl: mongoSessionUrl,
    });
  } catch (err) {
    console.warn("MongoStore initialization warning:", err.message);
  }
}

app.use(session(sessionConfig));


// ============================================
// API ROUTES
// ============================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/cars",
  carRoutes
);

app.use(
  "/api/services",
  serviceRoutes
);

app.use(
  "/api/customers",
  customerRoutes
);

app.use(
  "/api/items",
  itemRoutes
);

// Job Card Routes
app.use(
  "/api/job-cards",
  jobCardRoutes
);


// ============================================
// TEST ROUTE
// ============================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Bhavani Motors API is running",
  });
});


// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});


// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
module.exports.server = server;