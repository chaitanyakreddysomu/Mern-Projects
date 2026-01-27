importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "AIzaSyBvMbCArQjY2BMeBZcD6RxErTHQhpXD8hg",
    authDomain: "ics-hrms.firebaseapp.com",
    projectId: "ics-hrms",
    storageBucket: "ics-hrms.firebasestorage.app",
    messagingSenderId: "33068107453",
    appId: "1:33068107453:web:e000952d5e8e6b850d19d4",
    measurementId: "G-75DHVRDNTS"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || "/logo.jpeg",
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
