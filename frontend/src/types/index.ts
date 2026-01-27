export type Role = "ADMIN" | "HR" | "EMPLOYEE";

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: Role;
    avatar?: string;
    profileImage?: string;
    designation?: string;
    department?: string;
    status: "Active" | "Inactive" | "Pending" | "Rejected";
    joiningDate: string;
    // Profile Ext
    phone?: string;
    address?: string;
    dob?: string;
    bloodGroup?: string;
    emergencyContact?: { name: string; phone: string };
    uan?: string;
    bankDetails?: {
        holderName: string;
        accountNumber: string;
        ifsc: string;
        bankName: string;
        branch: string;
    };
    projectStatus?: "In Project" | "Bench" | "Training";
    package?: number; // Annual Package
}

export interface AttendanceRecord {
    id: string;
    date: string;
    punchIn: string;
    punchOut: string | null;
    totalHours: number;
    locationIn: { lat: number, lng: number };
    locationOut?: { lat: number, lng: number };
    status: "Present" | "Absent" | "Half Day" | "On Leave" | "Holiday" | "Late";
    // Admin/HR View Extras
    name?: string;
    profileImage?: string;
    avatar?: string;
}

export interface LeaveRequest {
    id: string;
    userId: string;
    userName: string;
    profileImage?: string;
    avatar?: string;
    type: "Sick" | "Casual" | "Earned" | "Annual" | "Comp Off";
    startDate: string;
    endDate: string;
    reason: string;
    status: "Pending" | "Approved" | "Rejected";
    appliedOn: string;
    rejectionReason?: string;
}

export interface Document {
    id: string;
    userId: string;
    category: "Government" | "Personal" | "Educational" | "Experience";
    name: string;
    url: string;
    verified: boolean;
    type: "pdf" | "image" | "doc";
    size: string;
}

export interface Notification {
    _id: string;
    id: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
    type?: "info" | "success" | "warning" | "alert";
    to: "ALL" | "HR" | "ADMIN" | string[]; // IDs
    source?: "ADMIN" | "HR" | "SYSTEM";
}

export interface Complaint {
    id: string;
    userId: string; // Creator
    userName: string;
    subject: string;
    description: string;
    status: "Open" | "Resolved" | "Investigating";
    date: string;
}

export interface Holiday {
    _id: string; // Mongoose ID
    id?: string; // Virtual or alias
    name: string;
    startDate: string; // Date string from API
    endDate: string; // Date string from API
    type: "Holiday" | "National" | "Festival" | "Event";
}
