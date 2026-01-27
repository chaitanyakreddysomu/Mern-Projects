import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
// import EmployeeDashboard from "./pages/employee/Dashboard";
import Profile from "./pages/employee/Profile";
import Documents from "./pages/employee/Documents";
import Attendance from "./pages/employee/Attendance";
import Leaves from "./pages/employee/Leaves";
import Holidays from "./pages/employee/Holidays";
import Payslips from "./pages/employee/Payslips";
import Policies from "./pages/employee/Policies";

import Notifications from "./pages/employee/Notifications";
import Complaints from "./pages/employee/Complaints";

import Home from "./pages/Home";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import HREmployeeManagement from "./pages/hr/EmployeeManagement";
import HREmployeeRequests from "./pages/hr/EmployeeRequests";
import HRProfile from "./pages/hr/Profile";
import HRDocuments from "./pages/hr/Documents";
import HRAttendance from "./pages/hr/Attendance";
import HRLeaves from "./pages/hr/Leaves";

import HRComplaints from "./pages/hr/Complaints";
import HRNotifications from "./pages/hr/Notifications";
import HRPayslips from "./pages/hr/Payslips";
import HRHolidays from "./pages/hr/Holidays";
import HRPolicies from "./pages/hr/Policies";
import AdminPayslips from "./pages/admin/Payslips";
import AdminComplaints from "./pages/admin/Complaints";
import AdminProfile from "./pages/admin/Profile";
import AdminRequests from "./pages/admin/Requests";
import AdminEmployeeManagement from "./pages/admin/EmployeeManagement";
import AdminDocuments from "./pages/admin/Documents";
import AdminAttendance from "./pages/admin/Attendance";
import AdminLeaves from "./pages/admin/Leaves";
import AdminHolidays from "./pages/admin/Holidays";
import Projects from "./pages/admin/Projects";

import AdminPolicies from "./pages/admin/Policies";
import AdminNotifications from "./pages/admin/Notifications";
import AdminBankDetails from "./pages/admin/BankDetails";
import AdminLogs from "./pages/admin/Logs";
import SalaryStructurePage from "./pages/admin/SalaryStructure";
import Test from "./pages/Test";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/test" element={<Test />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/holidays" element={<Holidays />} />
        <Route path="/payslips" element={<Payslips />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/complaints" element={<Complaints />} />

        {/* Admin / HR Routes */}
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/hr-employees" element={<HREmployeeManagement />} />
        <Route path="/hr-requests" element={<HREmployeeRequests />} />
        <Route path="/hr-profile" element={<HRProfile />} />
        <Route path="/admin-profile" element={<AdminProfile />} />
        <Route path="/admin-requests" element={<AdminRequests />} />
        <Route path="/admin-employees" element={<AdminEmployeeManagement />} />
        <Route path="/admin-documents" element={<AdminDocuments />} />
        <Route path="/admin-attendance" element={<AdminAttendance />} />
        <Route path="/admin-leaves" element={<AdminLeaves />} />
        <Route path="/admin-holidays" element={<AdminHolidays />} />
        {/* Assuming AdminPayslips, HRPayroll, and EmployeeRequests are defined elsewhere or need to be imported */}
        <Route path="/admin-payslips" element={<AdminPayslips />} />
        <Route path="/admin-complaints" element={<AdminComplaints />} />
        <Route path="/hr-employee-management" element={<EmployeeManagement />} />
        <Route path="/hr-attendance" element={<HRAttendance />} />
        <Route path="/hr-leaves" element={<HRLeaves />} />
        {/* <Route path="/hr-payroll" element={<HRPayroll />} /> */}
        <Route path="/hr-documents" element={<HRDocuments />} />
        {/* <Route path="/hr-requests" element={<EmployeeRequests />} /> */}
        <Route path="/hr-complaints" element={<HRComplaints />} />
        <Route path="/hr-notifications" element={<HRNotifications />} />
        <Route path="/hr-payslips" element={<HRPayslips />} />
        <Route path="/hr-holidays" element={<HRHolidays />} />
        <Route path="/hr-policies" element={<HRPolicies />} />
        <Route path="/attendance-admin" element={<AdminAttendance />} />
        <Route path="/leaves-admin" element={<AdminLeaves />} />
        <Route path="/complaints-admin" element={<AdminComplaints />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/holidays-admin" element={<AdminHolidays />} />
        <Route path="/admin-policies" element={<AdminPolicies />} />
        <Route path="/admin-notifications" element={<AdminNotifications />} />
        <Route path="/admin-bank-details" element={<AdminBankDetails />} />
        <Route path="/admin-logs" element={<AdminLogs />} />
        <Route path="/admin-salary-structure" element={<SalaryStructurePage />} />

        {/* Fallback routes for other modules to be implemented */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    }
  }
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
