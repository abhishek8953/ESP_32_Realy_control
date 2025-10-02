import React, { useState, useEffect } from "react";
import axios from "axios";

const url = import.meta.env.VITE_API_BACKEND_URL + "/v2";

function SchedulePinTimer({ userId }) {
	const [pin, setPin] = useState(1);
	const [names, setNames] = useState(1);
	const [time, setTime] = useState("");
	const [interval, setInterval] = useState("once");
	const [pinState, setPinState] = useState("ON");
	const [message, setMessage] = useState("");
	const [pinsState, setPinsState] = useState([]);
	const [scheduledJobs, setScheduledJobs] = useState([]);
	const [editId, setEditId] = useState(null);

	// Load current pin states + scheduled jobs
	useEffect(() => {
		fetchPinStates();
		fetchScheduledJobs();
	}, []);

	const fetchPinStates = async () => {
		try {
			const res = await axios.get(`${url}/health`);
			setPinsState(res.data.data);
			const but = await axios.get(`${url}/buttons`, {
				withCredentials: true,
			});
			setNames(but.data.buttonName);
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

		const isValidTime = /^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/.test(time);
		if (!isValidTime) {
			setMessage("Please enter a valid time in HH:MM format.");
			return;
		}

		const [hour, minute] = time.split(":");

		let cronExpression;
		if (interval === "once" || interval === "daily") {
			cronExpression = `${minute} ${hour} * * *`;
		} else if (interval === "weekly") {
			cronExpression = `${minute} ${hour} * * 1`;
		}

		const jobData = {
			userId,
			pin,
			state: pinState,
			cronExpression,
		};

		try {
			if (editId) {
				await axios.put(`${url}/cron/${editId}`, jobData);
				setMessage(
					`Updated Pin ${pin} to turn ${pinState} at ${time} (${interval})`
				);
			} else {
				await axios.post(`${url}/cron`, jobData);
				setMessage(
					`Scheduled Pin ${pin} to turn ${pinState} at ${time} (${interval})`
				);
			}

			setTime("");
			setInterval("once");
			setPinState("ON");
			setPin(1);
			setEditId(null);
			fetchScheduledJobs();
		} catch (error) {
			console.log(error);
			setMessage("Error scheduling cron job. Please try again.");
		}
	};

	const handleEdit = (job) => {
		const [minute, hour] = job.cronExpression.split(" ");
		const formattedTime = `${hour.padStart(2, "0")}:${minute.padStart(
			2,
			"0"
		)}`;
		setPin(job.pin);
		setPinState(job.state);
		setTime(formattedTime);
		setInterval("daily"); // default edit mode
		setEditId(job._id);
	};

	const handleDelete = async (id) => {
		try {
			await axios.delete(`${url}/cron/${id}`);
			setMessage("Job deleted successfully.");
			fetchScheduledJobs();
		} catch (err) {
			console.error("Failed to delete job:", err);
		}
	};

	return (
		<div>
			<h2>Schedule Pin to Turn ON/OFF at a Specific Time</h2>
			<p>
				You can schedule pins to turn ON or OFF at specific times.
				Choose a time, select the repeat interval (once, daily, weekly),
				and set your pin state (ON/OFF).
			</p>
			<form onSubmit={handleSchedule}>
				<div>
					<label>Choose Pin (1-8):</label>
					<select
						value={pin}
						onChange={(e) => setPin(parseInt(e.target.value))}
					>
						{Array.from({ length: 8 }, (_, i) => (
							<option key={i + 1} value={i + 1}>
							{names[i]?.name}	Pin {i + 1}
							</option>
						))}
					</select>
				</div>
				<div>
					<label>Select Time:</label>
					<input
						type="time"
						value={time}
						onChange={(e) => setTime(e.target.value)}
					/>
				</div>
				<div>
					<label>Repeat Interval:</label>
					<select
						value={interval}
						onChange={(e) => setInterval(e.target.value)}
					>
						<option value="once">Once</option>
						<option value="daily">Daily</option>
						<option value="weekly">Weekly</option>
					</select>
				</div>
				<div>
					<label>Turn Pin:</label>
					<select
						value={pinState}
						onChange={(e) => setPinState(e.target.value)}
					>
						<option value="ON">ON</option>
						<option value="OFF">OFF</option>
					</select>
				</div>
				<button type="submit">
					{editId ? "Update Task" : "Schedule Task"}
				</button>
				{editId && (
					<button
						type="button"
						onClick={() => {
							setEditId(null);
							setTime("");
							setInterval("once");
							setPinState("ON");
							setPin(1);
						}}
					>
						Cancel Edit
					</button>
				)}
			</form>

			{message && <p>{message}</p>}

			<h3>Current Pin States:</h3>
			<ul>
				{pinsState.map((state, index) => (
					<li key={index}>
						<span className="back-link"> {names[index]?.name}</span>{" "}
						Pin {index + 1}: {state === 1 ? "ON" : "OFF"}
					</li>
				))}
			</ul>

			<h3>Scheduled Tasks:</h3>
			<ul>
				{scheduledJobs.length === 0 ? (
					<li>No task scheduled yet.</li>
				) : (
					scheduledJobs.map((job) => {
						const [minute, hour] = job.cronExpression.split(" ");
						const formattedTime = `${hour.padStart(
							2,
							"0"
						)}:${minute.padStart(2, "0")}`;
						return (
							<li key={job._id}>
								Pin {job.pin} will turn {job.state} at{" "}
								{formattedTime} (task: {job.cronExpression})
								<button
									onClick={() => handleEdit(job)}
									style={{
										marginTop: "20px",
										backgroundColor: "#28a745",
										color: "white",
										padding: "10px 20px",
										border: "none",
										borderRadius: "4px",
										cursor: "pointer",
									}}
								>
									Edit
								</button>
								<button
									onClick={() => handleDelete(job._id)}
									style={{
										marginTop: "20px",
										marginLeft: "10px",
										backgroundColor: "orangered",
										color: "white",
										padding: "10px 20px",
										border: "none",
										borderRadius: "4px",
										cursor: "pointer",
									}}
								>
									Delete
								</button>
							</li>
						);
					})
				)}
			</ul>
		</div>
	);
}

export default SchedulePinTimer;
