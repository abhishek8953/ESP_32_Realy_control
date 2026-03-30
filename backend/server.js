const express = require("express");
const { connectDB } = require("./db/index.js");
const { db, app: router } = require("./app.js");
const { loadJobsFromDB } = require("./services/cronService.js");
const cors = require("cors");

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Mount router
app.use("/v2", router);

// Firebase connection listener
db.ref(".info/connected").on("value", (snapshot) => {
	if (snapshot.val() === true) {
		console.log("Firebase Database connected successfully!");

		// Load cron jobs from database on server startup
		loadJobsFromDB().catch((err) =>
			console.error("Error loading cron jobs:", err),
		);

		app.listen(3000, () => {
			console.log(`Server running on port ${3000}`);
		});
	} else {
		console.log("Firebase Database NOT connected!");
	}
});
