const express = require("express");
const { connectDB } = require("./db/index.js");
const { db, app: router } = require("./app.js");
const cors = require("cors");

// connnectDB to mongoDB

connectDB();
const app = express();

app.use("/v2", router);


db.ref(".info/connected").on("value", (snapshot) => {
	if (snapshot.val() === true) {
		console.log("✅ Firebase Database connected successfully!");
		app.listen(3000, () => {
			console.log(`Server running on port ${3000}`);
			// setupFirebaseListener();
		});
	} else {
		console.log("❌ Firebase Database NOT connected!");
	}
});
