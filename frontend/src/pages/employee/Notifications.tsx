import { Card, CardContent } from "@/components/ui/card";
import { Info, CheckCircle2, AlertTriangle, BellRing, Check } from "lucide-react";
import { MOCK_NOTIFICATIONS } from "@/data/mock";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import type { Notification } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { requestFCMToken, onMessageListener } from "@/firebase";
import { useToast } from "@/context/ToastContext";

export default function Notifications() {
    const { addToast } = useToast();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/employee/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // 1. Initial heuristic check
        const localReg = localStorage.getItem('fcm_registered');
        if (Notification.permission === 'granted' && localReg) {
            setIsRegistered(true);
        }

        // 2. Deep Verify with Backend (Self-healing)
        const checkBackendStatus = async () => {
            const token = await requestFCMToken(); // Get strict current token
            if (token) {
                const authToken = localStorage.getItem('token');
                try {
                    const res = await fetch(`/api/notifications/check-fcm-status?token=${encodeURIComponent(token)}`, {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        // Backend says NO, so we must show "Enable" button again
                        if (!data.registered) {
                            console.warn("Local says registered, but backend mismatch. Resetting.");
                            localStorage.removeItem('fcm_registered');
                            setIsRegistered(false);
                            setNotificationPermission("default"); // Force UI update
                        } else {
                            // Backend says YES, ensure local is synced
                            if (!localReg) {
                                localStorage.setItem('fcm_registered', 'true');
                                setIsRegistered(true);
                                setNotificationPermission("granted");
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to verify FCM status", e);
                }
            }
        };

        // Only verify if we think we might have permission or want to be sure
        if (Notification.permission === 'granted') {
            checkBackendStatus();
        }

        onMessageListener().then((payload: any) => {
            console.log("Foreground notification:", payload);
            addToast(`New Notification: ${payload.notification?.title}`, "info");
            fetchNotifications();
        }).catch((err) => console.log('failed: ', err));
    }, []);

    const handleEnableNotifications = async () => {
        try {
            const token = await requestFCMToken();
            if (token) {
                try {
                    // Register device with backend
                    const authToken = localStorage.getItem('token');
                    // Use a simplified User Agent or Platform as Device Name
                    let deviceName = "Unknown Device";
                    if (navigator.userAgent.indexOf("Win") != -1) deviceName = "Windows PC";
                    if (navigator.userAgent.indexOf("Mac") != -1) deviceName = "Mac";
                    if (navigator.userAgent.indexOf("Linux") != -1) deviceName = "Linux";
                    if (navigator.userAgent.indexOf("Android") != -1) deviceName = "Android";
                    if (navigator.userAgent.indexOf("like Mac") != -1) deviceName = "iOS";

                    // Append Browser
                    if (navigator.userAgent.indexOf("Chrome") != -1) deviceName += " (Chrome)";
                    else if (navigator.userAgent.indexOf("Firefox") != -1) deviceName += " (Firefox)";
                    else if (navigator.userAgent.indexOf("Safari") != -1) deviceName += " (Safari)";

                    await fetch('/api/notifications/register-fcm', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({ token, device: deviceName })
                    });

                    localStorage.setItem('fcm_registered', 'true');
                    setNotificationPermission("granted");
                    setIsRegistered(true);
                    addToast("Live Alerts Enabled for this device!", "success");
                } catch (error) {
                    console.error("Registration failed", error);
                    addToast("Failed to register device with server.", "error");
                }
            } else {
                // Token null - Error occurred in firebase.ts
                console.warn("Failed to enable notifications - No Token");

                // Heuristic check for Brave or likely cause
                if (Notification.permission === 'granted') {
                    alert("Failed to connect to Push Service.\n\nIf you are using Brave Browser:\n1. Open Settings -> Privacy and security\n2. Enable 'Use Google Services for Push Messaging'\n3. Relaunch Brave.\n\nOtherwise, please try Chrome, Edge, or Firefox.");
                } else if (Notification.permission === 'denied') {
                    alert("Notifications are blocked. Please enable them in your browser settings (click the lock icon in the address bar).");
                } else {
                    alert("Failed to enable notifications. Please try again or check browser settings.");
                }
            }
        } catch (e) {
            console.error("Handle Enable Error:", e);
        }
    };

    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/employee/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Update local state
                setNotifications(prev => prev.map(n =>
                    n._id === id ? { ...n, read: true } : n
                ));
                // Also update selected if it's the one open
                if (selectedNotification?._id === id) {
                    setSelectedNotification(prev => prev ? { ...prev, read: true } : null);
                }
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => !n.read);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-600/30">
                            <BellRing className="h-6 w-6 text-white" />
                        </div>

                        Notifications
                    </h1>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end gap-1">
                        <Button
                            onClick={handleEnableNotifications}
                            disabled={isRegistered}
                            variant={isRegistered ? "secondary" : "outline"}
                            className={cn(
                                "gap-2 transition-all",
                                isRegistered
                                    ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200 opacity-100"
                                    : "border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            )}
                        >
                            {isRegistered ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4" /> Live Alerts Enabled
                                </>
                            ) : (
                                <>
                                    <BellRing className="h-4 w-4" /> Enable Live Alerts
                                </>
                            )}
                        </Button>
                        {!isRegistered && (
                            <p className="text-[10px] text-muted-foreground w-64 text-right leading-tight">
                                Note: This is for only this device. If you want another device you need to enable again in that device and browser.
                            </p>
                        )}
                    </div>

                    <div className="relative grid grid-cols-2 bg-white rounded-lg border border-amber-600 shadow-lg shadow-amber-600/30 p-1 w-fit select-none">
                        {/* Sliding indicator */}
                        <span
                            className={cn(
                                "absolute inset-1 w-[calc(50%-0.25rem)] rounded-md bg-amber-600 transition-transform duration-300 ease-in-out",
                                filter === "all" ? "translate-x-0" : "translate-x-full"
                            )}
                        />

                        {/* ALL */}
                        <button
                            type="button"
                            onClick={() => setFilter("all")}
                            className={cn(
                                "relative z-10 px-5 py-1.5 text-sm font-semibold rounded-md transition-colors duration-300",
                                filter === "all" ? "text-white" : "text-black"
                            )}
                        >
                            All
                        </button>

                        {/* UNREAD */}
                        <button
                            type="button"
                            onClick={() => setFilter("unread")}
                            className={cn(
                                "relative z-10 px-5 py-1.5 text-sm font-semibold rounded-md transition-colors duration-300",
                                filter === "unread" ? "text-white" : "text-black"
                            )}
                        >
                            Unread
                        </button>
                    </div>
                </div>


            </div>

            <div className="grid gap-4">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/5">
                        <p className="text-muted-foreground">No notifications found.</p>
                    </div>
                ) : (
                    filteredNotifications.map((notif) => (
                        <Card
                            key={notif._id}
                            className={cn(
                                "group relative overflow-hidden border-l-4 cursor-pointer transition-all duration-300",
                                !notif.read
                                    ? "bg-amber-50/50 border-l-amber-500 shadow-sm hover:shadow-md"
                                    : "bg-gray-50/50 border-l-gray-400 hover:shadow-sm"
                            )}
                            onClick={() => setSelectedNotification(notif)}
                        >
                            <CardContent className="p-5 flex gap-4 items-start">
                                {/* ICON */}
                                <div
                                    className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110",
                                        !notif.read
                                            ? "bg-amber-100 text-amber-600"
                                            : "bg-gray-100 text-gray-500"
                                    )}
                                >
                                    {notif.type === "alert" ? (
                                        <AlertTriangle className="h-6 w-6" />
                                    ) : notif.type === "success" ? (
                                        <CheckCircle2 className="h-6 w-6" />
                                    ) : (
                                        <Info className="h-6 w-6" />
                                    )}
                                </div>

                                {/* CONTENT */}
                                <div className="flex-1 min-w-0">
                                    {/* TOP ROW */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h4
                                                className={cn(
                                                    "text-base font-semibold truncate",
                                                    !notif.read
                                                        ? "text-foreground"
                                                        : "text-gray-700"
                                                )}
                                            >
                                                {notif.title}
                                            </h4>

                                            {!notif.read && (
                                                <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] px-2 py-0.5 uppercase tracking-wide">
                                                    New
                                                </Badge>
                                            )}
                                        </div>

                                        {/* META */}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                            <span
                                                className={cn(
                                                    !notif.read
                                                        ? "text-amber-600 font-medium"
                                                        : "text-gray-500"
                                                )}
                                            >
                                                {formatDistanceToNow(new Date(notif.date), {
                                                    addSuffix: true,
                                                })}
                                            </span>

                                            {notif.source && (
                                                <>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span className="text-muted-foreground">
                                                        From {notif.source}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* MESSAGE (SINGLE LINE ONLY) */}
                                    <p
                                        className={cn(
                                            "mt-1 text-sm leading-snug line-clamp-1",
                                            !notif.read
                                                ? "text-foreground/90"
                                                : "text-muted-foreground"
                                        )}
                                        title={notif.message}
                                    >
                                        {notif.message}
                                    </p>
                                </div>

                                {/* ACTION */}
                                {!notif.read && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                        <button
                                            type="button"
                                            title="Mark as Read"
                                            onClick={(e) => handleMarkAsRead(notif._id, e)}
                                            className="h-10 w-10 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-600/30 active:scale-95"
                                        >
                                            <Check className="h-5 w-5 text-white" />
                                        </button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    ))
                )}
            </div>

            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between gap-3 text-xl w-full">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    !selectedNotification?.read ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
                                )}>
                                    {selectedNotification?.type === 'alert' ? <AlertTriangle className="h-5 w-5" /> :
                                        selectedNotification?.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                                            <Info className="h-5 w-5" />}
                                </div>
                                <span>{selectedNotification?.title}</span>
                                {selectedNotification?.source && (
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        From {selectedNotification.source}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={cn(
                                    "text-xs font-normal whitespace-nowrap shrink-0",
                                    !selectedNotification?.read ? "text-amber-600" : "text-gray-500"
                                )}>
                                    {selectedNotification?.date && formatDistanceToNow(new Date(selectedNotification.date), { addSuffix: true })}
                                </span>

                            </div>
                        </DialogTitle>
                        <DialogDescription className="pt-4">
                            <div className={cn(
                                "text-sm leading-relaxed p-4 rounded-lg border",
                                !selectedNotification?.read
                                    ? "bg-amber-50 border-amber-100 text-foreground"
                                    : "bg-gray-50 border-gray-200 text-muted-foreground"
                            )}>
                                {selectedNotification?.message}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        {/* <Button variant="outline" onClick={() => setSelectedNotification(null)}>Close</Button> */}
                        {!selectedNotification?.read && (
                            <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => selectedNotification && handleMarkAsRead(selectedNotification._id)}>Mark as Read</Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
