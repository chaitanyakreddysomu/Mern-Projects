const User = require('../models/User');
const Policy = require('../models/Policy');
const Holiday = require('../models/Holiday');

const supabase = require('../config/supabase');

exports.getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ startDate: 1 });
        res.json(holidays);
    } catch (error) {
        console.error("Get Holidays Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getPolicies = async (req, res) => {
    try {
        const policies = await Policy.find();
        res.json(policies);
    } catch (error) {
        console.error("Get Policies Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findOne({ id: req.user.id }).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        console.log("Received profile updates:", JSON.stringify(updates, null, 2));

        // Define allowed fields to update
        const allowedUpdates = [
            'name',
            'phone',
            'address',
            'dob',
            'bloodGroup',
            'emergencyContact',
            'bankDetails',
            'avatar'
        ];

        // Filter updates to only include allowed fields
        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        // If emergencyContact is partial, we might want to handle it carefully, but typically $set works fine 
        // if we are sending the whole object. If partial, we might need dot notation (emergencyContact.name).
        // For simplicity, we assume the frontend sends the complete object for nested fields or we rely on Mongoose.

        const user = await User.findOneAndUpdate(
            { id: req.user.id },
            { $set: filteredUpdates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ message: "Profile updated successfully", user });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Identify user
        const user = await User.findOne({ id: req.user.id });
        if (!user) return res.status(404).json({ message: "User not found" });

        const empId = user.id; // e.g., EMP001
        const fileName = `${empId}.jpg`; // User requested format

        // Check/Create bucket
        const { data: buckets, error: listBucketError } = await supabase.storage.listBuckets();

        if (listBucketError) {
            console.error("List Buckets Error:", listBucketError);
        }

        // Ensure 'profiles' bucket exists (assuming 'profile-images' was a typo or old name)
        if (!buckets || !buckets.find(b => b.name === 'profiles')) {
            await supabase.storage.createBucket('profiles', { public: true });
        }

        const { error } = await supabase.storage
            .from('profiles')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) throw error;

        // Save URL to user
        const publicUrl = supabase.storage.from('profiles').getPublicUrl(fileName).data.publicUrl;

        // Add timestamp to force refresh on frontend
        const versionedUrl = `${publicUrl}?t=${new Date().getTime()}`;

        user.profileImage = versionedUrl;
        await user.save();

        res.json({ message: "Profile image updated", imageUrl: versionedUrl });

    } catch (error) {
        console.error("Profile Image Upload Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const { docId, name, category } = req.body;
        const user = await User.findOne({ id: req.user.id });
        if (!user) return res.status(404).json({ message: "User not found" });

        const empId = user.id;
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${docId}-${empId}.${fileExt}`;
        const filePath = `${empId}/${fileName}`;

        // Upload to Supabase 'documents' bucket
        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Update User model
        const docIndex = user.documents.findIndex(d => d.docId === docId);
        const docEntry = {
            category,
            name,
            docId,
            path: filePath,
            status: 'Review',
            rejectionReason: undefined, // Clear rejection reason on re-upload
            uploadedAt: new Date()
        };

        // ... (start of uploadDocument function content)
        if (docIndex > -1) {
            user.documents[docIndex] = docEntry;
        } else {
            user.documents.push(docEntry);
        }

        await user.save();

        // Sync with separate Document collection (for Admin Panel consistency)
        // This ensures Admin can find/update the document using the Document model
        const Document = require('../models/Document');
        await Document.findOneAndUpdate(
            { empId: empId, name: name },
            {
                userId: user._id, // Critical for notifications
                empId: empId,
                name: name,
                category: category,
                fileUrl: filePath,
                status: 'Pending', // Enforce 'Pending' status on new upload
                rejectionReason: null,
                uploadedOn: new Date(),
                size: 'N/A'
            },
            { upsert: true, new: true }
        );

        res.json({ message: "Document uploaded successfully", document: docEntry });
    } catch (error) {
        // ...
        console.error("Upload Document Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getDocumentPreview = async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) return res.status(400).json({ message: "Path is required" });

        const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(path, 60); // 60 seconds validity

        if (error) throw error;

        res.json({ url: data.signedUrl });
    } catch (error) {
        console.error("Get Preview Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
