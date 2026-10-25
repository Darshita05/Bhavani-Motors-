const JobCard = require("../models/jobCardModel");
const Customer = require("../models/customerModel");
const Car = require("../models/carModel");
const Item = require("../models/itemModel");
const Service = require("../models/serviceModel");
const User = require("../models/userModel");
const { getIO } = require("../config/socket");
// ============================================
// GENERATE UNIQUE JOB CARD NUMBER
// ============================================

const generateJobCardNumber = async () => {
  const year = new Date().getFullYear();

  // Current year ka latest Job Card find karo
  const lastJobCard = await JobCard.findOne({
    jobCardNumber: new RegExp(`^JC-${year}-`),
  }).sort({ createdAt: -1 });

  let nextNumber = 1;

  // Agar pehle se Job Card hai to next number generate karo
  if (lastJobCard) {
    const lastNumber = parseInt(
      lastJobCard.jobCardNumber.split("-").pop()
    );

    nextNumber = lastNumber + 1;
  }

  // Example: JC-2026-0001
  return `JC-${year}-${String(nextNumber).padStart(4, "0")}`;
};


// ============================================
// CREATE NEW JOB CARD
// ============================================

const createJobCard = async (req, res) => {
  try {
    const {
      customerId,
      carId,
      complaints,
      workToBeDone,
      itemsUsed,
      expectedDelivery,
      remarks,
      discount = 0,
      tax = 0,
    } = req.body;


    // ------------------------------------------
    // 1. Required fields check
    // ------------------------------------------

    if (!customerId || !carId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and Car ID are required",
      });
    }


    // ------------------------------------------
    // 2. Check Customer
    // ------------------------------------------

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }


    // ------------------------------------------
    // 3. Check Car
    // ------------------------------------------

    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }


    // ------------------------------------------
    // 4. Check Car belongs to Customer
    // ------------------------------------------

    if (car.customerId.toString() !== customerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "This car does not belong to the selected customer",
      });
    }


    // ------------------------------------------
    // 5. Calculate Labour Total
    // ------------------------------------------

    let labourTotal = 0;

    if (workToBeDone && Array.isArray(workToBeDone)) {
      labourTotal = workToBeDone.reduce(
        (total, work) => {
          return total + Number(work.cost || 0);
        },
        0
      );
    }


    // ------------------------------------------
    // 6. Validate Items and Calculate Parts Total
    // ------------------------------------------

    let partsTotal = 0;

    const finalItemsUsed = [];

    if (itemsUsed && Array.isArray(itemsUsed)) {

      for (const item of itemsUsed) {

        // Item database me exist karta hai ya nahi
        const existingItem = await Item.findById(item.itemId);

        if (!existingItem) {
          return res.status(404).json({
            success: false,
            message: `Item not found: ${item.itemId}`,
          });
        }


        // Quantity aur Rate convert karo
        const quantity = Number(item.quantity);

        const rate = Number(item.rate);


        // Validation
        if (quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: "Item quantity must be greater than 0",
          });
        }


        if (rate < 0) {
          return res.status(400).json({
            success: false,
            message: "Item rate cannot be negative",
          });
        }


        // Item amount calculate karo
        const amount = quantity * rate;


        // Parts total me add karo
        partsTotal += amount;


        // Final item data
        finalItemsUsed.push({
          itemId: item.itemId,
          quantity,
          rate,
          amount,
        });
      }
    }


    // ------------------------------------------
    // 7. Calculate Final Amount
    // ------------------------------------------

    const subtotal = partsTotal + labourTotal;

    const discountAmount = Number(discount) || 0;

    const taxAmount = Number(tax) || 0;


    // Discount validation
    if (discountAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot be negative",
      });
    }


    // Tax validation
    if (taxAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Tax cannot be negative",
      });
    }


    const grandTotal =
      subtotal - discountAmount + taxAmount;


    // ------------------------------------------
    // 8. Generate Job Card Number
    // ------------------------------------------

    const jobCardNumber =
      await generateJobCardNumber();


    // ------------------------------------------
    // 9. Create Job Card
    // ------------------------------------------

    const jobCard = await JobCard.create({

      jobCardNumber,

      customerId,

      carId,

      complaints:
        complaints || [],

      workToBeDone:
        workToBeDone || [],

      itemsUsed:
        finalItemsUsed,

      expectedDelivery:
        expectedDelivery || null,

      remarks:
        remarks || null,

      partsTotal,

      labourTotal,

      subtotal,

      discount:
        discountAmount,

      tax:
        taxAmount,

      grandTotal,
    });


    // ------------------------------------------
    // 10. Populate Customer, Car and Item Details
    // ------------------------------------------

    const populatedJobCard =
      await JobCard.findById(jobCard._id)

        .populate(
          "customerId",
          "firstName lastName phoneNumber email address"
        )

        .populate(
          "carId",
          "make model registrationNo fuelType mileage imageUrl"
        )
