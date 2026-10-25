const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Route for Create Service

router.post("/create", authMiddleware, serviceController.createService);

// Route for Get All Services

router.get("/getall", authMiddleware, serviceController.getAllServices);

// Route for Get Active Services

// router.get("/get/active", authMiddleware, serviceController.getActiveServices);

// Route for Get Services by Pagination

router.get(
  "/get/pagination",
  authMiddleware,
  serviceController.getServicesWithPagination
);

// Route for Get Services by Pagination of 10 records per page

router.get(
  "/get/pagination/10",
  authMiddleware,
  serviceController.getServicesWithPaginationOf10
);

// Route for Get Service by ID

router.get("/get/:id", authMiddleware, serviceController.getServiceById);

// Route for Update Service by ID

router.put("/update/:id", authMiddleware, serviceController.updateService);

// Route for Update collectedCost By Id

router.patch("/collect-cost/:id", serviceController.addToCollectedCost);

// Route for Get Monthly Stats
router.get("/monthly-stats", authMiddleware, serviceController.getMonthlyStats);

// Route for Get Next Invoice Number
router.get(
  "/next-invoice-number",
  authMiddleware,
  serviceController.getNextInvoiceNumber
);

// Route for Delete Service by ID

router.delete("/delete/:id", authMiddleware, serviceController.deleteService);

module.exports = router;
