# ICS HRMS

This is a Human Resource Management System (HRMS) built with the MERN stack (MongoDB, Express, React, Node.js).

## Live Demo

-   **Frontend**: [https://ics-hrms.netlify.app/](https://ics-hrms.netlify.app/)
-   **Backend**: [https://mern-projects-7tv5.onrender.com](https://mern-projects-7tv5.onrender.com)

## Technologies Used

-   **Frontend**: React, Vite, Tailwind CSS
-   **Backend**: Node.js, Express, MongoDB
-   **File Storage**: Supabase
-   **Notifications**: Firebase Cloud Messaging (FCM)

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/chaitanyakreddysomu/Mern-Projects.git
cd Mern-Projects
```

### Prerequisites

-   Node.js installed
-   MongoDB installed and running (or a MongoDB Atlas connection string)
-   Supabase account and credentials
-   Firebase project and credentials

### Backend

The backend handles the API, database connections, file storage via Supabase, and notifications via FCM.

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Ensure you have a `.env` file in the `backend` directory with the necessary configuration (MongoDB URI, Supabase keys, Firebase service account details, PORT, etc.).

4.  Run the server:
    -   For development (restarts on file changes):
        ```bash
        npm run dev
        ```
    -   For production:
        ```bash
        npm start
        ```

### Creating an Admin User

To create a new admin user via the command line, navigate to the `backend` directory and run:

```bash
cd backend
npm run add-admin -- <email> <password> "<name>"
```

Example:
```bash
npm run add-admin -- admin@ics.com admin123 "System Admin"
```

### Frontend

The frontend is a React application powered by Vite.

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Ensure you have a `.env` file in the `frontend` directory if required (e.g., API base URL).

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`).