const mongoose = require("mongoose");

const queriesSchema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        phone: { type: String },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        address: { type: String, },
        city: { type: String, },
        address: { type: String, },
        postcode: { type: String, },
        company: { type: String, required: true },
        message: { type: String },
        document: { type: String },
        consent: { type: String },
        subscribe: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Query", queriesSchema);
