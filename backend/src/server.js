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
// CONNECT TO MONGODB
// ============================================

connectDB();


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