
const express =require("express")
const connectDB =require("./db/index.js");
const {db,app:router} =require("./app.js")



// connnectDB to mongoDB
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})



const app=express();
app.use("/v2",router)

db.ref(".info/connected").on("value", (snapshot) => {
	if (snapshot.val() === true) {
		console.log("✅ Firebase Database connected successfully!");
		app.listen(3000, () => {
			console.log(`Server running on port ${3000}`);
			// setupFirebaseListener();
		});
	} else {
		console.log("❌ Firebase Database NOT connected!");
	}
});


