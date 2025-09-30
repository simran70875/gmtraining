const mongoose = require('mongoose');

const subSubCategorySchema = new mongoose.Schema({
  Category3: String,
  Category1: { type: mongoose.Schema.Types.ObjectId, ref: 'categories' },
  Category2: { type: mongoose.Schema.Types.ObjectId, ref: 'subcategories' },
}, {
  timestamps: true
});

module.exports = mongoose.model('SubChildCategory', subSubCategorySchema, 'subChildCategories');
