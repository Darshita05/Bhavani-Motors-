const express = require("express");
const router = express.Router();

const {
  createJobCard,
  getAllJobCards,
  getJobCardById,
  updateJobCardStatus,
  updateJobCard,
  deleteJobCard,
  syncServicesToJobCards,
  assignStaffToJobCard,
   getMyAssignedJobs,
   addItemToJobCard,
   updateWorkProgress,
   
} = require("../controllers/jobCardController");

const {
  authMiddleware,
} = require("../middleware/authMiddleware");


// CREATE JOB CARD
router.post(
  "/",
  authMiddleware,
  createJobCard
);


// GET ALL JOB CARDS
router.get(
  "/",
  authMiddleware,
  getAllJobCards
);

// GET LOGGED-IN STAFF ASSIGNED JOBS
router.get(
  "/my-jobs",
  authMiddleware,
  getMyAssignedJobs
);
// SYNC SERVICES TO JOB CARDS
router.post(
  "/sync-services",
  authMiddleware,
  syncServicesToJobCards
);
// ADD USED PART TO JOB CARD
router.post(
  "/:id/items",
  authMiddleware,
  addItemToJobCard
);

// GET SINGLE JOB CARD BY ID
router.get(
  "/:id",
  authMiddleware,
  getJobCardById
);


// UPDATE JOB CARD STATUS
router.patch(
  "/:id/status",
  authMiddleware,
  updateJobCardStatus
);
// STAFF UPDATE SPECIFIC WORK PROGRESS
router.patch(
  "/:id/work/:workId",
  authMiddleware,
  updateWorkProgress
);

// UPDATE FULL JOB CARD
router.put(
  "/:id",
  authMiddleware,
  updateJobCard
);


// DELETE JOB CARD
router.delete(
  "/:id",
  authMiddleware,
  deleteJobCard
);


// ASSIGN STAFF TO JOB CARD
router.patch(
  "/:id/assign",
  authMiddleware,
  assignStaffToJobCard
);


module.exports = router;