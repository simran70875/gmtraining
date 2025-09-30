const Category = require('../models/Category');
const Subcategory = require('../models/SubCategory');
const SubSubCategory = require('../models/SubSubCategory');
const Brands = require('../models/Brand');

const path = require('path');
const fs = require('fs');


exports.getNestedCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 }); // Sort top-level categories

    const results = await Promise.all(
      categories.map(async (cat) => {
        const subCats = await Subcategory.find({ Category1: cat._id }).sort({ createdAt: 1 }); // Sort subcategories

        const categories2 = await Promise.all(
          subCats.map(async (subCat) => {
            const subSubCats = await SubSubCategory.find({ Category2: subCat._id }).sort({ createdAt: 1 }); // Sort sub-subcategories

            const categories3 = subSubCats.map(s => ({
              _id: s._id,
              Category3: s.Category3
            }));

            return {
              _id: subCat._id,
              label: subCat.Category2,
              Categories3: categories3
            };
          })
        );

        const allCategories3 = categories2.flatMap((c) => c.Categories3);

        return {
          _id: cat._id,
          Category1: cat.Category1,
          top: cat.top,
          icon: cat.icon,
          image: cat.image,
          Categories2: categories2,
          allCategories3
        };
      })
    );

    res.status(200).json({
      data: results,
    });

  } catch (error) {
    next(error);
  }
};


exports.getTopCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ top: true });

    const results = await Promise.all(
      categories.map(async (cat) => {
        const subCats = await Subcategory.find({ Category1: cat._id });

        const categories2 = await Promise.all(
          subCats.map(async (subCat) => {
            const subSubCats = await SubSubCategory.find({ Category2: subCat._id });
            const categories3 = subSubCats.map(s => ({
              _id: s._id,
              Category3: s.Category3
            }));

            return {
              _id: subCat._id,
              label: subCat.Category2,
              Categories3: categories3
            };
          })
        );

        const allCategories3 = categories2.flatMap((c) => c.Categories3);

        return {
          _id: cat._id,
          Category1: cat.Category1,
          icon: cat.icon,
          image: cat.image,
          Categories2: categories2,
          allCategories3
        };
      })
    );


    res.status(200).json({
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Brands.find();
    res.status(200).json({
      data: brands,
    });
  } catch (error) {
    next(error);
  }
}

// Add a new brand
exports.addBrand = async (req, res, next) => {
  try {
    const { Brand } = req.body;

    if (!Brand || typeof Brand !== 'string' || !Brand.trim()) {
      return res.status(400).json({ message: 'Brand name is required and must be a non-empty string.' });
    }

    const newBrand = new Brands({ Brand: Brand.trim() });
    await newBrand.save();

    res.status(201).json({ message: 'Brand added successfully', data: newBrand });
  } catch (error) {

    console.log(error)
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Brand already exists.' });
    }
    next(error);
  }
};

// Update brand
exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBrand = await Brands.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedBrand) return res.status(404).json({ message: 'Brand not found' });
    res.json({ message: 'Brand updated', data: updatedBrand });
  } catch (error) {
    next(error);
  }
};

// Delete brand
exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Brands.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Brand not found' });
    res.json({ message: 'Brand deleted' });
  } catch (error) {
    next(error);
  }
};

// --- Add New Category
exports.addCategory = async (req, res, next) => {
  try {
    const { Category1, top } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Category image is required" });
    }

    const imagePath = `/topBanners/${file.filename}`;

    const newCat = new Category({ Category1, image: imagePath, top });
    await newCat.save();
    res.status(201).json({ message: 'Category added', data: newCat });
  } catch (err) {
    next(err);
  }
};

// --- Update Category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Category1 } = req.body;
    const file = req.file;

    const existingCat = await Category.findById(id);
    if (!existingCat) {
      return res.status(404).json({ error: "Category not found" });
    }

    // If new image uploaded, update image path
    if (file) {
      const oldPath = path.join(__dirname, "../../public", existingCat.image);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      updates.image = `/topBanners/${file.filename}`;
    }

    const updatedCat = await Category.findByIdAndUpdate(id, { Category1: Category1 }, { new: true });

    if (!updatedCat) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category updated', data: updatedCat });
  } catch (err) {
    next(err);
  }
};


// --- Delete Category (and its subcategories)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Subcategory.deleteMany({ Category1: id });
    await SubSubCategory.deleteMany({ Category1: id });
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category and related subcategories deleted' });
  } catch (err) {
    next(err);
  }
};



// --- Express route handler for fetching subcategories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json({ data: categories });
  } catch (error) {
    // Proper error handling
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};


