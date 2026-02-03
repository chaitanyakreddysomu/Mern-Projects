const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "");

const generateLeave = async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: "Reason is required" });
        }

        // Using gemini-2.0-flash as it is supported by the key
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are a helpful HR assistant. A user wants to apply for a leave.
        Based on the user's input: "${reason}", generate a professional and formal leave application description suitable for a formal request.
        
        Also, try to extract the start date and end date from the text.
        - If a single date is mentioned (e.g., "on 1st Jan"), set both startDate and endDate to that date.
        - If a range is mentioned (e.g., "from 1st to 3rd"), set start and end accordingly.
        - If "tomorrow" or "today" is used, calculate the date based on the current date: ${new Date().toISOString()}.
        - Use YYYY-MM-DD format for dates.
        - If no date is found, set them to null.

        Output ONLY a valid JSON object with the following structure:
        {
            "reason": "The generated formal reason...",
            "startDate": "YYYY-MM-DD" or null,
            "endDate": "YYYY-MM-DD" or null
        }
        Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const data = JSON.parse(text);

        res.status(200).json(data);
    } catch (error) {
        console.error("Error generating leave content:", error);
        // Log deep details if available
        if (error.response) {
            console.error("Gemini Response Error:", JSON.stringify(error.response, null, 2));
        }
        res.status(500).json({
            message: "Failed to generate content",
            error: error.message,
            details: error.response ? "Check server logs for details" : undefined
        });
    }
};

const generateComplaint = async (req, res) => {
    try {
        const { complaint } = req.body;

        if (!complaint) {
            return res.status(400).json({ message: "Complaint text is required" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are a helpful HR assistant. An employee wants to file a complaint or grievance.
        Based on the user's input: "${complaint}", generate a professional, clear, and formal complaint description.
        
        Also, generate a concise subject line for the complaint.

        Output ONLY a valid JSON object with the following structure:
        {
            "subject": "A concise and professional subject line",
            "description": "The elaborate professional complaint description..."
        }
        Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const data = JSON.parse(text);

        res.status(200).json(data);
    } catch (error) {
        console.error("Error generating complaint content:", error);
        if (error.response) {
            console.error("Gemini Response Error:", JSON.stringify(error.response, null, 2));
        }
        res.status(500).json({
            message: "Failed to generate content",
            error: error.message
        });
    }
};

module.exports = {
    generateLeave,
    generateComplaint
};
