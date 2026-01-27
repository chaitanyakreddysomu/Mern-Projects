
const admin = require('firebase-admin');
// TODO: Generate a new private key from Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
// Save the JSON file as 'service-account.json' in the config folder (DO NOT COMMIT THIS FILE)
// For now, using a placeholder path or checking if file exists
try {
    const serviceAccount = require('./service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized");
} catch (error) {
    console.warn("Firebase Admin Initialization Failed: ", error.message);
    console.warn("Push notifications will not work until a valid service-account.json is provided.");
}

module.exports = admin;
