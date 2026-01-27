import type { User, AttendanceRecord, LeaveRequest, Notification, Complaint } from "@/types";

export const USERS: User[] = [
    {
        id: "EMP001",
        name: "John Doe",
        email: "john.doe@company.com",
        role: "EMPLOYEE",
        designation: "Senior Frontend Developer",
        department: "Engineering",
        status: "Active",
        joiningDate: "2023-01-15",
        phone: "+91 9876543210",
        address: "123, Tech Park, Bangalore, India",
        dob: "1995-08-20",
        bloodGroup: "O+",
        emergencyContact: { name: "Jane Doe", phone: "+91 9876543211" },
        uan: "100987654321",
        bankDetails: {
            holderName: "John Doe",
            accountNumber: "1234567890",
            ifsc: "HDFC0001234",
            bankName: "HDFC Bank",
            branch: "Indiranagar",
        },
        projectStatus: "In Project",
    },
    {
        id: "HR001",
        name: "Alice Smith",
        email: "alice@company.com",
        role: "HR",
        designation: "HR Manager",
        department: "Human Resources",
        status: "Active",
        joiningDate: "2022-05-10",
    },
    {
        id: "ADM001",
        name: "Admin User",
        email: "admin@company.com",
        role: "ADMIN",
        designation: "System Administrator",
        department: "IT",
        status: "Active",
        joiningDate: "2020-01-01",
    }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
    {
        id: "1",
        date: "2026-1-1",
        punchIn: "09:05",
        punchOut: "18:10",
        totalHours: 9.08,
        locationIn: { lat: 12.9716, lng: 77.5946 },
        locationOut: { lat: 12.9716, lng: 77.5946 },
        status: "Present"
    },
    {
        id: "2",
        date: "2026-1-2",
        punchIn: "09:00",
        punchOut: "18:00",
        totalHours: 9,
        locationIn: { lat: 12.9716, lng: 77.5946 },
        locationOut: { lat: 12.9716, lng: 77.5946 },
        status: "Absent"
    },
    {
        id: "3",
        date: "2026-1-3",
        punchIn: "09:15",
        punchOut: "17:45",
        totalHours: 8.5,
        locationIn: { lat: 12.9716, lng: 77.5946 },
        locationOut: { lat: 12.9716, lng: 77.5946 },
        status: "Late"
    },
];

export const MOCK_LEAVES: LeaveRequest[] = [
    {
        id: "L1",
        userId: "EMP001",
        userName: "John Doe",
        type: "Sick",
        startDate: "2023-10-10",
        endDate: "2023-10-11",
        reason: "Viral Fever",
        status: "Approved",
        appliedOn: "2023-10-09"
    },
    {
        id: "L2",
        userId: "EMP001",
        userName: "John Doe",
        type: "Casual",
        startDate: "2023-11-05",
        endDate: "2023-11-05",
        reason: "Personal Work",
        status: "Pending",
        appliedOn: "2023-10-28"
    },
    {
        id: "3",
        userId: "EMP001",
        userName: "John Doe",
        type: "Sick",
        startDate: "2026-01-03",
        endDate: "2026-01-04",
        reason: "Medical leave without certificate",
        appliedOn: "02 Jan 2026",
        status: "Rejected",
        rejectionReason: "Medical certificate not provided for 2+ days leave."
    },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        _id: "N1",
        id: "N1",
        title: "Holiday Reminder",
        message: "Diwali holiday is on 12th Nov.",
        date: "2026-01-05",
        read: false,
        to: "ALL",
        source: "HR"
    },
    {
        _id: "N2",
        id: "N2",
        title: "Policy Update",
        message: "WFH policy has been updated. Please check the documents.",
        date: "2026-01-06",
        read: false,
        to: "ALL",
        source: "ADMIN"
    },
    {
        _id: "N3",
        id: "N3",
        title: "Team Lunch",
        message: "Team lunch at 1 PM in the cafeteria.",
        date: "2026-01-07",
        read: false,
        to: "ALL",
        source: "HR"
    },
    {
        _id: "N4",
        id: "N4",
        title: "System Maintenance",
        message: "Scheduled maintenance on Sat, 10 PM.",
        date: "2026-01-08",
        read: false,
        to: "ALL",
        source: "SYSTEM"
    },
    {
        _id: "N5",
        id: "N5",
        title: "New Project Assignment",
        message: "You have been assigned to Project Phoenix.",
        date: "2026-01-09",
        read: false,
        to: ["EMP001"],
        source: "ADMIN"
    },
    {
        _id: "N6",
        id: "N6",
        title: "Appraisal Started",
        message: "Year-end appraisal process has started.",
        date: "2026-01-10",
        read: false,
        to: "ALL",
        source: "HR"
    }
];

export const MOCK_COMPLAINTS: Complaint[] = [
    {
        id: "C1",
        userId: "EMP001",
        userName: "John Doe",
        subject: "AC not working",
        description: "The AC in the 3rd floor west wing is not cooling properly.",
        status: "Open",
        date: "2023-10-28"
    },
    {
        id: "C2",
        userId: "EMP001",
        userName: "John Doe",
        subject: "Previous Salary Discrepancy",
        description: "The issue regarding the deduction in last month's salary has been clarified and resolved.",
        status: "Resolved",
        date: "2023-09-15"
    }
]
