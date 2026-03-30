const admin = require("firebase-admin");
require("dotenv").config();

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

module.exports = { db, admin };
