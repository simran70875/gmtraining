const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        type: { type: String, required: true, enum: ["admin", "user", "guest", "agent"] },
        userId: { type: String, required: true, unique: true },
        password: { type: String },
        email: { type: String },
        phone: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        address: { type: String },
        city: { type: String },
        company: { type: String },
        postcode: { type: String },
        signature: { type: String },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
