const mongoose = require("mongoose");

const jobCardSchema = new mongoose.Schema(
  {
    // Automatically generated unique job card number
    jobCardNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Existing customer
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // Customer's existing car
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    // Staff assigned to this job
assignedTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
    serviceId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Service",
  unique: true,
  sparse: true,
},


    // Problems told by the customer
    complaints: [
      {
        type: String,
        trim: true,
      },
    ],

    // Work that needs to be done on the vehicle
   workToBeDone: [
  {
    // Admin jo kaam assign karega
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Admin labour cost set karega
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Staff task ka progress update karega
    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Completed",
      ],
      default: "Pending",
    },

    // Staff actual kaam ka update likhega
    workUpdate: {
      type: String,
      default: "",
      trim: true,
    },

    // Kis staff ne last update kiya
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Last update kab hua
    updatedAt: {
      type: Date,
      default: null,
    },
  },
],
    // Parts/items used in this job
    itemsUsed: [
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Staff member who used this part
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // When the part was used
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
],
    // Vehicle entry date and time
    timeIn: {
      type: Date,
      default: Date.now,
    },

    // Expected vehicle delivery
    expectedDelivery: {
      type: Date,
      default: null,
    },

    // Current job status
    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Completed",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    // Extra notes from garage owner
    remarks: {
      type: String,
      default: null,
      trim: true,
    },
repairNotes: [
  {
    note: {
      type: String,
      required: true,
      trim: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
],
    // Total amount of items/parts
    partsTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Total service/labour charges
    labourTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("JobCard", jobCardSchema);