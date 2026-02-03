Date: 2026-02-03
Feature: AI-Powered Leave Application Generation

## Backend Changes
- **Dependencies**: Added `@google/generative-ai`.
- **Environment**: Added `GEMINI_API_KEY` to `.env`.
- **Controller**: Created `src/controllers/aiController.js` with `generateLeave` logic.
    - Uses Gemini Pro model.
    - Extracts `startDate` and `endDate` from natural language.
    - Generates a formal professional reason.
- **Routes**: Created `src/routes/aiRoutes.js` exposing `POST /api/ai/generate-leave`.
- **Entry Point**: Registered `/api/ai` routes in `src/index.js`.

## Frontend Changes
- **Page**: `src/pages/employee/Leaves.tsx`
- **UI**: Added "AI Leave Assistant" section to the "Apply Leave" dialog.
- **Components**:
    - Input field for natural language description (e.g., "Sick leave tomorrow").
    - "Auto-Fill" button with loading state.
- **Logic**:
    - Calls `/api/ai/generate-leave` with use input.
    - Auto-fills the main form's `Reason`, `Start Date`, and `End Date` fields with the AI response.
    - Allows user to edit the generated content before submission.
