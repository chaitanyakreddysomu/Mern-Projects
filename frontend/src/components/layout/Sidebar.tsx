import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    User,
    FileText,
    Clock,
    Calendar,
    Coffee,
    Receipt,
    BookOpen,
    Bell,

    Users,
    AlertCircle,
    Command,
    ClipboardList,
    Wallet,
    CreditCard,
    Calculator,
} from "lucide-react";

export function Sidebar() {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const employeeLinks = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "blue" },
        { name: "Profile", href: "/profile", icon: User, color: "orange" },
        { name: "Documents", href: "/documents", icon: FileText, color: "yellow" },
        { name: "Attendance", href: "/attendance", icon: Clock, color: "lime" },
        { name: "Leaves", href: "/leaves", icon: Coffee, color: "violet" },
        { name: "Holidays", href: "/holidays", icon: Calendar, color: "sky" },
        { name: "Payslips", href: "/payslips", icon: Receipt, color: "green" },
        { name: "Company Policies", href: "/policies", icon: BookOpen, color: "fuchsia" },
        { name: "Notifications", href: "/notifications", icon: Bell, color: "amber" },
        { name: "Complaints", href: "/complaints", icon: AlertCircle, color: "red" },
    ];

    const adminLinks = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "blue" },
        { name: "Profile", href: "/admin-profile", icon: User, color: "orange" },
        { name: "Pending Requests", href: "/admin-requests", icon: ClipboardList, color: "pink" },
        { name: "Employees", href: "/admin-employees", icon: Users, color: "indigo" },
        { name: "Documents", href: "/admin-documents", icon: FileText, color: "yellow" },
        { name: "Attendance", href: "/admin-attendance", icon: Clock, color: "lime" },
        { name: "Leaves", href: "/admin-leaves", icon: Coffee, color: "green" },
        { name: "Holidays", href: "/admin-holidays", icon: Calendar, color: "sky" },
        { name: "Payslips", href: "/admin-payslips", icon: Wallet, color: "emerald" },
        { name: "Salary Structure", href: "/admin-salary-structure", icon: Calculator, color: "emerald" },
        { name: "Bank Details", href: "/admin-bank-details", icon: CreditCard, color: "purple" },
        { name: "Policies", href: "/admin-policies", icon: BookOpen, color: "fuchsia" },
        { name: "Notifications", href: "/admin-notifications", icon: Bell, color: "rose" },
        { name: "Complaints", href: "/admin-complaints", icon: AlertCircle, color: "amber" },
        { name: "Logs", href: "/admin-logs", icon: FileText, color: "gray" },
    ];

    const hrLinks = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "blue" },
        { name: "Profile", href: "/hr-profile", icon: User, color: "orange" },
        { name: "New Requests", href: "/hr-requests", icon: ClipboardList, color: "pink" },
        { name: "Employees", href: "/hr-employees", icon: Users, color: "indigo" },
        { name: "Documents", href: "/hr-documents", icon: FileText, color: "yellow" },
        { name: "Attendance", href: "/hr-attendance", icon: Clock, color: "lime" },
        { name: "Leaves", href: "/hr-leaves", icon: Coffee, color: "green" },
        { name: "Holidays", href: "/hr-holidays", icon: Calendar, color: "sky" },
        { name: "Payslips", href: "/hr-payslips", icon: Wallet, color: "emerald" },
        { name: "Policies", href: "/hr-policies", icon: BookOpen, color: "fuchsia" },
        { name: "Notifications", href: "/hr-notifications", icon: Bell, color: "rose" },
        { name: "Complaints", href: "/hr-complaints", icon: AlertCircle, color: "amber" },
    ]

    const links = user.role === "EMPLOYEE"
        ? employeeLinks
        : user.role === "ADMIN"
            ? adminLinks
            : hrLinks;

    const getColorClasses = (color: string, isActive: boolean) => {
        // Base classes for active state (solid bg, white text) and hover state (light bg, colored text)
        const colors: Record<string, string> = {
            red: isActive
                ? "bg-red-500 text-white shadow-md shadow-red-200"
                : "text-gray-700 hover:bg-red-50 hover:text-red-700",
            orange: isActive
                ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                : "text-gray-700 hover:bg-orange-50 hover:text-orange-700",
            yellow: isActive
                ? "bg-yellow-500 text-white shadow-md shadow-yellow-200"
                : "text-gray-700 hover:bg-yellow-50 hover:text-yellow-700",
            lime: isActive
                ? "bg-lime-500 text-white shadow-md shadow-lime-200"
                : "text-gray-700 hover:bg-lime-50 hover:text-lime-700",
            green: isActive
                ? "bg-green-600 text-white shadow-md shadow-green-200"
                : "text-gray-700 hover:bg-green-50 hover:text-green-700",
            sky: isActive
                ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                : "text-gray-700 hover:bg-sky-50 hover:text-sky-700",
            violet: isActive
                ? "bg-violet-500 text-white shadow-md shadow-violet-200"
                : "text-gray-700 hover:bg-violet-50 hover:text-violet-700",
            fuchsia: isActive
                ? "bg-fuchsia-500 text-white shadow-md shadow-fuchsia-200"
                : "text-gray-700 hover:bg-fuchsia-50 hover:text-fuchsia-700",
            blue: isActive
                ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700",
            amber: isActive
                ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                : "text-gray-700 hover:bg-amber-50 hover:text-amber-700",
            indigo: isActive
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700",
            pink: isActive
                ? "bg-pink-500 text-white shadow-md shadow-pink-200"
                : "text-gray-700 hover:bg-pink-50 hover:text-pink-700",
            emerald: isActive
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700",
            purple: isActive
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "text-gray-700 hover:bg-purple-50 hover:text-purple-700",
            rose: isActive
                ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                : "text-gray-700 hover:bg-rose-50 hover:text-rose-700",
        };
        return colors[color] || colors.red;
    };

    return (
        <div className="hidden h-screen w-72 flex-col border-r bg-white/60 backdrop-blur-xl md:flex">
            <div className="flex h-20 items-center px-6 border-b gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
                    <Command className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">HRMS</h1>
                    <p className="text-xs text-muted-foreground font-medium">Employee Portal</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                <ul className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.href;

                        return (
                            <li key={link.name}>
                                <Link
                                    to={link.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                        getColorClasses(link.color, isActive)
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-current")} />
                                    <span className="text-base">{link.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
