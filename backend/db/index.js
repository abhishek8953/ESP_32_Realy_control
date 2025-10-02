
import mongoose from "mongoose"

const connectDB = async () => {
	try {
		let connectionInstance = await mongoose.connect(
			`${process.env.MONGODB_URL}/HomeAutomation`
		);
		console.log(`mongooDB connected ${connectionInstance.connection.host}`);
	} catch (error) {
		console.log("mongoseDB ERROR :", error);
		process.exit(1);
	}
};
export {connectDB}

