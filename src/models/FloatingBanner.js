// models/Banner.js
const mongoose = require('mongoose');

const FloatingbannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  isActive : {type : Boolean, default : true}
}, { timestamps: true });

module.exports = mongoose.model('FlotaingBanner', FloatingbannerSchema);
