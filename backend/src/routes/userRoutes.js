const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Route for Get All Staff
router.get("/staff", authMiddleware, userController.getAllStaff);

// Route for Get Single Staff by ID
router.get("/staff/:id", authMiddleware, userController.getStaffById);

// Route for Create Staff
router.post("/staff", authMiddleware, userController.createStaff);

// Route for Update Staff
router.put("/staff/:id", authMiddleware, userController.updateStaff);
router.put("/updateuser/:id", authMiddleware, userController.updateStaff);

// Route for Get All Users
router.get("/getall", authMiddleware, userController.getAllUsers);

// Route for Delete User
router.delete(
  "/deleteuser/:id",
  authMiddleware,
  userController.deleteUser
);

module.exports = router;