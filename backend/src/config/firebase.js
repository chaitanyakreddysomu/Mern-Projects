
const admin = require('firebase-admin');
// TODO: Generate a new private key from Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
// Save the JSON file as 'service-account.json' in the config folder (DO NOT COMMIT THIS FILE)
// For now, using a placeholder path or checking if file exists
try {
    let serviceAccount;

    // 1. Try Environment Variable (Best for Render/Deployment)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log("Attempting to initialize Firebase from Environment Variable");
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", e.message);
        }
    }

    // 2. Fallback to Local File (Development)
    if (!serviceAccount) {
        try {
            serviceAccount = require('./service-account.json');
            console.log("Attempting to initialize Firebase from local file");
        } catch (e) {
            console.log("No local service-account.json found (Expected in production if using Env vars)");
        }
    }

    if (serviceAccount) {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin Initialized Successfully");
        }
    } else {
        console.warn("WARNING: No valid Firebase credentials found (Env or File). Push notifications will fail.");
    }

} catch (error) {
    console.error("Firebase Admin Critical Init Error:", error.message);
}

module.exports = admin;
