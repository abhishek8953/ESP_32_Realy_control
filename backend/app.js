const express = require("express");

const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express.Router();
const { asyncHandler } = require("./utils/AsyncHandler.js");
const { ApiError } = require("./utils/ApiError.js");
const { ApiResponse } = require("./utils/ApiResponse.js");
const { User } = require("./models/user.model.js");
const { verifyJWT } = require("./middlewares/auth.middleware.js");

const admin = require("firebase-admin");
const { UserButtonName } = require("./models/buttonName.model.js");
const cookieParser = require("cookie-parser");
const cron =require("node-cron")
const uu =require("uuid")



const serviceAccount = {
	project_id: process.env.project_id,
	private_key: process.env.private_key.replace(/\\n/g, "\n"),
	client_email: process.env.client_email,
};

// Initialize Firebase Admin
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.databaseURL,
});

const db = admin.database();
app.use(
	cors({
		origin: "http://localhost:5173", // Frontend origin
		credentials: true,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser())

// Real-time Stream Listener
// function setupFirebaseListener() {
// 	const ref = db.ref("/relays");

// 	ref.on(
// 		"value",
// 		(snapshot) => {
// 			console.log("Data changed:", snapshot.val());
// 			// Add your business logic here
// 		},
// 		(error) => {
// 			console.error("Listener error:", error);
// 		}
// 	);
// }

function getOnce(path) {}

const data = {
	relay1: false,
	relay2: false,
	relay3: false,
	relay4: false,
	relay5: false,
	relay6: false,
	relay7: false,
	relay8: false,
};

const genrateAccessTokenAndRefereshToken = async (userId) => {
	try {
		const user = await User.findById(userId);

		const accessToken = user.genrateAccessToken(); //genrating access token

		const refreshToken = user.genrateRefreshToken(); //genrating refresh token

		user.refreshToken = refreshToken; //create object of refresh token to save data base
		await user.save({ validateBeforeSave: false }); // save refresh token token in data base

		return { accessToken, refreshToken };
	} catch (error) {
		throw new ApiError(
			500,
			"Something Went wrong while generating refresh and access token "
		);
	}
};

// Express Endpoint to Trigger Changes (Demo)
app.post(
	"/user-signUp",
	asyncHandler(async (req, res) => {
		const { fullName, email, password, macAddress } = req.body;

		if (fullName === "") {
			throw new ApiError(400, "please enter the name");
		}

		if (email === "") {
			throw new ApiError(400, "please enter the name");
		}

		if (password === "") {
			throw new ApiError(400, "please enter the name");
		}

		// if(macAddress===""){
		// 	throw new ApiError(400,"please enter the mac address")
		// }

		const existedUser = await User.findOne({ email });

		if (existedUser) {
			throw new ApiError(409, "email is already exists");
		}

		const user = await User.create({
			fullName,
			email,
			password,
			macAddress,
		});

		const cretedUser = await User.findById(user._id).select(
			"-password -refreshToken"
		);

		if (!cretedUser) {
			throw new ApiError(
				500,
				"somthing wnt wrrong while registering the user !"
			);
		}

		return res
			.status(200)
			.json(
				new ApiResponse(200, cretedUser, "User is created successfuly")
			);
	})
);

app.post(
	"/user-logIn",
	asyncHandler(async (req, res) => {
		const { email, password } = req.body;

		if (email === "") {
			throw new ApiError(400, "email is require");
		}

		if (password === "") {
			throw new ApiError(400, "password is require");
		}

		const user = await User.findOne({ email });

		if (!user) {
			throw new ApiError(401, "user does not exises");
		}

		const ispasswordVaild = await user.isPasswordCorrect(password);

		if (!ispasswordVaild) {
			throw new ApiError(404, "Invailed email or password");
		}

		const { accessToken, refreshToken } =
			await genrateAccessTokenAndRefereshToken(user._id);

		const loggedInUser = await User.findById(user._id).select(
			//removwe the password and refress token from       the     response
			"-password -refreshToken"
		);

		const options = {
			httpOnly: true,
			secure: true,
		};

		return res
			.status(200)
			.cookie("accessToken", accessToken, options)
			.cookie("refreshToken", refreshToken, options)
			.json(
				new ApiResponse(
					200,
					{
						user: loggedInUser,
						accessToken,
						refreshToken,
					},
					"user logIn Successfully"
				)
			);
	})
);

app.post(
	"/change-password",
	verifyJWT,
	asyncHandler(async (req, res) => {
		const { oldPassword, newPassword } = req.body;

		const user = await User.findById(req.user?._id);
		if (!user) {
			throw new ApiError(401, "Unable to excess the user ");
		}

		const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

		if (!isPasswordCorrect) {
			throw new ApiError(402, "Invaild old password");
		}

		user.password = newPassword;
		await user.save({ validateBeforeSave: false });

		return res
			.status(200)
			.json(new ApiResponse(200, {}, "Password is changed successfully"));
	})
);

app.get(
	"/current-user",
	verifyJWT,
	asyncHandler(async (req, res) => {
		return res
			.status(200)
			.json(new ApiResponse(200, req.user, "User get successfully"));
	})
);

app.get(
	"/user-logOut",
	verifyJWT,
	asyncHandler(async (req, res) => {
		await User.findByIdAndUpdate(
			req.user._id,
			{
				$unset: {
					refreshToken: 1, //this remove the field from document
				},
			},
			{
				new: true,
			}
		);

		const options = {
			httpOnly: true,
			secure: true,
			sameSite: "None",
		};

		return res
			.status(200)
			.clearCookie("accessToken", options)
			.clearCookie("refreshToken", options)
			.json(new ApiResponse(200, {}, "User logged out"));
	})
);

app.get(
	"/refereshAccessToken",
	asyncHandler(async (req, res) => {
		//this is the controller of that end point where user can refresh your expair access token and refresh token
		const incomingRefreshToken =
			req.cookies?.refreshToken || req.body.refreshToken; //req.body.refreshToken for mobile device or which browser not support cookies like safari,firefox,Brave

		console.log(incomingRefreshToken);

		if (!incomingRefreshToken) {
			throw new ApiError(402, "Access token not found");
		}

		try {
			const decodedRefreshToken = jwt.verify(
				incomingRefreshToken,
				process.env.REFRESH_TOKEN_SECRET
			);

			if (!decodedRefreshToken) {
				throw new ApiError(401, "Invailed Refresh token");
			}

			const user = await User.findById(decodedRefreshToken?._id);

			if (!user) {
				throw new ApiError(402, "Invailed User");
			}

			if (user?.refreshToken !== incomingRefreshToken) {
				throw new ApiError(401, "Refresh token expaired are used");
			}

			const { accessToken, newRefreshToken } =
				await genrateAccessTokenAndRefereshToken(user?._id);

			const options = {
				httpOnly: true,
				secure: true,
				sameSite: "None",
			};

			return res
				.status(200)
				.cookie("accessToken", accessToken, options)
				.cookie("refreshToken", newRefreshToken, options)
				.json(
					new ApiResponse(
						200,
						{
							accessToken,
							refreshToken: newRefreshToken,
						},
						"New Refresh token genrated"
					)
				);
		} catch (error) {
			throw new ApiError(401, "Unable to genrate refrash token");
		}
	})
);

//abhishek code;




const newButtons = [
	{ data: "pin1",name:""},
	{ data: "pin2",name:""},
	{ data: "pin3",name:""},
	{ data: "pin4",name:""},
	{ data: "pin5",name:""},
	{ data: "pin6",name:""},
	{ data: "pin7",name:""},
	{ data: "pin8",name:""},
  ];

const upsertUserButtons = async (userId,buttonData) => {
	try {
	  const result = await UserButtonName.findOneAndUpdate(
		{ userId:userId }, // Search by userId
		{ $set: { buttonName: buttonData } }, // Set/overwrite buttonName array
		{ new: true, upsert: true } // new = return updated doc; upsert = insert if not found
	  );
  
	  return result
	} catch (err) {
	  console.error("Upsert failed:", err);
	}
  };

app.post("/setButton", verifyJWT, async(req, res) => {
	
	if (!req.user)
		return new ApiResponse(
			400,
			{ success: false },
			"unauthorise to change the button name"
		);
		
		const {buttons}= req.body;
		const {_id}=req.user;

		let data= await upsertUserButtons(_id,buttons);
		console.log(data);
		return res.json({"seccess":true,"data":data})

	

});

app.get("/buttons", verifyJWT, async (req, res) => {
	try {
	  const userId = req.user._id; // populated by verifyJWT middleware
  
	  const userButtons = await UserButtonName.findOne({ userId });
  
	  if (!userButtons) {
		return res.status(404).json({ message: "No button data found for this user." });
	  }
  
	  res.status(200).json(userButtons);
	} catch (err) {
	  console.error("Error fetching buttons:", err.message);
	  res.status(500).json({ message: "Internal Server Error" });
	}
  });

app.get("/ok", (req, res) => {
	return res.json({ status: 200, message: "server is online" });
});

app.get("/health", (req, res) => {
	db.ref("/relays")
		.get()
		.then((data) => {
			let arr = [];
			const final_value = data.toJSON();
			for (let i in final_value) {
				if (final_value[i] == false) {
					arr.push(0);
				} else {
					arr.push(1);
				}
			}
			console.log(final_value);
			return res.status(200).json({ status: "healthy", data: arr });
		});
		
});

app.post("/data", (req, res) => {
	// console.log(req.body);
	let i = 0;
	for (let value of req.body.data) {
		if (value) {
			data[`relay${i + 1}`] = true;
		} else {
			data[`relay${i + 1}`] = false;
		}
		i++;
	}

	db.ref("/relays")
		.update(data)
		.then((r) => {
			res.json({ msg: "success" });
		})
		.catch((err) => {
			console.log(err);
		});
});

// --------------------------------------------------------------------------------------

const CronJob = require("./models/cronJob.model.js");
const activeJobs = {}; //maintain he mapping of userId and jobs


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


const createJob = async (req, res) => {
	try {
	  const { userId, pin, state, cronExpression } = req.body;
	  const newJob = new CronJob({ userId, pin, state, cronExpression });
	  await newJob.save();
	  scheduleJob(newJob);
	  res.status(201).json({ message: "Cron job created", job: newJob });
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  };
  
  const getJobs = async (req, res) => {
	const { userId } = req.params;
	try {
	  const jobs = await CronJob.find({ userId });
	  res.json(jobs);
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  };
  
 const deleteJobDB = async (req, res) => {
	const { id } = req.params;
	try {
	  const job = await CronJob.findByIdAndDelete(id);
	  if (!job) return res.status(404).json({ message: "Job not found" });
  
	  deleteJob(job.jobId);
	  res.json({ message: "Job deleted" });
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  };
  
 const updateJob = async (req, res) => {
	const { id } = req.params;
	const { pin, state, cronExpression } = req.body;
	try {
	  const job = await CronJob.findById(id);
	  if (!job) return res.status(404).json({ message: "Job not found" });
  
	  deleteJob(job.jobId);
  
	  job.pin = pin;
	  job.state = state;
	  job.cronExpression = cronExpression;
	  await job.save();
  
	  scheduleJob(job);
	  res.json({ message: "Job updated", job });
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  };

const executePin = (pin, state) => {
  const relayKey = `relay${pin}`;
  if (!relayStates.hasOwnProperty(relayKey)) {
	console.error(`Invalid pin: ${pin}`);
	return;
  }

  const newState = state === "ON";
  relayStates[relayKey] = newState;

  // Log
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

const scheduleJob = (job) => {
  const task = cron.schedule(job.cronExpression, () => {
	executePin(job.pin, job.state);
  });
  activeJobs[job.jobId] = task;
};

const loadJobsFromDB = async () => {
  const jobs = await CronJob.find();
  jobs.forEach(scheduleJob);
};

const deleteJob = (jobId) => {
  if (activeJobs[jobId]) {
	activeJobs[jobId].stop();
	delete activeJobs[jobId];
  }
};

app.post("/cron", createJob);
app.get("/cron/:userId",getJobs);
app.delete("/cron/:id", deleteJobDB);
app.put("/cron/:id",updateJob);






module.exports = { app, db,scheduleJob, deleteJob, loadJobsFromDB };
