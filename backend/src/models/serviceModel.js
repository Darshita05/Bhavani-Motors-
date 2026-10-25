const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },

    cost: {
      type: Number,
      required: true,
    },

    collectedCost: {
      type: Number,
      default: null,
    },

    totalRevenue: {
      type: Number,
      default: null,
    },

    serviceDate: {
      type: Date,
      default: Date.now,
    },

    days: {
      type: Number,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    invoiceAmount: {
      type: Number,
      default: null,
    },

    invoiceUrl: {
      type: String,
      default: null,
    },

    mileage: {
      type: Number,
      required: true,
      default: 0,
    },

    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Service", serviceSchema);