const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  Brand: String,
  image : String
});

module.exports = mongoose.model('Brand', brandSchema, 'brands');
