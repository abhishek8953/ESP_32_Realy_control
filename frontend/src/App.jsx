import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Control from "./components/Contol";
import "./styles.css";
import Protected from "./components/Protected";
import SchedulePinTimer from "./components/SchedulePinTimer";
import Header from "./components/Header";
import EditButtonLabels from "./components/EditButtonLabels";
import VoiceRecognition from "./components/VoiceRecognition";
import UserContext from "./Context/UserContext";

const App = () => {
	const {user}= useContext(UserContext);
	console.log("user",user);
	const handleCommand = (device, state) => {
		console.log(`Turning ${state} the ${device}`);
		// Here you can call Firebase or trigger actions
	  };
	return (
		<div>
			<Router>

				<Header />
				{/* <VoiceRecognition onCommand={handleCommand}/> */}
				<Routes>
					<Route index path="/" element={<LandingPage />} />
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />
					<Route
						path="/schedule"
						element={
							<Protected>
								<SchedulePinTimer userId={user?._id} />
							</Protected>
						}
					/>
					<Route
						path="/control"
						element={
							<Protected>
								<Control />
							</Protected>
						}
					/>
					<Route
						path="/editButton"
						element={
							<Protected>
								<EditButtonLabels/>
							</Protected>
						}
					/>
				</Routes>
			</Router>
		</div>
	);
};

export default App;
