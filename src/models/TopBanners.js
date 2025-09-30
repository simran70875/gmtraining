const mongoose = require("mongoose");

const topBanners = new mongoose.Schema({
    banner: String,
    title: String,
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Banner', topBanners);