.populate(
    "assignedTo",
    "name email phone role designation"
  )
        .populate(
          "itemsUsed.itemId",
          "itemName itemDetails"
        )
        .populate(
    "itemsUsed.usedBy",
    "name email phone role designation"
  );
  

    // ------------------------------------------
    // 11. Send Response
    // ------------------------------------------

    return res.status(201).json({

      success: true,

      message:
        "Job card created successfully",

      data:
        populatedJobCard,

    });


  } catch (error) {

    console.error(
      "Create Job Card Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to create job card",

      error:
        error.message,

    });
  }
};
// ============================================
// GET ALL JOB CARDS
// ============================================

const getAllJobCards = async (req, res) => {
  try {
    // Only admin can view all job cards
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view all job cards",
      });
    }

    const jobCards = await JobCard.find()
      .populate(
        "customerId",
        "firstName lastName phoneNumber email address"
      )
      .populate(
        "carId",
        "make model registrationNo fuelType mileage imageUrl"
      )
      .populate(
        "assignedTo",
        "name email phone role designation"
      )
      .populate(
        "itemsUsed.itemId",
        "itemName itemDetails"
      )
      .populate(
        "itemsUsed.usedBy",
        "name role designation"
      )
      .populate(
        "repairNotes.addedBy",
        "name role designation"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: jobCards.length,
      data: jobCards,
    });
  } catch (error) {
    console.error(
      "Get All Job Cards Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job cards",
      error: error.message,
    });
  }
};
// ============================================
// GET SINGLE JOB CARD BY ID
// ============================================

const getJobCardById = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id)
      // Customer details
      .populate(
        "customerId",
        "firstName lastName phoneNumber email address"
      )

      // Vehicle details
      .populate(
        "carId",
        "make model registrationNo fuelType mileage imageUrl"
      )

      // Assigned staff details
      .populate(
        "assignedTo",
        "name email phone phoneNumber role designation"
      )

      .populate("itemsUsed.itemId", "itemName itemDetails")
.populate("itemsUsed.usedBy", "name email")
.populate("workToBeDone.updatedBy", "name email")
      

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: "Job card not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: jobCard,
    });
  } catch (error) {
    console.error(
      "Get Job Card By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job card",
      error: error.message,
    });
  }
};

// ============================================
// UPDATE JOB CARD STATUS
// ============================================

const updateJobCardStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Completed",
      "Delivered",
      "Cancelled",
    ];

    // Status required
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job card status",
      });
    }

    // Find Job Card
    const jobCard = await JobCard.findById(id);

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: "Job card not found",
      });
    }

    // ==========================================
    // STAFF ACCESS CHECK
    // ==========================================
    if (status === "Delivered" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can mark a job as Delivered",
      });
    }

    if (status === "Delivered" && jobCard.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Only a completed job can be marked as Delivered",
      });
    }

    if (req.user.role === "staff") {
      // Job must be assigned to this staff
      if (
        !jobCard.assignedTo ||
        jobCard.assignedTo.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this job card",
        });
      }

      // Staff should not mark vehicle as Delivered or Cancelled
      if (status === "Delivered" || status === "Cancelled") {
        return res.status(403).json({
          success: false,
          message: "Only admin can mark a job as Delivered or Cancelled",
        });
      }
    }

    // Update status
    jobCard.status = status;

    // If marked Completed, automatically mark all tasks as completed if any exist
    if (status === "Completed" && jobCard.workToBeDone && jobCard.workToBeDone.length > 0) {
      jobCard.workToBeDone.forEach((task) => {
        if (task.status !== "Completed") {
          task.status = "Completed";
          task.updatedBy = req.user._id;
          task.updatedAt = new Date();
        }
      });
    }

    await jobCard.save();

    // Populate updated Job Card
    const updatedJobCard = await JobCard.findById(jobCard._id)
      .populate(
        "customerId",
        "firstName lastName phoneNumber email address"
      )
      .populate(
        "carId",
        "make model registrationNo fuelType mileage imageUrl"
      )
      .populate(
        "assignedTo",
        "name email phone role designation"
      )
      .populate(
        "itemsUsed.itemId",
        "itemName itemDetails sellingPrice price rate"
      );

    // Socket real-time broadcast
    try {
      const io = getIO();
      if (io) {
        io.emit("jobCardUpdated", {
          jobCardId: jobCard._id,
          status: jobCard.status,
          jobCard: updatedJobCard,
        });
        io.emit("jobUpdated", {
          jobCardId: jobCard._id,
          status: jobCard.status,
          jobCard: updatedJobCard,
        });
        io.emit("jobStatusChanged", {
          jobCardId: jobCard._id,
          status: jobCard.status,
        });
      }
    } catch (socketErr) {
      console.warn("Socket broadcast error:", socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Job card status updated successfully",
      data: updatedJobCard,
    });
  } catch (error) {
    console.error(
      "Update Job Card Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update job card status",
      error: error.message,
    });
  }
};


