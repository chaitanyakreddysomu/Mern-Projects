import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// TODO: Replace with your actual config from Firebase Console
// const firebaseConfig = {
//     apiKey: "YOUR_API_KEY",
//     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
//     projectId: "YOUR_PROJECT_ID",
//     storageBucket: "YOUR_PROJECT_ID.appspot.com",
//     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//     appId: "YOUR_APP_ID"
// };
const firebaseConfig = {
    apiKey: "AIzaSyBvMbCArQjY2BMeBZcD6RxErTHQhpXD8hg",
    authDomain: "ics-hrms.firebaseapp.com",
    projectId: "ics-hrms",
    storageBucket: "ics-hrms.firebasestorage.app",
    messagingSenderId: "33068107453",
    appId: "1:33068107453:web:e000952d5e8e6b850d19d4",
    measurementId: "G-75DHVRDNTS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFCMToken = async (): Promise<string | null> => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return null;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied");
            return null;
        }

        const token = await getToken(messaging, {
            vapidKey: "BMc6p4U8ZOsORxnJNmKQGekN0qg-cOVQOkDlohylbN8665k6mvMGzi3VUpTwfjyEWHeIqbYFQqQ7rGDMz9eOaaI"
        });

        if (!token) {
            console.warn("No registration token available. Request permission to generate one.");
            return null;
        }

        // Return token for caller to handle backend sync
        return token;
    } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });

export { messaging };
