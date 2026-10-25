const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const {
  authMiddleware,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Route to create a new item
router.post("/create", authMiddleware, requireAdmin, itemController.createItem);

// Route to get all items with optional search
router.get(
  "/getall",
  authMiddleware,
  itemController.getAllItems
);

// Route to get item by ID
router.get(
  "/get/:id",
  authMiddleware,
  requireAdmin,
  itemController.getItemById
);

// Route to update item
router.put(
  "/update/:id",
  authMiddleware,
  requireAdmin,
  itemController.updateItem
);

// Route to delete item
router.delete(
  "/delete/:id",
  authMiddleware,
  requireAdmin,
  itemController.deleteItem
);

module.exports = router;
