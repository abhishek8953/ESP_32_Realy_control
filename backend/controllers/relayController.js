const { db } = require("../config/firebase.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/AsyncHandler.js");

/**
 * Get relay health status
 */
const getRelayHealth = asyncHandler(async (req, res) => {
	try {
		const data = await db.ref("/relays").get();
		let arr = [];
		const final_value = data.toJSON();

		for (let i in final_value) {
			arr.push(final_value[i] ? 1 : 0);
		}

		console.log("Relay states:", final_value);
		return res.status(200).json({ status: "healthy", data: arr });
	} catch (error) {
		console.error("Error fetching relay health:", error);
		return res
			.status(500)
			.json({ error: "Error fetching relay health" });
	}
});

/**
 * Update relay data - converts numeric values to boolean
 */
const updateRelayData = asyncHandler(async (req, res) => {
	try {
		const data = {
			relay1: Boolean(req.body.data[0]),
			relay2: Boolean(req.body.data[1]),
			relay3: Boolean(req.body.data[2]),
			relay4: Boolean(req.body.data[3]),
			relay5: Boolean(req.body.data[4]),
			relay6: Boolean(req.body.data[5]),
			relay7: Boolean(req.body.data[6]),
			relay8: Boolean(req.body.data[7]),
		};

		console.log("Updating relays with data:", data);
		await db.ref("/relays").update(data);
		return res.status(200).json({ msg: "success", data });
	} catch (error) {
		console.error("Error updating relay data:", error);
		return res
			.status(500)
			.json({ error: "Error updating relay data" });
	}
});

module.exports = {
	getRelayHealth,
	updateRelayData,
};
