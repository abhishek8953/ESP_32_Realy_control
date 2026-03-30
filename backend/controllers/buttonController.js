const { UserButtonName } = require("../models/buttonName.model.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/AsyncHandler.js");
const { ApiError } = require("../utils/ApiError.js");

/**
 * Set button names for user
 */
const setButtonNames = asyncHandler(async (req, res) => {
	if (!req.user) {
		throw new ApiError(400, "Unauthorized to change the button names");
	}

	const { buttons } = req.body;
	const { _id } = req.user;

	try {
		const result = await UserButtonName.findOneAndUpdate(
			{ userId: _id },
			{ $set: { buttonName: buttons } },
			{ new: true, upsert: true },
		);

		return res.json({ success: true, data: result });
	} catch (err) {
		console.error("Upsert failed:", err);
		throw new ApiError(500, "Failed to update button names");
	}
});

/**
 * Get button names for user
 */
const getButtonNames = asyncHandler(async (req, res) => {
	const userId = req.user._id;

	const userButtons = await UserButtonName.findOne({ userId });

	if (!userButtons) {
		throw new ApiError(404, "No button data found for this user");
	}

	return res.status(200).json(userButtons);
});

module.exports = {
	setButtonNames,
	getButtonNames,
};
