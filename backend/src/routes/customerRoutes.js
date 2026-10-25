const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const {
  authMiddleware,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Middleware to protect routes and require admin privileges

router.use(authMiddleware, requireAdmin);

// Route to create a new customer

router.post("/create", customerController.createCustomer);

// Route to get total number of customers

router.get("/get/total", customerController.getTotalCustomersWithRevenue);

// Route to get Customer by Pagination

router.get("/get/pagination", customerController.getCustomersWithPagination);

// Route to get recent customers

router.get("/get/recent", customerController.getRecentCustomers);

// Route to search for customers by phone number or registration number

router.get(
  "/get/search",
  customerController.findCustomerByPhoneOrRegistrationOrName
);

// Route to get all customers with their names only

router.get("/get/names", customerController.getAllCustomersWithNames);

// Route to get all customers

router.get("/getall", customerController.getAllCustomers);

// Route to get a customer by ID

router.get("/get/:id", customerController.getCustomerById);

// Route to update a customer by ID

router.patch("/update/:id", customerController.updateCustomer);

// Route to delete a customer by ID

router.delete("/delete/:id", customerController.deleteCustomer);

module.exports = router;
