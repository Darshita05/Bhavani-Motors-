const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Route for User Registration

router.post("/register", authController.signup);

// Route for User Signin

router.post("/login", authController.signin);

// Route for Forgot Password

router.post("/forgotpassword", authController.forgotPassword);

// Route for Verify OTP

router.post("/verifyotp", authController.verifyResetCode);

// Route for Reset Password

router.post("/resetpassword", authController.resetPassword);

// Route for User Logout

router.post("/logout", authMiddleware, authController.logOut);

module.exports = router;
