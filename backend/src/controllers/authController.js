const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const generateCode = require("../utils/generateCode");

const {
  errorMessages,
  successMessages,
  handleError,
  handleBadRequest,
  handleSuccess,
  handleUnauthorized,
  handleNotFound,
} = require("./errorController");

const { sendResetCode } = require("../services/emailService");

const SECRET_KEY = process.env.SECRET_KEY;


// ==========================================
// Signup Controller
// ==========================================

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return handleBadRequest(
        res,
        null,
        errorMessages.MISSING_FIELDS
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if username already exists
    const existingUserByUsername = await User.findOne({
      name: {
        $regex: new RegExp(
          `^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    });

    // Check if email already exists
    const existingUserByEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingUserByUsername) {
      return handleBadRequest(
        res,
        null,
        errorMessages.USERNAME_TAKEN
      );
    }

    if (existingUserByEmail) {
      return handleBadRequest(
        res,
        null,
        errorMessages.EMAIL_REGISTERED
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in MongoDB
    const savedUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashedPassword,
      role: role || "admin",
    });

    return handleSuccess(
      res,
      successMessages.USER_CREATED,
      {
        user: {
          name: savedUser.name,
        },
      },
      201
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_CREATING_USER
    );
  }
};


// ==========================================
// Signin Controller
// ==========================================

exports.signin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return handleBadRequest(
        res,
        null,
        errorMessages.USERNAME_AND_PASSWORD_REQUIRED
      );
    }

    const cleanIdentifier = String(identifier).trim();
    let user;

    // Login using email
    if (cleanIdentifier.includes("@")) {
      user = await User.findOne({
        email: {
          $regex: new RegExp(
            `^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i"
          ),
        },
      });
    }

    // Login using username
    else {
      user = await User.findOne({
        name: {
          $regex: new RegExp(
            `^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i"
          ),
        },
      });
    }

    // User not found
    if (!user) {
      return handleUnauthorized(
        res,
        null,
        errorMessages.INVALID_CREDENTIALS
      );
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return handleUnauthorized(
        res,
        null,
        errorMessages.INVALID_CREDENTIALS
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id || user.id,
        name: user.name,
        role: user.role,
      },
      SECRET_KEY,
      {
        expiresIn: "7d",
        algorithm: "HS256",
      }
    );

    return handleSuccess(
      res,
      successMessages.USER_LOGGED_IN,
      {
        token,
        user: {
          name: user.name,
          userId: user._id || user.id,
          email: user.email,
          role: user.role,
          designation: user.designation,
          phone: user.phone,
        },
      },
      200
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};


// ==========================================
// Forgot Password Controller
// ==========================================

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return handleBadRequest(
        res,
        null,
        errorMessages.VALID_EMAIL_REQUIRED
      );
    }

    // Find user using MongoDB
    const user = await User.findOne({
      email: email,
    });

    if (!user) {
      return handleNotFound(
        res,
        null,
        errorMessages.USER_NOT_FOUND
      );
    }

    // Generate OTP
    const otpCode = generateCode();

    // Store OTP in session
    req.session.passwordReset = {
      userId: user.id,
      email: user.email,
      otp: otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    // Send reset code
    sendResetCode(email, otpCode).catch((err) => {
      console.error(
        errorMessages.RESET_EMAIL_ERROR,
        err
      );
    });

    return handleSuccess(
      res,
      successMessages.RESET_CODE_SENT
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};


// ==========================================
// Verify Reset Code Controller
// ==========================================

exports.verifyResetCode = async (req, res) => {
  try {
    const { otp } = req.body;

    const passwordResetSession =
      req.session?.passwordReset;

    if (!otp) {
      return handleBadRequest(
        res,
        null,
        errorMessages.INVALID_OTP
      );
    }

    // Check session
    if (!passwordResetSession) {
      return handleUnauthorized(
        res,
        null,
        errorMessages.RESET_SESSION_EXPIRED_OR_NOT_FOUND
      );
    }

    // Check OTP expiry
    if (
      Date.now() >
      passwordResetSession.expiresAt
    ) {
      delete req.session.passwordReset;

      return handleBadRequest(
        res,
        null,
        errorMessages.OTP_EXPIRED
      );
    }

    // Check OTP
    if (
      String(otp) !==
      String(passwordResetSession.otp)
    ) {
      return handleBadRequest(
        res,
        null,
        errorMessages.INVALID_OTP
      );
    }

    // Mark OTP verified
    req.session.passwordReset.verified = true;

    return handleSuccess(
      res,
      successMessages.VERIFICATION_CODE_VALID
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};


// ==========================================
// Reset Password Controller
// ==========================================

exports.resetPassword = async (req, res) => {
  try {
    const {
      newPassword,
      confirmNewPassword,
    } = req.body;

    const passwordResetSession =
      req.session?.passwordReset;

    // Check verified session
    if (
      !passwordResetSession ||
      !passwordResetSession.verified
    ) {
      return handleUnauthorized(
        res,
        null,
        errorMessages.VERIFY_OTP_FIRST
      );
    }

    // Check session expiry
    if (
      Date.now() >
      passwordResetSession.expiresAt
    ) {
      delete req.session.passwordReset;

      return handleBadRequest(
        res,
        null,
        errorMessages.SESSION_EXPIRED
      );
    }

    // Password validation
    if (
      !newPassword ||
      newPassword.length < 8
    ) {
      return handleBadRequest(
        res,
        null,
        errorMessages.WEAK_PASSWORD
      );
    }

    // Confirm password
    if (
      newPassword !== confirmNewPassword
    ) {
      return handleBadRequest(
        res,
        null,
        errorMessages.PASSWORDS_DO_NOT_MATCH
      );
    }

    // Hash new password
    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    // Update user in MongoDB
    const updatedUser =
      await User.findByIdAndUpdate(
        passwordResetSession.userId,
        {
          passwordHash: hashedPassword,
        },
        {
          new: true,
        }
      );

    if (!updatedUser) {
      return handleNotFound(
        res,
        null,
        errorMessages.USER_NOT_FOUND
      );
    }

    // Remove reset session
    delete req.session.passwordReset;

    return handleSuccess(
      res,
      successMessages.PASSWORD_UPDATED_SUCCESSFULLY,
      {
        user: {
          name: updatedUser.name,
        },
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};


// ==========================================
// Logout Controller
// ==========================================

exports.logOut = async (req, res) => {
  return handleSuccess(
    res,
    successMessages.LOGOUT_SUCCESSFUL
  );
};