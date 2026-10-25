const jwt = require("jsonwebtoken");
const { User } = require("../models");

const {
  handleUnauthorized,
  errorMessages,
} = require("../controllers/errorController");

const SECRET_KEY = process.env.SECRET_KEY;

// Bearer Token Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return handleUnauthorized(
        res,
        null,
        errorMessages.NO_ACTIVE_SESSION
      );
    }

    // Get token
    const token = authHeader.split(" ")[1];

    // Verify JWT token
    const payload = jwt.verify(
      token,
      SECRET_KEY
    );

    // Find user in MongoDB
    const user = await User.findById(
      payload.userId
    ).select("-passwordHash");

    // User not found
    if (!user) {
      return handleUnauthorized(
        res,
        null,
        "User not found. Please sign in again."
      );
    }
    // Store logged-in user
    req.user = user;

    next();
  } catch (error) {
    return handleUnauthorized(
      res,
      null,
      "Invalid token. Please sign in again."
    );
  }
};

// Only Allow Admins
const requireAdmin = (
  req,
  res,
  next
) => {
  if (
    !req.user ||
    req.user.role !== "admin"
  ) {
    return handleUnauthorized(
      res,
      null,
      "Admin privileges required."
    );
  }

  next();
};

module.exports = {
  authMiddleware,
  requireAdmin,
};