const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const cronJobSchema = new mongoose.Schema({
  jobId: { type: String, default: uuidv4 },
  userId: { type: String, required: true },
  pin: { type: Number, required: true },
  state: { type: String, enum: ["ON", "OFF"], required: true },
  cronExpression: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CronJob", cronJobSchema);
