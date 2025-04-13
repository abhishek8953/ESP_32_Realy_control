const express = require("express");


const cors = require("cors");
const dotenv=require("dotenv")
dotenv.config()
const app = express.Router();
const asyncHandler = require("./utils/AsyncHandler.js");
const {ApiError} = require("./utils/ApiError.js")
const{ApiResponse}=require("./utils/ApiResponse.js")
const{User} =require("./models/user.model.js")
const { verifyJWT } = require("./middlewares/auth.middleware.js")



const admin = require("firebase-admin");
const serviceAccount = {
    project_id: process.env.project_id,
    private_key: process.env.private_key.replace(/\\n/g, "\n"),
    client_email: process.env.client_email,
}

  
// Initialize Firebase Admin
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL:process.env.databaseURL
});

const db = admin.database();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
app.post("/user-signUp",asyncHandler(async(req,res)=>{
	const {fullName, email, password, macAddress } = req.body;

	if(fullName===""){
		throw new ApiError(400,"please enter the name")
	}
    
	
	if(email===""){
		throw new ApiError(400,"please enter the name")
	}

	
	if(password===""){
		throw new ApiError(400,"please enter the name")
	}

	
	// if(macAddress===""){
	// 	throw new ApiError(400,"please enter the name")
	// }

	const existedUser = await User.findOne({ email });

	if(existedUser){
		throw new ApiError(409,"email is already exists")
	}

	const user = await User.create({
		fullName,
		email,
		password,
		macAddress
	})

	const cretedUser = await User.findById(user._id).select("-password -refreshToken")

	if(!cretedUser){
		throw new ApiError(500,"somthing wnt wrrong while registering the user !")
	}

	return res.status(200).json(new ApiResponse(200,cretedUser,"User is created successfuly"))




}))

app.post("/user-logIn",asyncHandler(async(req,res)=>{

	const {email,password} =req.body;

	if(email ===""){
		throw new ApiError(400,"email is require")
	}

	if(password ===""){
		throw new ApiError(400,"password is require")
	}

	const user = await User.findOne({email});

	if(!user){
		throw new ApiError(401,"user does not exises")
	}

	const ispasswordVaild = await user.isPasswordCorrect(password);

	if (!ispasswordVaild) {
		throw new ApiError(404, "Invailed email or password");
	  }

	  const { accessToken, refreshToken } =
	  await genrateAccessTokenAndRefereshToken(user._id);

	  const loggedInUser = await User.findById(user._id).select(   //removwe the password and refress token from       the     response
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

}))

app.post("/change-password",verifyJWT,asyncHandler(async(req,res)=>{
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


}))

app.get("/current-user",verifyJWT,asyncHandler(async(req,res)=>{

	return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User get successfully"));

}))



app.get("/user-logOut",verifyJWT,asyncHandler(async(req , res)=>{
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
		sameSite:"None"
	  };
	
	  return res
		.status(200)
		.clearCookie("accessToken", options)
		.clearCookie("refreshToken", options)
		.json(new ApiResponse(200, {}, "User logged out"));

}));

app.get("/refereshAccessToken",asyncHandler(async(req,res)=>{
	//this is the controller of that end point where user can refresh your expair access token and refresh token
	const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken; //req.body.refreshToken for mobile device or which browser not support cookies like safari,firefox,Brave
 
	console.log(incomingRefreshToken)
  
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
		sameSite:"None"
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

	
}))

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

module.exports = { app, db };
