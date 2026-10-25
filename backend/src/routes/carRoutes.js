const express = require("express");
const router = express.Router();
const carController = require("../controllers/carController");
const {
  authMiddleware,
  requireAdmin,
} = require("../middleware/authMiddleware");
const {
  upload,
  compressImages,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

// Route for Create Car

router.post("/create", authMiddleware, requireAdmin, carController.createCar);

// Upload car images to S3

router.post(
  "/upload-images/:carId",
  authMiddleware,
  requireAdmin,
  upload.array("image", 12),
  compressImages,
  handleUploadError,
  carController.uploadCarImages
);

// Route for send images & invoice to WhatsApp

router.post(
  "/send-image/:serviceId",
  authMiddleware,
  requireAdmin,
  upload.single("invoicePdf"),
  carController.sendCarImageAndInvoiceFromService
);

// Route for store invoice data

router.post(
  "/storeinvoice/:serviceId",
  authMiddleware,
  requireAdmin,
  upload.fields([{ name: "invoicePdf", maxCount: 1 }]),
  carController.storeInvoiceData
);

// router.post(
//   "/sendAllAssets/:serviceId",
//   authMiddleware,
//   requireAdmin,
//   upload.fields([
//     { name: "invoicePdf", maxCount: 1 },
//     { name: "images", maxCount: 10 },
//   ]),
//   carController.sendAllAssetsFromService
// );

// Route for Get total number of cars

router.get(
  "/get/total",
  authMiddleware,
  requireAdmin,
  carController.getTotalCars
);

// Route for Get total number of cars by customer

router.get(
  "/get/total/bycustomer",
  authMiddleware,
  requireAdmin,
  carController.getTotalCarsByCustomer
);

// Route for Get All Cars

router.get("/getall", authMiddleware, requireAdmin, carController.getAllCars);

// Route for Get Car by ID

router.get("/:id", authMiddleware, requireAdmin, carController.getCarById);

// Route for Get vehicle by Registration Number
router.get(
  "/get/registration/:registrationNo",
  authMiddleware,
  requireAdmin,
  carController.getCarByRegistrationNo
);

// Router for Get Cars with Pagination

router.get(
  "/get/pagination",
  authMiddleware,
  requireAdmin,
  carController.getCarsWithPagination
);

// Route for Update Car by ID

router.put(
  "/update/:id",
  authMiddleware,
  requireAdmin,
  upload.array("image", 12),
  carController.updateCar
);

// Route for delete image only

router.delete(
  "/delete-image/:carId",
  authMiddleware,
  requireAdmin,
  carController.deleteCarImage
);

// Route for Delete Car by ID

router.delete(
  "/delete/:id",
  authMiddleware,
  requireAdmin,
  carController.deleteCar
);

module.exports = router;
