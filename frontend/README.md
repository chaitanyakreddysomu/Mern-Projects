# ICS HRMS Frontend

A comprehensive Human Resource Management System frontend built with:
- React 19 + TypeScript
- Vite
- Tailwind CSS (v3)
- Shadcn/UI (Custom Implementation)
- Recharts
- Lucide Icons

## Features

### Roles
- **Employee**: Attendance, Leaves, Documents, Profile, Payslips, Holidays, Notifications.
- **HR**: Dashboard, Employee List, Leave Approvals.
- **Admin**: Full System Management, Projects, Policies, Holidays.

### Key Modules
- **Attendance Tracker**: Geo-tagged punch-in/out with timer.
- **Leave Management**: Apply, approve, and track history.
- **Document Management**: Upload and verify documents.
- **Payroll**: View and download payslips.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```
   *Note: This project uses Tailwind CSS v3. Ensure strict peer dependency if managing manually.*

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Folder Structure

- `src/components/ui`: Reusable UI components (Buttons, Cards, Inputs, etc.)
- `src/components/layout`: Sidebar, Topbar, MainLayout.
- `src/pages`: Role-based pages (admin, employee, hr).
- `src/context`: AuthContext for global state.
- `src/data`: Mock data for development.
- `src/types`: TypeScript interfaces.

## Mock Authentication
- **Employee**: Default Login Button
- **HR**: Default Login Button
- **Admin**: Default Login Button
*(No password required for mock demo)*
