const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    make: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    fuelType: {
      type: String,
      enum: ["Petrol", "Petrol + CNG","CNG", "Diesel", "EV"],
      default: "Petrol",
      required: true,
    },

    registrationNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    mileage: {
      type: Number,
      required: true,
      default: 0,
    },

    imageUrl: {
      type: String,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Car", carSchema);