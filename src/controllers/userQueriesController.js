const UserQueries = require("../models/UserQueries");

// POST API to submit a user query
exports.submitQuery = async (req, res) => {
    try {
        const {
            email,
            phone,
            firstName,
            lastName,
            postcode,
            company,
            userId,
            message,
            consent,
            subscribe
        } = req.body;

        const file = req.file;


        let documentPath = null;

        if (file) {
            documentPath = `/uploads/${req.file.filename}`;
        }

        const newQuery = new UserQueries({
            email,
            phone,
            firstName,
            lastName,
            postcode,
            company,
            userId,
            message,
            document: documentPath,
            consent,
            subscribe
        });

        await newQuery.save();
        res.status(201).json({ message: "Query submitted successfully", data: newQuery });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong while submitting the query" });
    }
};


exports.allQueries = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;

        const query = {
            $or: [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
            ],
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [queries, total] = await Promise.all([
            UserQueries.find(query)
                .sort({ createdAt: -1 }) // newest first
                .skip(skip)
                .limit(parseInt(limit)),
            UserQueries.countDocuments(query),
        ]);

        res.status(200).json({
            data: queries,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        console.error("Error fetching queries:", error);
        res.status(500).json({ error: "Something went wrong while getting the queries" });
    }
};


exports.deleteQuery = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await UserQueries.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ error: "Query not found" });
        }

        res.status(200).json({ message: "Query deleted successfully" });
    } catch (error) {
        console.error("Error deleting query:", error);
        res.status(500).json({ error: "Failed to delete query" });
    }
};
