import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/config/api";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Command, Bell, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/context/ToastContext";

export function Topbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize Firebase Cloud Messaging
    const initFCM = async () => {
        if (user) {
            try {
                const { requestFCMToken, onMessageListener } = await import('@/firebase');

                // Get token and sync with backend
                const token = await requestFCMToken();

                if (token) {
                    // We successfully initialized Firebase Messaging
                    // We do NOT auto-register here. Registration is manual via "Enable Push".
                    console.log("FCM Initialized (Listener Active)");
                }

                // Listen for foreground messages
                onMessageListener().then((payload: any) => {
                    console.log('Foreground Message:', payload);
                    const { title, body } = payload.notification;
                    // 1. Show In-App Toast
                    addToast(`${title}: ${body}`, "info");

                    // 2. Show Browser Notification (even if app is open)
                    if (Notification.permission === "granted") {
                        new Notification(title, {
                            body: body,
                            icon: "/vite.svg"
                        });
                    }

                    // We can also trigger refresh of notification list here
                    fetchNotifications();
                });

            } catch (err) {
                console.log("FCM Init Error (likely config missing):", err);
            }
        }
    };

    useEffect(() => {
        // Only auto-init if permission is ALREADY granted
        if (user && Notification.permission === "granted") {
            initFCM();
        }
    }, [user]);

    const requestPermission = () => {
        if (!("Notification" in window)) {
            addToast("This browser does not support desktop notification", "error");
        } else if (Notification.permission === "granted") {
            addToast("Notifications are already enabled!", "success");
            initFCM(); // Re-sync if needed
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    addToast("Notifications enabled!", "success");
                    initFCM(); // Initialize now that we have permission
                }
            });
        }
    };

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const token = localStorage.getItem('token');
            const endpoint = user.role === 'ADMIN'
                ? '/api/admin/notifications'
                : '/api/employee/notifications';

            const res = await apiFetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();

                // Sort by date desc (newest first)
                const sortedData = data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setNotifications(sortedData);
                const unread = sortedData.filter((n: any) => !n.read);
                setUnreadCount(unread.length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Fallback polling (slower) just in case
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleRefreshData = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                // Attempt to refresh the token
                const res = await apiFetch('/api/auth/refresh', {
                    method: 'POST',
                    body: JSON.stringify({ refreshToken })
                });

                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem('token', data.accessToken);
                    addToast("Session Refreshed", "success");
                }
            } catch (error) {
                console.error("Token refresh failed:", error);
            }
        }
        // Always reload the page to refresh data
        window.location.reload();
    };

    const handleNotificationClick = (_id: string) => {
        navigate(user?.role === 'ADMIN' ? '/admin-notifications' : '/notifications');
    };

    if (!user) return null;

    return (
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm z-20 relative">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
                {/* Logo and Name - Left Side (Visible primarily on mobile if sidebar is hidden, or if requested explicitly in navbar area) */}
                <div className="flex items-center gap-2 md:hidden">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white shadow-md shadow-sky-600/20">
                        <Command className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">ICS HRMS</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Refresh Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-sky-600 hover:bg-sky-50"
                    onClick={handleRefreshData}
                    title="Refresh Page"
                >
                    <RefreshCw className="h-5 w-5" />
                </Button>

                {/* Notification Bell */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-sky-600 hover:bg-sky-50">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 mr-4 shadow-xl border-slate-100" align="end">
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50">
                            <h4 className="font-semibold text-sm">Notifications</h4>
                            {unreadCount > 0 && <span className="text-xs text-sky-600 font-medium">{unreadCount} New</span>}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {unreadCount === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No new notifications
                                </div>
                            ) : (
                                <div className="divide-y relative">
                                    {notifications
                                        .filter((n: any) => !n.read)
                                        .map((notif: any) => (
                                            <div
                                                key={notif._id || notif.id}
                                                className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors bg-sky-50/30`}
                                                onClick={() => handleNotificationClick(notif._id || notif.id)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${notif.type === 'alert' ? 'bg-red-100 text-red-700' :
                                                        notif.type === 'success' ? 'bg-green-100 text-green-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {notif.source || 'System'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {notif.date && formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className={`text-sm mb-1 line-clamp-2 ${!notif.read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                        <div className="p-2 border-t bg-slate-50/50 flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={requestPermission}>
                                    Enable Push
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={async () => {
                                    // Local Toast Immediate
                                    addToast("Sending Test FCM...", "info");

                                    try {
                                        const token = localStorage.getItem('token');
                                        const res = await apiFetch('/api/notifications/test-fcm', {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if (res.ok) {
                                            const data = await res.json();
                                            addToast(data.message, "success");
                                        } else {
                                            const err = await res.json();
                                            addToast(`Error: ${err.message}`, "error");
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        addToast("Failed to trigger server test", "error");
                                    }
                                }}>
                                    Test Notification
                                </Button>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => navigate(user?.role === 'ADMIN' ? '/admin-notifications' : '/notifications')}>
                                View All Notifications
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="h-6 w-px bg-border mx-1 hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium leading-none text-slate-700 capitalize">{user.name}</p>
                        <p className="text-sm font-medium leading-none text-[#2563EB]">{user.projectStatus}</p>
                    </div>
                    <Avatar className="h-9 w-9 border cursor-pointer hover:ring-2 hover:ring-sky-100 transition-all">
                        <AvatarImage src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=2563EB&color=fff`} alt={user.name} />
                        <AvatarFallback className="bg-sky-100 text-sky-700">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} title="Logout" className="text-muted-foreground hover:text-red-600 hover:bg-red-50 ml-1">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}
