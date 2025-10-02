import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const url = import.meta.env.VITE_API_BACKEND_URL + "/v2";

const Signup = () => {
	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		password: "",
		macAddress: "",
	});

	const navigate = useNavigate();

	const handleChange = (e) =>
		setFormData({ ...formData, [e.target.name]: e.target.value });

	const handleSubmit = (e) => {
		e.preventDefault();
		axios
			.post(url + "/user-signUp", formData)
			.then((res) => {
				console.log(res);
			})
			.catch((err) => {
				console.log(err);
			});

		navigate("/login");
	};

	return (
		<div className="form-container">
			<h2>Sign Up</h2>
			<form onSubmit={handleSubmit}>
				<input
					name="fullName"
					placeholder="Full Name"
					onChange={handleChange}
					required
				/>
				<input
					name="macAddress"
					placeholder="MAC Address"
					onChange={handleChange}
					required
				/>
				<input
					name="email"
					type="email"
					placeholder="Email"
					onChange={handleChange}
					required
				/>
				<input
					name="password"
					type="password"
					placeholder="Password"
					onChange={handleChange}
					required
				/>
				<button type="submit" style={{ marginBottom: "2rem" }}>
					Sign Up
				</button>
				<span className="back-link" onClick={() => navigate("/")}>
					Back to Home
				</span>

				<span
					className="back-link"
					style={{ marginLeft: "10rem" }}
					onClick={() => navigate("/login")}
				>
					Back to login
				</span>
			</form>
		</div>
	);
};

export default Signup;
