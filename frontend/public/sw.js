self.addEventListener("push", event => {
    const data = event.data.json();

    self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/vite.svg", // Using existing icon for now
        badge: "/vite.svg",
        data: data.url
    });
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data || "/notifications")
    );
});