const updateJobCard = async (req, res) => {
  try {
    const {
      complaints,
      workToBeDone,
      expectedDelivery,
      remarks,
      discount,
      tax,
    } = req.body;

    // 1. Find existing Job Card
    const existingJobCard = await JobCard.findById(
      req.params.id
    );

    if (!existingJobCard) {
      return res.status(404).json({
        success: false,
        message: "Job card not found",
      });
    }

    // ==========================================
    // 2. UPDATE COMPLAINTS
    // ==========================================

    if (complaints !== undefined) {
      existingJobCard.complaints = complaints;
    }

    // ==========================================
    // 3. UPDATE WORK
    // Admin controls:
    // description + cost
    //
    // Staff progress is preserved:
    // status + workUpdate + updatedBy + updatedAt
    // ==========================================

    if (Array.isArray(workToBeDone)) {
      const mergedWork = workToBeDone.map(
        (incomingWork) => {
          // Find existing task using MongoDB subdocument ID
          const oldWork = incomingWork._id
            ? existingJobCard.workToBeDone.id(
                incomingWork._id
              )
            : null;

          // Existing task
          if (oldWork) {
            return {
              _id: oldWork._id,

              description:
                incomingWork.description,

              cost: Number(
                incomingWork.cost || 0
              ),

              // Preserve staff progress
              status:
                oldWork.status ||
                "Pending",

              workUpdate:
                oldWork.workUpdate ||
                "",

              updatedBy:
                oldWork.updatedBy ||
                null,

              updatedAt:
                oldWork.updatedAt ||
                null,
            };
          }

          // New task created by Admin
          return {
            description:
              incomingWork.description,

            cost: Number(
              incomingWork.cost || 0
            ),

            status: "Pending",

            workUpdate: "",

            updatedBy: null,

            updatedAt: null,
          };
        }
      );

      existingJobCard.workToBeDone =
        mergedWork;
    }

    // ==========================================
    // 4. IMPORTANT
    // Do NOT replace itemsUsed here.
    //
    // Staff-added items stay preserved.
    // ==========================================

    // ==========================================
    // 5. OTHER ADMIN FIELDS
    // ==========================================

    if (expectedDelivery !== undefined) {
      existingJobCard.expectedDelivery =
        expectedDelivery;
    }

    if (remarks !== undefined) {
      existingJobCard.remarks = remarks;
    }

    // ==========================================
    // 6. DISCOUNT
    // ==========================================

    const finalDiscount =
      discount !== undefined
        ? Number(discount)
        : Number(
            existingJobCard.discount || 0
          );

    if (
      !Number.isFinite(finalDiscount) ||
      finalDiscount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount amount",
      });
    }

    // ==========================================
    // 7. TAX
    // ==========================================

    const finalTax =
      tax !== undefined
        ? Number(tax)
        : Number(
            existingJobCard.tax || 0
          );

    if (
      !Number.isFinite(finalTax) ||
      finalTax < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid tax amount",
      });
    }

    existingJobCard.discount =
      finalDiscount;

    existingJobCard.tax =
      finalTax;

    // ==========================================
    // 8. CALCULATE LABOUR TOTAL
    // ==========================================

    const labourTotal =
      existingJobCard.workToBeDone.reduce(
        (total, work) =>
          total +
          Number(work.cost || 0),
        0
      );

    // ==========================================
    // 9. CALCULATE PARTS TOTAL
    // Existing staff-added items are preserved
    // ==========================================

    const partsTotal =
      existingJobCard.itemsUsed.reduce(
        (total, item) => {
          const amount =
            Number(
              item.amount ||
                Number(
                  item.quantity || 0
                ) *
                  Number(
                    item.rate || 0
                  )
            );

          return total + amount;
        },
        0
      );

    // ==========================================
    // 10. CALCULATE FINAL TOTALS
    // ==========================================

    const subtotal =
      labourTotal + partsTotal;

    const grandTotal =
      subtotal -
      finalDiscount +
      finalTax;

    existingJobCard.labourTotal =
      labourTotal;

    existingJobCard.partsTotal =
      partsTotal;

    existingJobCard.subtotal =
      subtotal;

    existingJobCard.grandTotal =
      Math.max(grandTotal, 0);

    // ==========================================
    // 11. SAVE
    // ==========================================

    await existingJobCard.save();

    // ==========================================
    // 12. POPULATE UPDATED JOB CARD
    // ==========================================

    const updatedJobCard =
      await JobCard.findById(
        existingJobCard._id
      )
        .populate(
          "customerId",
          "firstName lastName phoneNumber email address"
        )
        .populate(
          "carId",
          "make model registrationNo fuelType mileage imageUrl"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .populate(
          "itemsUsed.itemId",
          "itemName itemDetails"
        )
        .populate(
          "itemsUsed.usedBy",
          "name email"
        )
        .populate(
          "workToBeDone.updatedBy",
          "name email"
        );

    return res.status(200).json({
      success: true,
      message:
        "Job card updated successfully",
      data: updatedJobCard,
    });

  } catch (error) {
    console.error(
      "Update Job Card Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update job card",
      error: error.message,
    });
  }
};
// ============================================
// DELETE JOB CARD
// ============================================

const deleteJobCard = async (req, res) => {
  try {
    // Job Card find karo
    const jobCard = await JobCard.findById(
      req.params.id
    );

    // Job Card nahi mila
    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: "Job card not found",
      });
    }

    // Job Card delete karo
    await JobCard.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Job card deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete Job Card Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete job card",
      error: error.message,
    });
  }
};
// ============================================
// SYNC OLD SERVICES TO JOB CARDS
// ============================================

