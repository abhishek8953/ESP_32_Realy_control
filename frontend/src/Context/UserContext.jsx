import React, { createContext, useState } from "react";
import axios from "axios";
const url = import.meta.env.VITE_API_BACKEND_URL + "/v2";
// Create the User Context
const UserContext = createContext();

// Create the User Provider
export const UserProvider = ({ children }) => {
	const [user, setUser] = useState();

	const loggedInUser = async () => {
		const res = await axios.get(url + "/current-user", {
			withCredentials: true,
		});

		if (!res.data.data) return;

		setUser(res.data.data);
	};

    

	const logoutUser = async () => {
		const res = await axios.get(url + "/user-logOut", {
			withCredentials: true,
		});
        setUser({})
	};

	return (
		<UserContext.Provider value={{ user, loggedInUser, logoutUser }}>
			{children}
		</UserContext.Provider>
	);
};

export default UserContext;
