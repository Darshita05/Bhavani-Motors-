const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

require("dotenv").config({
  path: path.resolve(__dirname, envFile),
});

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/garage-dev";

async function seed() {
  console.log("Connecting to:", mongoUri.replace(/\/\/.*@/, "//***:***@"));
  await mongoose.connect(mongoUri);

  const seedFilePath = path.resolve(__dirname, "../seedData.json");
  if (!fs.existsSync(seedFilePath)) {
    console.error("seedData.json not found at", seedFilePath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(seedFilePath, "utf8"));

  for (const [collectionName, documents] of Object.entries(data)) {
    if (!documents || documents.length === 0) continue;
    const col = mongoose.connection.collection(collectionName);
    for (const doc of documents) {
      if (doc._id) {
        doc._id = new mongoose.Types.ObjectId(doc._id);
      }
      if (doc.customerId) doc.customerId = new mongoose.Types.ObjectId(doc.customerId);
      if (doc.carId) doc.carId = new mongoose.Types.ObjectId(doc.carId);
      if (doc.serviceId) doc.serviceId = new mongoose.Types.ObjectId(doc.serviceId);
      if (doc.assignedTo && mongoose.Types.ObjectId.isValid(doc.assignedTo)) {
        doc.assignedTo = new mongoose.Types.ObjectId(doc.assignedTo);
      }
      try {
        await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
      } catch (err) {
        console.warn(`Error inserting into ${collectionName}:`, err.message);
      }
    }
    console.log(`Synced ${documents.length} records into ${collectionName}`);
  }

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
