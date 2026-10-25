const cron = require("node-cron");
const mongoose = require("mongoose");

// Run every 3 days at midnight
cron.schedule("0 0 */3 * *", async () => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log("MongoDB is not connected. Skipping keep-alive ping.");
      return;
    }

    // Send a ping command to MongoDB
    await mongoose.connection.db.admin().ping();

    console.log("Keep-alive ping executed successfully.");
  } catch (error) {
    console.error(
      "Error executing keep-alive ping:",
      error.message
    );
  }
});