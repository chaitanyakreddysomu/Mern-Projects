import { useAuth } from "@/context/AuthContext";
import EmployeeDashboard from "@/pages/employee/Dashboard";
import HRDashboard from "@/pages/hr/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";

export default function Home() {
    const { user } = useAuth();

    if (!user) return null; // Should be handled by layout/router but safe check

    if (user.role === "ADMIN") {
        return <AdminDashboard />;
    } else if (user.role === "HR") {
        return <HRDashboard />;
    } else {
        return <EmployeeDashboard />;
    }
}
