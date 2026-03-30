const cron = require("node-cron");
const { db } = require("../config/firebase.js");
const CronJob = require("../models/cronJob.model.js");

const activeJobs = {}; // maintain mapping of jobId and cron tasks
const relayStates = {
	relay1: false,
	relay2: false,
	relay3: false,
	relay4: false,
	relay5: false,
	relay6: false,
	relay7: false,
	relay8: false,
};

/**
 * Execute pin action - update relay state in Firebase
 * @param {number} pin - Pin number (1-8)
 * @param {string} state - State "ON" or "OFF"
 */
const executePin = (pin, state) => {
	const relayKey = `relay${pin}`;
	if (!relayStates.hasOwnProperty(relayKey)) {
		console.error(`Invalid pin: ${pin}`);
		return;
	}

	const newState = state === "ON";
	relayStates[relayKey] = newState;

	console.log(`Pin ${pin} turned ${state}`);
	console.log("Updated relay states:", relayStates);

	// Send to Firebase
	db.ref(`relays/${relayKey}`)
		.set(newState)
		.then(() => {
			console.log(`Updated ${relayKey} to ${newState} in Firebase.`);
		})
		.catch((err) => {
			console.error(`Error updating ${relayKey} in Firebase:`, err);
		});
};

/**
 * Schedule a cron job and store in activeJobs
 * @param {object} job - Job object with _id, pin, state, cronExpression
 */
const scheduleJob = (job) => {
	const task = cron.schedule(job.cronExpression, () => {
		executePin(job.pin, job.state);
	});
	activeJobs[job._id] = task;
};

/**
 * Load all jobs from database and schedule them
 */
const loadJobsFromDB = async () => {
	try {
		const jobs = await CronJob.find();
		jobs.forEach(scheduleJob);
		console.log(`Loaded and scheduled ${jobs.length} cron jobs from database`);
	} catch (err) {
		console.error("Error loading jobs from database:", err);
	}
};

/**
 * Delete and stop a cron job
 * @param {string} jobId - Job ID to delete
 */
const deleteJob = (jobId) => {
	if (activeJobs[jobId]) {
		activeJobs[jobId].stop();
		delete activeJobs[jobId];
		console.log(`Cron job ${jobId} stopped and removed`);
	}
};

module.exports = {
	scheduleJob,
	deleteJob,
	loadJobsFromDB,
	executePin,
	relayStates,
	activeJobs,
};
