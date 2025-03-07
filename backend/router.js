const express = require("express");
const cors = require("cors");
const dotenv=require("dotenv")
dotenv.config()
const app = express.Router();

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

// Express Endpoint to Trigger Changes (Demo)

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
