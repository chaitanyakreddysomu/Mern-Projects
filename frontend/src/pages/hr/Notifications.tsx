import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BellRing, CheckCircle2, AlertTriangle, Info, PlusCircle, Send, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function HRNotifications() {
    // --- STATE: Employee Notifications (Sending) ---
    const [sentNotifications, setSentNotifications] = useState<any[]>([]);
    const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [newTarget, setNewTarget] = useState("ALL"); // ALL, SELECT_EMPLOYEES
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeesList, setEmployeesList] = useState<{ id: string, name: string }[]>([]);
    const [sentLoading, setSentLoading] = useState(false);

    // --- STATE: My Notifications (My Inbox) ---
    const [myNotifications, setMyNotifications] = useState<any[]>([]);
    const [selectedMyNotification, setSelectedMyNotification] = useState<any | null>(null);
    const [myLoading, setMyLoading] = useState(false);
    const [myFilter, setMyFilter] = useState<'all' | 'unread'>('all');

    // --- FETCH DATA ---

    const fetchSentNotifications = async () => {
        setSentLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/hr/notifications/sent', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSentNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch sent notifications", error);
        } finally {
            setSentLoading(false);
        }
    };

    const fetchMyNotifications = async () => {
        setMyLoading(true);
        try {
            const token = localStorage.getItem('token');
            const query = myFilter === 'unread' ? '?unread=true' : '';
            const res = await apiFetch(`/api/hr/notifications/my${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch my notifications", error);
        } finally {
            setMyLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/hr/employees/select', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployeesList(data);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    useEffect(() => {
        fetchSentNotifications();
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchMyNotifications();
    }, [myFilter]);

    // --- HANDLERS: SENDING ---
    const handleEmployeeToggle = (id: string) => {
        if (selectedEmployeeIds.includes(id)) {
            setSelectedEmployeeIds(selectedEmployeeIds.filter(empId => empId !== id));
        } else {
            setSelectedEmployeeIds([...selectedEmployeeIds, id]);
        }
    };

    const filteredEmployees = employeesList.filter(emp =>
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    const handleSendNotification = async () => {
        if (!newTitle || !newMessage) return;
        if (newTarget === "SELECT_EMPLOYEES" && selectedEmployeeIds.length === 0) return;

        try {
            const token = localStorage.getItem('token');
            const payload = {
                title: newTitle,
                message: newMessage,
                targetAudience: newTarget,
                selectedEmployeeIds: newTarget === "SELECT_EMPLOYEES" ? selectedEmployeeIds : [],
                type: 'info'
            };

            const res = await apiFetch('/api/hr/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsSendDialogOpen(false);
                setNewTitle("");
                setNewMessage("");
                setNewTarget("ALL");
                setSelectedEmployeeIds([]);
                fetchSentNotifications(); // Refresh list
            } else {
                alert("Failed to send notification");
            }
        } catch (error) {
            console.error("Failed to send notification", error);
        }
    };

    // --- HANDLERS: MY NOTIFICATIONS ---
    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch(`/api/hr/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // If filter is unread, remove it from list. If all, mark as read.
                if (myFilter === 'unread') {
                    setMyNotifications((prev: any[]) => prev.filter((n: any) => n._id !== id));
                } else {
                    setMyNotifications((prev: any[]) => prev.map((n: any) => n._id === id ? { ...n, read: true } : n));
                }

                if (selectedMyNotification?._id === id) {
                    setSelectedMyNotification((prev: any) => prev ? { ...prev, read: true } : null);
                }
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    // Direct usage since server handles filtering
    const filteredMyNotifications = myNotifications;

    const [pushEnabled, setPushEnabled] = useState(false);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
            setPushEnabled(true);
        }
    }, []);

    const enableNotifications = async () => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            alert("Notifications supported only in Chrome / Edge");
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setPushEnabled(true);
        } else {
            alert("Permission denied");
            return;
        }


        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
        });

        const token = localStorage.getItem('token');
        await apiFetch("/api/notifications/subscribe", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(sub)
        });
        alert('Subscription successful!');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-600/30">
                            <BellRing className="h-6 w-6 text-white" />
                        </div>
                        Notifications Center
                    </h1>
                    <p className="text-muted-foreground mt-1 ml-14">Manage updates for employees and check your inbox.</p>
                </div>
                <Button
                    variant={pushEnabled ? "outline" : "default"}
                    className={pushEnabled ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-700 cursor-default" : "bg-amber-600 text-white hover:bg-amber-700"}
                    onClick={!pushEnabled ? enableNotifications : undefined}
                >
                    {pushEnabled ? (
                        <>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Live Alerts Enabled
                        </>
                    ) : (
                        "Enable Live Alerts"
                    )}
                </Button>
            </div>

            <Tabs defaultValue="employee-notifications" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-slate-100">
                    <TabsTrigger value="employee-notifications">Sent Notifications</TabsTrigger>
                    <TabsTrigger value="my-notifications">My Notifications</TabsTrigger>
                </TabsList>

                {/* --- EMPLOYEE NOTIFICATIONS TAB (SEND) --- */}
                <TabsContent value="employee-notifications" className="space-y-6 mt-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">Sent Updates</h2>
                            <p className="text-muted-foreground text-sm">History of notifications sent to employees.</p>
                        </div>
                        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-amber-600 text-white shadow-lg shadow-amber-600/30 hover:bg-amber-700 active:scale-95">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Send Notification
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Send Notification</DialogTitle>
                                    <DialogDescription>Create and send a new notification to employees.</DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            placeholder="Notification Title"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="target">Target Audience</Label>
                                        <select
                                            id="target"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={newTarget}
                                            onChange={(e) => setNewTarget(e.target.value)}
                                        >
                                            <option value="ALL">All Employees</option>
                                            <option value="SELECT_EMPLOYEES">Select Employees</option>
                                        </select>
                                    </div>

                                    {newTarget === "SELECT_EMPLOYEES" && (
                                        <div className="border rounded-md p-3 space-y-3 bg-slate-50">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search employees..."
                                                    className="pl-9 h-9"
                                                    value={employeeSearch}
                                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                                                {filteredEmployees.map((emp) => (
                                                    <div
                                                        key={emp.id}
                                                        className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 cursor-pointer"
                                                        onClick={() => handleEmployeeToggle(emp.id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                            checked={selectedEmployeeIds.includes(emp.id)}
                                                            readOnly
                                                        />
                                                        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            {emp.name}
                                                        </span>
                                                    </div>
                                                ))}
                                                {filteredEmployees.length === 0 && (
                                                    <p className="text-xs text-center text-muted-foreground py-2">No employees found.</p>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground border-t pt-2 flex justify-between">
                                                <span>{selectedEmployeeIds.length} employees selected</span>
                                                {selectedEmployeeIds.length > 0 && (
                                                    <button
                                                        className="text-amber-600 hover:text-amber-700 font-medium"
                                                        onClick={() => setSelectedEmployeeIds([])}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Type your message here..."
                                            className="min-h-[100px]"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsSendDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSendNotification} className="bg-amber-600 hover:bg-amber-700 text-white">
                                        <Send className="mr-2 h-4 w-4" /> Send
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {sentLoading ? (
                            <p>Loading...</p>
                        ) : sentNotifications.length === 0 ? (
                            <Card className="text-center py-16 border-dashed border-2 bg-muted/10">
                                <CardContent>
                                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send className="h-8 w-8 text-muted-foreground opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">No sent notifications</h3>
                                    <p className="text-muted-foreground mt-1 max-w-sm mx-auto">You haven't sent any updates yet.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            sentNotifications.map((notif) => (
                                <Card key={notif._id} className="bg-slate-50 border border-slate-200">
                                    <CardContent className="p-4 flex gap-4 items-start">
                                        <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                                            <Info className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <h4 className="font-semibold">{notif.title}</h4>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/80 mt-1">{notif.message}</p>
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                Sent to: <span className="font-medium text-slate-700">{notif.to}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* --- MY NOTIFICATIONS TAB (RECEIVE) --- */}
                <TabsContent value="my-notifications" className="space-y-6 mt-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">My Inbox</h2>
                            <p className="text-muted-foreground text-sm">Notifications received from System or Admin.</p>
                        </div>
                        <div className="relative flex items-center bg-slate-100 p-1 rounded-lg w-[180px] h-9">
                            <div
                                className={cn(
                                    "absolute inset-y-1 w-[calc(50%-4px)] bg-amber-500 rounded-md shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                                    myFilter === 'all' ? "left-1" : "left-[calc(50%)]"
                                )}
                            />
                            <button
                                onClick={() => setMyFilter('all')}
                                className={cn(
                                    "flex-1 relative z-10 text-sm font-medium transition-colors duration-200 text-center",
                                    myFilter === 'all' ? "text-white" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setMyFilter('unread')}
                                className={cn(
                                    "flex-1 relative z-10 text-sm font-medium transition-colors duration-200 text-center",
                                    myFilter === 'unread' ? "text-white" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Unread
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {myLoading ? (
                            <p>Loading...</p>
                        ) : filteredMyNotifications.length === 0 ? (
                            <Card className="text-center py-16 border-dashed border-2 bg-muted/10">
                                <CardContent>
                                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <BellRing className="h-8 w-8 text-muted-foreground opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">No notifications</h3>
                                    <p className="text-muted-foreground mt-1 max-w-sm mx-auto">You're all caught up!</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredMyNotifications.map((notif) => (
                                <Card
                                    key={notif._id}
                                    className={cn(
                                        "group relative overflow-hidden border-l-4 cursor-pointer transition-all duration-300",
                                        !notif.read
                                            ? "bg-amber-50/50 border-l-amber-500 shadow-sm hover:shadow-md"
                                            : "bg-gray-50/50 border-l-gray-400 hover:shadow-sm"
                                    )}
                                    onClick={() => setSelectedMyNotification(notif)}
                                >
                                    <CardContent className="p-5 flex gap-4 items-start">
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

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <h4 className={cn("text-base font-semibold truncate", !notif.read ? "text-foreground" : "text-gray-700")}>
                                                        {notif.title}
                                                    </h4>
                                                    {!notif.read && (
                                                        <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] px-2 py-0.5 uppercase tracking-wide">
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                                    <span className={cn(!notif.read ? "text-amber-600 font-medium" : "text-gray-500")}>
                                                        {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                                                    </span>
                                                    {notif.source && (
                                                        <>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="text-muted-foreground">From {notif.source}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <p className={cn("mt-1 text-sm leading-snug line-clamp-1", !notif.read ? "text-foreground/90" : "text-muted-foreground")}>
                                                {notif.message}
                                            </p>
                                        </div>

                                        {!notif.read && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    type="button"
                                                    title="Mark as Read"
                                                    onClick={(e) => handleMarkAsRead(notif._id, e)}
                                                    className="h-10 w-10 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-600/30 active:scale-95 text-white"
                                                >
                                                    <Check className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={!!selectedMyNotification} onOpenChange={(open) => !open && setSelectedMyNotification(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                !selectedMyNotification?.read ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
                            )}>
                                <Info className="h-5 w-5" />
                            </div>
                            {selectedMyNotification?.title}
                        </DialogTitle>
                        <DialogDescription className="pt-4">
                            <div className={cn(
                                "text-sm leading-relaxed p-4 rounded-lg border",
                                !selectedMyNotification?.read
                                    ? "bg-amber-50 border-amber-100 text-foreground"
                                    : "bg-gray-50 border-gray-200 text-muted-foreground"
                            )}>
                                {selectedMyNotification?.message}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        {!selectedMyNotification?.read && (
                            <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => selectedMyNotification && handleMarkAsRead(selectedMyNotification._id)}>
                                Mark as Read
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
