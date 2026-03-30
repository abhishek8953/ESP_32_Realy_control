const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

// ===== Firebase Configuration =====
const { db } = require("./config/firebase.js");

// ===== Controllers =====
const authController = require("./controllers/authController.js");
const buttonController = require("./controllers/buttonController.js");
const relayController = require("./controllers/relayController.js");
const cronController = require("./controllers/cronController.js");

// ===== Middleware =====
const { verifyJWT } = require("./middlewares/auth.middleware.js");

// ===== Utils =====
const { ApiResponse } = require("./utils/ApiResponse.js");

// ===== Initialize Router =====
const app = express.Router();

// ===== Middleware Setup =====
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// ===== AUTH ROUTES =====
app.post("/user-signUp", authController.signUp);
app.post("/user-logIn", authController.logIn);
app.get("/refereshAccessToken", authController.refreshAccessToken);
app.get("/current-user", verifyJWT, authController.getCurrentUser);
app.post("/change-password", verifyJWT, authController.changePassword);
app.get("/user-logOut", verifyJWT, authController.logOut);

// ===== BUTTON ROUTES =====
app.post("/setButton", verifyJWT, buttonController.setButtonNames);
app.get("/buttons", verifyJWT, buttonController.getButtonNames);

// ===== RELAY ROUTES =====
app.get("/health", relayController.getRelayHealth);
app.post("/data", relayController.updateRelayData);

// ===== CRON ROUTES =====
app.post("/cron", cronController.createCronJob);
app.get("/cron/:userId", cronController.getUserCronJobs);
app.put("/cron/:id", cronController.updateCronJob);
app.delete("/cron/:id", cronController.deleteCronJob);

// ===== HEALTH CHECK =====
app.get("/ok", (req, res) => {
	return res.json({ status: 200, message: "Server is online" });
});

module.exports = { app, db };
