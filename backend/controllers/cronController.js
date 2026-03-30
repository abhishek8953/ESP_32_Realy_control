const CronJob = require("../models/cronJob.model.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { ApiError } = require("../utils/ApiError.js");
const { asyncHandler } = require("../utils/AsyncHandler.js");
const {
	scheduleJob,
	deleteJob,
} = require("../services/cronService.js");

/**
 * Create a new cron job
 */
const createCronJob = asyncHandler(async (req, res) => {
	const { userId, pin, state, cronExpression } = req.body;

	if (!userId || !pin || !state || !cronExpression) {
		throw new ApiError(
			400,
			"userId, pin, state, and cronExpression are required",
		);
	}

	const newJob = new CronJob({ userId, pin, state, cronExpression });
	await newJob.save();

	scheduleJob(newJob);

	return res
		.status(201)
		.json({ message: "Cron job created", job: newJob });
});

/**
 * Get all cron jobs for a user
 */
const getUserCronJobs = asyncHandler(async (req, res) => {
	const { userId } = req.params;

	if (!userId) {
		throw new ApiError(400, "userId is required");
	}

	const jobs = await CronJob.find({ userId });

	return res.status(200).json(jobs);
});

/**
 * Update a cron job
 */
const updateCronJob = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { pin, state, cronExpression } = req.body;

	if (!id) {
		throw new ApiError(400, "Job ID is required");
	}

	const job = await CronJob.findById(id);
	if (!job) {
		throw new ApiError(404, "Job not found");
	}

	deleteJob(job._id);

	job.pin = pin || job.pin;
	job.state = state || job.state;
	job.cronExpression = cronExpression || job.cronExpression;
	await job.save();

	scheduleJob(job);

	return res
		.status(200)
		.json({ message: "Job updated", job });
});

/**
 * Delete a cron job
 */
const deleteCronJob = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id) {
		throw new ApiError(400, "Job ID is required");
	}

	const job = await CronJob.findByIdAndDelete(id);
	if (!job) {
		throw new ApiError(404, "Job not found");
	}

	deleteJob(job._id);

	return res
		.status(200)
		.json({ message: "Job deleted" });
});

module.exports = {
	createCronJob,
	getUserCronJobs,
	updateCronJob,
	deleteCronJob,
};
