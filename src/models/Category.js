const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  Category1: String,
  icon: String,
  image: String,
  top: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema, 'categories');
