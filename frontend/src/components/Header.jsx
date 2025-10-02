import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserContext from "../Context/UserContext";

const Header = () => {
	const { user, logoutUser } = useContext(UserContext);
	const navigate = useNavigate();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleLogout = async () => {
		await logoutUser();
		navigate("/login");
	};

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	return (
		<header style={styles.header}>
			<h1 style={styles.title}>Home Automation App</h1>

			{/* Hamburger Menu for Mobile */}
			<div style={styles.hamburger} onClick={toggleMenu}>
				&#9776;
			</div>

			{/* Navigation Links */}
			<nav
				style={{ ...styles.nav, ...(isMenuOpen ? styles.navOpen : {}) }}
			>
				{!user?.email && (
					<Link style={styles.link} to="/">
						Home
					</Link>
				)}
				{user?.email && (
					<Link style={styles.link} to="/control">
						Control
					</Link>
				)}
				{user?.email && (
					<Link style={styles.link} to="/schedule">
						Schedule
					</Link>
				)}
				

				
			

				{/* Edit Button Link */}
				{user?.email && (
					<Link style={styles.link} to="/editButton">
						Edit Button
					</Link>
				)}

				
				<Link style={styles.link} to="/about">
					About
				</Link>
			</nav>

			{/* User Info / Login */}
			{user?.email ? (
				<div style={styles.userInfo}>
					<span style={styles.email}>{user.email}</span>
					<button onClick={handleLogout} style={styles.logout}>
						Logout
					</button>
				</div>
			) : (
				<Link style={styles.loginBtn} to="/login">
					Login
				</Link>
			)}
		</header>
	);
};

const styles = {
	header: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: "15px 30px",
		backgroundColor: "#333",
		color: "#fff",
		position: "relative",
		flexWrap: "wrap",
	},
	title: {
		margin: 0,
		fontSize: "1.5rem",
	},
	nav: {
		display: "flex",
		gap: "15px",
		marginLeft: "auto",
	},
	navOpen: {
		display: "block", // Show when the menu is toggled
		position: "absolute",
		top: "60px",
		left: "0",
		width: "100%",
		backgroundColor: "#333",
		textAlign: "center",
		padding: "10px 0",
	},
	link: {
		color: "#fff",
		textDecoration: "none",
		fontSize: "1rem",
		padding: "6px 12px",
	},
	userInfo: {
		display: "flex",
		alignItems: "center",
		gap: "10px",
	},
	email: {
		fontSize: "0.9rem",
		color: "#ccc",
	},
	logout: {
		backgroundColor: "#ff4d4f",
		border: "none",
		color: "#fff",
		padding: "6px 12px",
		borderRadius: "4px",
		cursor: "pointer",
	},
	loginBtn: {
		color: "#fff",
		textDecoration: "none",
		border: "1px solid #fff",
		padding: "5px 10px",
		borderRadius: "4px",
	},
	hamburger: {
		display: "none", // Hide by default on larger screens
		fontSize: "2rem",
		cursor: "pointer",
	},

	// Media Query for Mobile
	"@media screen and (max-width: 768px)": {
		header: {
			flexDirection: "column",
			alignItems: "flex-start",
			padding: "15px",
		},
		title: {
			fontSize: "1.2rem",
		},
		nav: {
			display: "none", // Hide links by default
			width: "100%",
			flexDirection: "column",
			gap: "10px",
			padding: "10px 0",
		},
		navOpen: {
			display: "block", // Show menu links when toggled
		},
		link: {
			padding: "10px",
			fontSize: "1.2rem",
			textAlign: "center",
		},
		hamburger: {
			display: "block", // Show hamburger on mobile
		},
	},
};

export default Header;
