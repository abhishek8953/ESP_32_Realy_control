const { User } = require("../models/user.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/AsyncHandler.js");
const jwt = require("jsonwebtoken");

/**
 * Generate access and refresh tokens
 */
const generateAccessTokenAndRefreshToken = async (userId) => {
	try {
		const user = await User.findById(userId);

		const accessToken = user.genrateAccessToken();
		const refreshToken = user.genrateRefreshToken();

		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		throw new ApiError(
			500,
			"Something went wrong while generating refresh and access token",
		);
	}
};

/**
 * User signup
 */
const signUp = asyncHandler(async (req, res) => {
	const { fullName, email, password, macAddress } = req.body;

	if (!fullName || fullName === "") {
		throw new ApiError(400, "Please enter the name");
	}

	if (!email || email === "") {
		throw new ApiError(400, "Please enter the email");
	}

	if (!password || password === "") {
		throw new ApiError(400, "Please enter the password");
	}

	const existedUser = await User.findOne({ email });

	if (existedUser) {
		throw new ApiError(409, "Email already exists");
	}

	const user = await User.create({
		fullName,
		email,
		password,
		macAddress,
	});

	const createdUser = await User.findById(user._id).select(
		"-password -refreshToken",
	);

	if (!createdUser) {
		throw new ApiError(500, "Something went wrong while registering the user");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, createdUser, "User created successfully"));
});

/**
 * User login
 */
const logIn = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	if (!email || email === "") {
		throw new ApiError(400, "Email is required");
	}

	if (!password || password === "") {
		throw new ApiError(400, "Password is required");
	}

	const user = await User.findOne({ email });

	if (!user) {
		throw new ApiError(401, "User does not exist");
	}

	const isPasswordValid = await user.isPasswordCorrect(password);

	if (!isPasswordValid) {
		throw new ApiError(401, "Invalid email or password");
	}

	const { accessToken, refreshToken } =
		await generateAccessTokenAndRefreshToken(user._id);

	const loggedInUser = await User.findById(user._id).select(
		"-password -refreshToken",
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
				"User logged in successfully",
			),
		);
});

/**
 * Refresh access token
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken =
		req.cookies?.refreshToken || req.body.refreshToken;

	if (!incomingRefreshToken) {
		throw new ApiError(401, "Refresh token not found");
	}

	try {
		const decodedRefreshToken = jwt.verify(
			incomingRefreshToken,
			process.env.REFRESH_TOKEN_SECRET,
		);

		if (!decodedRefreshToken) {
			throw new ApiError(401, "Invalid refresh token");
		}

		const user = await User.findById(decodedRefreshToken?._id);

		if (!user) {
			throw new ApiError(401, "User not found");
		}

		if (user?.refreshToken !== incomingRefreshToken) {
			throw new ApiError(401, "Refresh token expired or already used");
		}

		const { accessToken, refreshToken: newRefreshToken } =
			await generateAccessTokenAndRefreshToken(user?._id);

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
					"New refresh token generated",
				),
			);
	} catch (error) {
		throw new ApiError(401, "Unable to generate refresh token");
	}
});

/**
 * Change password
 */
const changePassword = asyncHandler(async (req, res) => {
	const { oldPassword, newPassword } = req.body;

	const user = await User.findById(req.user?._id);
	if (!user) {
		throw new ApiError(401, "Unable to access the user");
	}

	const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

	if (!isPasswordCorrect) {
		throw new ApiError(401, "Invalid old password");
	}

	user.password = newPassword;
	await user.save({ validateBeforeSave: false });

	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * Get current user
 */
const getCurrentUser = asyncHandler(async (req, res) => {
	return res
		.status(200)
		.json(new ApiResponse(200, req.user, "User fetched successfully"));
});

/**
 * User logout
 */
const logOut = asyncHandler(async (req, res) => {
	await User.findByIdAndUpdate(
		req.user._id,
		{
			$unset: {
				refreshToken: 1,
			},
		},
		{
			new: true,
		},
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
		.json(new ApiResponse(200, {}, "User logged out successfully"));
});

module.exports = {
	signUp,
	logIn,
	logOut,
	refreshAccessToken,
	changePassword,
	getCurrentUser,
};