const syncServicesToJobCards = async (req, res) => {
  try {
    const services = await Service.find();

    let createdCount = 0;
    let skippedCount = 0;

    for (const service of services) {

      // Check whether this service already has a Job Card
      const existingJobCard = await JobCard.findOne({
        serviceId: service._id,
      });

      if (existingJobCard) {
        skippedCount++;
        continue;
      }

      // Generate new Job Card number
      const jobCardNumber = await generateJobCardNumber();

      const serviceCost = Number(service.cost || 0);

      await JobCard.create({
        jobCardNumber,

        serviceId: service._id,

        customerId: service.customerId,

        carId: service.carId,

        complaints: [],

        workToBeDone: [
          {
            description:
              service.description || "Vehicle Service",

            cost: serviceCost,
          },
        ],

        itemsUsed: [],

        timeIn:
          service.serviceDate || service.createdAt,

        expectedDelivery:
          service.dueDate || null,

        status: "Pending",

        remarks: null,

        partsTotal: 0,

        labourTotal: serviceCost,

        subtotal: serviceCost,

        discount: 0,

        tax: 0,

        grandTotal: serviceCost,
      });

      createdCount++;
    }

    return res.status(200).json({
      success: true,

      message:
        "Services synced to Job Cards successfully",

      totalServices: services.length,

      createdJobCards: createdCount,

      skippedServices: skippedCount,
    });

  } catch (error) {

    console.error(
      "Sync Services To Job Cards Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to sync Services to Job Cards",

      error: error.message,
    });
  }
};
// ============================================
// ASSIGN STAFF TO JOB CARD
// ============================================

const assignStaffToJobCard = async (req, res) => {
  try {
    const { staffId } = req.body;
    const { id } = req.params;

    // 1. Check Job Card
    const jobCard = await JobCard.findById(id);

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: "Job card not found",
      });
    }

    // 2. If staffId is empty/null, unassign staff
    if (!staffId) {
      jobCard.assignedTo = null;

      await jobCard.save();

      return res.status(200).json({
        success: true,
        message: "Staff unassigned successfully",
        data: jobCard,
      });
    }

    // 3. Check selected staff
    const staff = await User.findOne({
      _id: staffId,
      role: "staff",
      isActive: true,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Active staff member not found",
      });
    }

    // 4. Assign staff
    const oldStaffId = jobCard.assignedTo;
    jobCard.assignedTo = staff._id;

    await jobCard.save();


const io = getIO();

io.to(staff._id.toString()).emit("jobAssigned", {
    jobCardId: jobCard._id,
    staffId: staff._id,
});
if (
  oldStaffId &&
  oldStaffId.toString() !== staff._id.toString()
) {
  io.to(oldStaffId.toString()).emit("jobRemoved", {
    jobCardId: jobCard._id,
  });
}

    // 5. Return updated Job Card
    const updatedJobCard = await JobCard.findById(
      jobCard._id
    )
      .populate(
        "assignedTo",
        "name email phone role designation"
      )
      .populate(
        "customerId",
        "firstName lastName phoneNumber email address"
      )
      .populate(
        "carId",
        "make model registrationNo fuelType mileage imageUrl"
      );

    return res.status(200).json({
      success: true,
      message: "Staff assigned successfully",
      data: updatedJobCard,
    });
  } catch (error) {
    console.error(
      "Assign/Unassign Staff Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update staff assignment",
      error: error.message,
    });
  }
};
// ============================================
// GET LOGGED-IN STAFF ASSIGNED JOBS
// ============================================

