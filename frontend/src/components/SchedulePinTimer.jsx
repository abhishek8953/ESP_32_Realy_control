import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SchedulePinTimer.css";

const url = import.meta.env.VITE_API_BACKEND_URL + "/v2";

function SchedulePinTimer({ userId }) {
	const [pin, setPin] = useState(1);
	const [names, setNames] = useState([]);
	const [time, setTime] = useState("");
	const [interval, setInterval] = useState("daily");
	const [pinState, setPinState] = useState("ON");
	const [message, setMessage] = useState("");
	const [scheduledJobs, setScheduledJobs] = useState([]);
	const [editId, setEditId] = useState(null);

	// Load current pin states + scheduled jobs
	useEffect(() => {
		console.log("Component loaded with userId:", userId);
		if (!userId) {
			setMessage("❌ No user ID provided. Component may not be set up correctly.");
			return;
		}
		fetchPinStates();
		fetchScheduledJobs();
		const interval = setInterval(() => {
			fetchPinStates();
		}, 3000);
		return () => clearInterval(interval);
	}, [userId]);

	const fetchPinStates = async () => {
		try {
			const but = await axios.get(`${url}/buttons`, {
				withCredentials: true,
			});
			setNames(but.data.buttonName || []);
		} catch (err) {
			console.error("Error fetching pins:", err);
		}
	};

	const fetchScheduledJobs = async () => {
		try {
			const res = await axios.get(`${url}/cron/${userId}`);
			setScheduledJobs(res.data);
		} catch (err) {
			console.error("Error fetching scheduled jobs:", err);
		}
	};



	const handleSchedule = async (e) => {
		e.preventDefault();

		if (!userId) {
			setMessage("❌ User ID not found. Please log in again.");
			return;
		}

		if (!time) {
			setMessage("❌ Please select a time");
			return;
		}

		const isValidTime = /^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/.test(time);
		if (!isValidTime) {
			setMessage("❌ Please enter a valid time in HH:MM format.");
			return;
		}

		const [hour, minute] = time.split(":");

		let cronExpression = `${minute} ${hour} * * *`;
		if (interval === "weekly") {
			cronExpression = `${minute} ${hour} * * 1`;
		}

		const jobData = {
			userId,
			pin: parseInt(pin),
			state: pinState,
			cronExpression,
		};

		console.log("Sending data:", jobData);

		try {
			if (editId) {
				await axios.put(`${url}/cron/${editId}`, jobData);
				setMessage(`✓ Task updated`);
			} else {
				await axios.post(`${url}/cron`, jobData);
				setMessage(`✓ Task scheduled`);
			}

			setTime("");
			setInterval("daily");
			setPinState("ON");
			setPin(1);
			setEditId(null);
			fetchScheduledJobs();
			setTimeout(() => setMessage(""), 3000);
		} catch (error) {
			console.error("Error details:", error.response?.data || error.message);
			setMessage("❌ Error: " + (error.response?.data?.error || "Failed to schedule task"));
		}
	};

	const handleEdit = (job) => {
		const [minute, hour] = job.cronExpression.split(" ");
		const formattedTime = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
		setPin(job.pin);
		setPinState(job.state);
		setTime(formattedTime);
		setInterval("daily");
		setEditId(job._id);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Delete this task?")) {
			return;
		}
		try {
			await axios.delete(`${url}/cron/${id}`);
			setMessage("✓ Task deleted");
			fetchScheduledJobs();
			setTimeout(() => setMessage(""), 3000);
		} catch (err) {
			console.error("Failed to delete job:", err);
			setMessage("✗ Failed to delete");
		}
	};

	const getPinDisplayName = (index) => {
		return names[index]?.name || `Pin ${index + 1}`;
	};

	return (
		<div className="scheduler-container">
			{/* Header */}
			<div className="scheduler-header">
				<h2>Schedule Pin Control</h2>
				<p>Schedule your pins to turn ON or OFF at specific times</p>
			</div>

			{/* Message Alert */}
			{message && (
				<div className="scheduler-alert">
					{message}
				</div>
			)}

			{/* Scheduler Form Section */}
			<div className="scheduler-form-section">
				<h3>Create Schedule</h3>
				<form onSubmit={handleSchedule} className="scheduler-form">
					<div className="form-row">
						<div className="form-group">
							<label>Select Pin:</label>
							<select
								value={pin}
								onChange={(e) => setPin(parseInt(e.target.value))}
								className="form-control"
							>
								{Array.from({ length: 8 }, (_, i) => (
									<option key={i + 1} value={i + 1}>
										{i + 1} - {getPinDisplayName(i)}
									</option>
								))}
							</select>
						</div>

						<div className="form-group">
							<label>Time (HH:MM):</label>
							<input
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
								className="form-control"
								required
							/>
						</div>
					</div>

					<div className="form-row">
						<div className="form-group">
							<label>Repeat:</label>
							<select
								value={interval}
								onChange={(e) => setInterval(e.target.value)}
								className="form-control"
							>
								<option value="once">Once</option>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly (Monday)</option>
							</select>
						</div>

						<div className="form-group">
							<label>Action:</label>
							<select
								value={pinState}
								onChange={(e) => setPinState(e.target.value)}
								className="form-control"
							>
								<option value="ON">Turn ON</option>
								<option value="OFF">Turn OFF</option>
							</select>
						</div>
					</div>

					<div className="form-actions">
						<button type="submit" className="btn btn-primary">
							{editId ? "Update Task" : "Schedule Task"}
						</button>
						{editId && (
							<button
								type="button"
								className="btn btn-secondary"
								onClick={() => {
									setEditId(null);
									setTime("");
									setInterval("daily");
									setPinState("ON");
									setPin(1);
								}}
							>
								Cancel Edit
							</button>
						)}
					</div>
				</form>
			</div>

			{/* Scheduled Tasks Section */}
			<div className="scheduled-tasks-section">
				<h3>Your Scheduled Tasks</h3>

				{scheduledJobs.length === 0 ? (
					<div className="empty-state">
						<p>No tasks scheduled yet.</p>
					</div>
				) : (
					<div className="tasks-list">
						{scheduledJobs.map((job) => {
							const [minute, hour] = job.cronExpression.split(" ");
							const formattedTime = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
							
							return (
								<div key={job._id} className="task-card">
									<div className="task-info">
										<div>
											<span className="task-label">Pin:</span>
											<span className="task-value">{getPinDisplayName(job.pin - 1)}</span>
										</div>
										<div>
											<span className="task-label">Action:</span>
											<span className="task-value">{job.state}</span>
										</div>
										<div>
											<span className="task-label">Time:</span>
											<span className="task-value">{formattedTime}</span>
										</div>
									</div>
									<div className="task-actions">
										<button
											className="btn btn-edit"
											onClick={() => handleEdit(job)}
										>
											Edit
										</button>
										<button
											className="btn btn-delete"
											onClick={() => handleDelete(job._id)}
										>
											Delete
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

export default SchedulePinTimer;