// --- Express route handler for fetching subcategories
exports.getSubCategory = async (req, res, next) => {
  const Category1 = req.query.Category1;

  try {
    let query = {};
    if (Category1) {
      query.Category1 = Category1;
    }

    const categories = await Subcategory.find(query).sort({ createdAt: -1 });

    res.status(200).json({ data: categories });
  } catch (error) {
    // Proper error handling
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

exports.getSubChildCategory = async (req, res, next) => {
  const Category2 = req.query.Category2;

  try {
    let query = {};
    if (Category2) {
      query.Category2 = Category2;
    }

    const categories = await SubSubCategory.find(query).sort({ createdAt: -1 });

    res.status(200).json({ data: categories });
  } catch (error) {
    // Proper error handling
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// --- Add Subcategory
exports.addSubCategory = async (req, res, next) => {
  try {
    const { Category1, Category2 } = req.body;
    const file = req.file;

    console.log(req.body, file);

    if (!Category2 || !Category1 || !file) {
      return res.status(400).json({ message: "All fields (Category2, Category1, image) are required" });
    }

    const imagePath = `/topBanners/${file.filename}`;

    const category1 = await Category.findById(Category1).sort({ createdAt: -1 });
    if (!category1) {
      return res.status(404).json({ message: 'Top category not found' }); // <- return added here
    }

    const newSubCat = new Subcategory({
      Category2,
      Category1: category1._id,
      image: imagePath
    });

    await newSubCat.save();

    res.status(201).json({ message: 'Subcategory added', data: newSubCat });

  } catch (err) {
    next(err);
  }
};


// --- Update Subcategory
exports.updateSubCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Category2 } = req.body;
    const file = req.file;

    // Step 1: Validate subcategory existence
    const existingCat = await Subcategory.findById(id);
    if (!existingCat) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    const updateFields = {};

    // Step 2: Validate Category2
    if (!Category2 || Category2.trim() === '') {
      return res.status(400).json({ message: 'Category2 (subcategory name) is required' });
    }
    updateFields.Category2 = Category2.trim();


    // Step 4: Handle optional image update
    if (file) {
      const oldPath = path.join(__dirname, "../../public", existingCat.image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      updateFields.image = `/topBanners/${file.filename}`;
    }

    // Step 5: Update and return new subcategory
    const updated = await Subcategory.findByIdAndUpdate(id, updateFields, { new: true });

    res.json({ message: 'Subcategory updated', data: updated });

  } catch (err) {
    next(err);
  }
};

// --- Delete Subcategory (and its sub-subcategories)
exports.deleteSubCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await SubSubCategory.deleteMany({ Category2: id });
    const deleted = await Subcategory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Subcategory not found' });
    res.json({ message: 'Subcategory and its sub-subcategories deleted' });
  } catch (err) {
    next(err);
  }
};

// --- Add Sub-Subcategory
exports.addSubSubCategory = async (req, res, next) => {
  try {
    const { Category3, Category2, Category1 } = req.body;

    console.log(req.body)

    if (!Category3 || !Category2 || !Category1) {
      return res.status(400).json({ message: "All fields (Category3, Category2, Category1) are required" });
    }

    const category1 = await Category.findById(Category1);
    if (!category1) {
      return res.status(404).json({ message: 'Top category not found' }); // <- return added here
    }

    const category2 = await Subcategory.findById(Category2);
    if (!category2) {
      return res.status(404).json({ message: 'Sub category not found' }); // <- return added here
    }

    const newSubChildCat = new SubSubCategory({
      Category3,
      Category2: category2._id,
      Category1: category1._id,
    });

    await newSubChildCat.save();

    res.status(201).json({ message: 'Sub child category added', data: newSubChildCat });
  } catch (err) {
    next(err);
  }
};

// --- Update Sub-Subcategory
exports.updateSubSubCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Category3 } = req.body;

    console.log(Category3)

    const updated = await SubSubCategory.findByIdAndUpdate(id, { Category3 }, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Sub-Subcategory not found' });
    }

    res.json({ message: 'Sub-Subcategory updated', data: updated });
  } catch (err) {
    next(err);
  }
};

// --- Delete Sub-Subcategory
exports.deleteSubSubCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await SubSubCategory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Sub-Subcategory not found' });
    res.json({ message: 'Sub-Subcategory deleted' });
  } catch (err) {
    next(err);
  }
};


// ---- mark Top
exports.markTopCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { top } = req.body;

    console.log("top ==> ", top);

    // // Ensure 'top' is a boolean
    // if (typeof top !== 'boolean') {
    //   if (top === 'true') top = true;
    //   else if (top === 'false') top = false;
    //   else return res.status(400).json({ message: "'top' must be true or false" });
    // }

    const updatedCat = await Category.findByIdAndUpdate(id, { top: top }, { new: true });

    if (!updatedCat) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category updated', data: updatedCat });
  } catch (err) {
    next(err);
  }
};