// const CronJob = require("../models/cronJob.model");
// const { scheduleJob, deleteJob } = require("../app.js");

// exports.createJob = async (req, res) => {
//   try {
//     const { userId, pin, state, cronExpression } = req.body;
//     const newJob = new CronJob({ userId, pin, state, cronExpression });
//     await newJob.save();
//     scheduleJob(newJob);
//     res.status(201).json({ message: "Cron job created", job: newJob });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.getJobs = async (req, res) => {
//   const { userId } = req.params;
//   try {
//     const jobs = await CronJob.find({ userId });
//     res.json(jobs);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.deleteJob = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const job = await CronJob.findByIdAndDelete(id);
//     if (!job) return res.status(404).json({ message: "Job not found" });

//     deleteJob(job.jobId);
//     res.json({ message: "Job deleted" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.updateJob = async (req, res) => {
//   const { id } = req.params;
//   const { pin, state, cronExpression } = req.body;
//   try {
//     const job = await CronJob.findById(id);
//     if (!job) return res.status(404).json({ message: "Job not found" });

//     deleteJob(job.jobId);

//     job.pin = pin;
//     job.state = state;
//     job.cronExpression = cronExpression;
//     await job.save();

//     scheduleJob(job);
//     res.json({ message: "Job updated", job });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
