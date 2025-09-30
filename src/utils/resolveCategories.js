const Category = require('../models/Category');
const Subcategory = require('../models/SubCategory');
const SubChildCategory = require('../models/SubSubCategory');

/**
 * Resolves category names to ObjectIds from the DB.
 * @param {Object} names - Object with category1, category2, category3 as strings.
 * @returns {Object} - Object with corresponding ObjectIds.
 */
async function resolveCategoryIds({ category1, category2, category3 }) {
    const [cat1, cat2, cat3] = await Promise.all([
        Category.findOne({ Category1: category1 }),
        Subcategory.findOne({ Category2: category2 }),
        SubChildCategory.findOne({ Category3: category3 }),
    ]);

    return {
        Category1: cat1?._id || null,
        Category2: cat2?._id || null,
        Category3: cat3?._id || null,
    };
}

module.exports = resolveCategoryIds;