const getMyAssignedJobs = async (req, res) => {
  try {
    const staffId = req.user._id;
console.log("STAFF ID USED FOR QUERY:", staffId);
    if (!staffId) {
      return res.status(401).json({
        success: false,
        message: "Logged-in user not found",
      });
    }

    const jobCards = await JobCard.find({
      assignedTo: staffId,
    })
      .populate(
        "customerId",
        "firstName lastName phoneNumber email address"
      )
      .populate(
        "carId",
        "make model registrationNo fuelType mileage imageUrl"
      )
      .populate(
        "assignedTo",
        "name email phone role designation"
      )
      .populate(
        "itemsUsed.itemId",
        "itemName itemDetails"
      )
      .populate(
        "itemsUsed.usedBy",
        "name role designation"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: jobCards.length,
      data: jobCards,
    });
  } catch (error) {
    console.error(
      "Get My Assigned Jobs Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assigned jobs",
      error: error.message,
    });
  }
};
// ============================================
// ADD ITEM USED BY ASSIGNED STAFF
// ============================================
const addItemToJobCard = async (req, res) => {
  try {
     console.log("===== ADD ITEM NEW CODE RUNNING =====");
    console.log("REQ USER:", req.user);
    console.log("REQ USER ID:", req.user?._id);
    const { id } = req.params;
    const { itemId, quantity } = req.body;

    // Logged-in staff/admin user ID
    const loggedInUserId = req.user?._id;

    // 1. Check logged-in user
    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: "Logged-in user not found",
      });
    }

    // 2. Required fields check
    if (!itemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Item ID and quantity are required",
      });
    }

    // 3. Find Job Card
    const jobCard = await JobCard.findById(id);

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: "Job card not found",
      });
    }

    // 4. Only assigned staff can add used parts
    if (req.user.role === "staff") {
      if (
        !jobCard.assignedTo ||
        jobCard.assignedTo.toString() !==
          loggedInUserId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to add parts to this job",
        });
      }
    }

    // 5. Find Item
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // 6. Validate quantity
    const usedQuantity = Number(quantity);

    if (
      !Number.isFinite(usedQuantity) ||
      usedQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    // 7. Get item rate
    const rate = Number(
      item.sellingPrice ||
        item.price ||
        item.rate ||
        0
    );

    const amount = usedQuantity * rate;

    // 8. Add item to Job Card
    const newUsedItem = {
  itemId: item._id,
  quantity: usedQuantity,
  rate,
  amount,
  usedBy: loggedInUserId,
  usedAt: new Date(),
};

console.log("DATA WE ARE PUSHING:", newUsedItem);

jobCard.itemsUsed.push(newUsedItem);

console.log(
  "DATA AFTER PUSH:",
  jobCard.itemsUsed[jobCard.itemsUsed.length - 1]
);

    // 9. Recalculate labour total
    const labourTotal = (jobCard.workToBeDone || []).reduce(
      (total, work) => total + Number(work.cost || 0),
      0
    );
    jobCard.labourTotal = labourTotal;

    // 10. Recalculate parts total
    const partsTotal = jobCard.itemsUsed.reduce(
      (total, usedItem) => {
        const itemAmt =
          usedItem.amount !== undefined && usedItem.amount !== null
            ? Number(usedItem.amount)
            : Number(usedItem.quantity || 0) * Number(usedItem.rate || 0);
        return total + Number(itemAmt || 0);
      },
      0
    );
    jobCard.partsTotal = partsTotal;

    // 11. Recalculate subtotal (Labour + Parts)
    jobCard.subtotal = labourTotal + partsTotal;

    // 12. Recalculate grand total
    jobCard.grandTotal = Math.max(
      0,
      jobCard.subtotal -
        Number(jobCard.discount || 0) +
        Number(jobCard.tax || 0)
    );

    // 13. Save Job Card
    await jobCard.save();

    // 14. Get updated Job Card with populated details
    const updatedJobCard = await JobCard.findById(jobCard._id)
      .populate(
        "customerId",
        "firstName lastName phoneNumber email address"
      )
      .populate(
        "carId",
        "make model registrationNo fuelType mileage imageUrl"
      )
      .populate(
        "assignedTo",
        "name email phone role designation"
      )
      .populate(
        "itemsUsed.itemId",
        "itemName itemDetails sellingPrice price rate"
      )
      .populate(
        "itemsUsed.usedBy",
        "name email phone role designation"
      );

    // Real-time socket broadcast
    try {
      const io = getIO();
      if (io) {
        io.emit("jobCardUpdated", {
          jobCardId: jobCard._id,
          status: jobCard.status,
          jobCard: updatedJobCard,
        });
        io.emit("jobUpdated", {
          jobCardId: jobCard._id,
          status: jobCard.status,
          jobCard: updatedJobCard,
        });
      }
    } catch (sErr) {
      console.warn("Socket broadcast error:", sErr.message);
    }

    // 15. Success response
    return res.status(200).json({
      success: true,
      message: "Part added to job card successfully",
      data: updatedJobCard,
    });
  } catch (error) {
    console.error(
      "Add Item To Job Card Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to add part to job card",
      error: error.message,
    });
  }
};
// UPDATE WORK PROGRESS BY STAFF
const updateWorkProgress = async (req, res) => {
  try {
    const { id, workId } = req.params;
    const { status, workUpdate } = req.body;

    const jobCard = await JobCard.findById(id);

    if (!jobCard) {
      return res.status(404).json({
        success: false,
        message: "Job card not found",
      });
    }

    if (
      !jobCard.assignedTo ||
      jobCard.assignedTo.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this job card",
      });
    }

    const work = jobCard.workToBeDone.id(workId);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: "Work task not found",
      });
    }

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid work status",
      });
    }

    work.status = status;
    if (workUpdate !== undefined) {
      work.workUpdate = workUpdate;
    }
    work.updatedBy = req.user._id;
    work.updatedAt = new Date();

    // Check status of all work tasks
    const totalTasks = jobCard.workToBeDone ? jobCard.workToBeDone.length : 0;
    const allTasksCompleted =
      totalTasks > 0 &&
      jobCard.workToBeDone.every(
        (task) => task.status === "Completed"
      );

    const anyTaskStarted =
      totalTasks > 0 &&
      jobCard.workToBeDone.some(
        (task) =>
          task.status === "In Progress" ||
          task.status === "Completed"
      );

    // Automatically update Job Card status based on tasks
    if (allTasksCompleted) {
      jobCard.status = "Completed";
    } else if (anyTaskStarted) {
      jobCard.status = "In Progress";
    } else {
      jobCard.status = "Pending";
    }

    await jobCard.save();

    const updatedJobCard = await JobCard.findById(id)
      .populate(
        "customerId",
        "firstName lastName phoneNumber email address"
      )
      .populate(
        "carId",
        "make model registrationNo fuelType mileage imageUrl"
      )
      .populate(
        "assignedTo",
        "name email phone phoneNumber role designation"
      )
      .populate(
        "itemsUsed.itemId",
        "itemName itemDetails sellingPrice price rate"
      )
      .populate(
        "itemsUsed.usedBy",
        "name email role designation"
      )
      .populate(
        "workToBeDone.updatedBy",
        "name email"
      );

    // Socket real-time broadcast to all connected clients & rooms
    try {
      const io = getIO();
      if (io) {
        io.emit("jobCardUpdated", {
          jobCardId: jobCard._id,
          status: jobCard.status,
          jobCard: updatedJobCard,
        });
        io.emit("jobUpdated", {
          jobCardId: jobCard._id,
          status: jobCard.status,
          jobCard: updatedJobCard,
        });
        io.emit("jobStatusChanged", {
          jobCardId: jobCard._id,
          status: jobCard.status,
        });
        if (jobCard.assignedTo) {
          io.to(jobCard.assignedTo.toString()).emit("jobUpdated", {
            jobCardId: jobCard._id,
            status: jobCard.status,
            jobCard: updatedJobCard,
          });
        }
      }
    } catch (socketErr) {
      console.warn("Socket broadcast error:", socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Work progress updated successfully",
      data: {
        jobCard: updatedJobCard,
      },
    });
  } catch (error) {
    console.error("UPDATE WORK PROGRESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update work progress",
      error: error.message,
    });
  }
};

module.exports = {

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
  updateWorkProgress
};