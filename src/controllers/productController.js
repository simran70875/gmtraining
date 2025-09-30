const mongoose = require('mongoose');
const Product = require('../models/Product');
const Brand = require('../models/Brand');

const Category = require('../models/Category');
const Subcategory = require('../models/SubCategory');
const SubChildCategory = require('../models/SubSubCategory');

const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      category1,
      category2,
      category3,
      brand,
      topSelling
    } = req.query;

    const filter = { isActive: true };

    if (search) {
      const isNumber = !isNaN(Number(search));
      filter.$or = [
        { Style: { $regex: search, $options: "i" } },
        { Description: { $regex: search, $options: "i" } },
        { Code: { $regex: search, $options: "i" } },
        ...(isNumber ? [{ ISPCCombined: Number(search) }] : [])
      ];
    }

    if (topSelling === 'true') {
      filter.topSelling = true;
    }

    const toObjectIdArray = (param) => {
      if (!param) return undefined;

      // Already an array (e.g., ?category1=A&category1=B)
      if (Array.isArray(param)) {
        return { $in: param.map(id => new mongoose.Types.ObjectId(id)) };
      }

      // Try to parse JSON (e.g. '["A","B"]')
      try {
        const parsed = JSON.parse(param);
        if (Array.isArray(parsed)) {
          return { $in: parsed.map(id => new mongoose.Types.ObjectId(id)) };
        }
        return mongoose.Types.ObjectId(parsed); // single string
      } catch {
        // Fallback: comma-separated string
        const ids = param.split(',');
        return { $in: ids.map(id => new mongoose.Types.ObjectId(id)) };
      }
    };

    const parsedCategory1 = toObjectIdArray(category1);
    if (parsedCategory1) filter.Category1 = parsedCategory1;

    const parsedCategory2 = toObjectIdArray(category2);
    if (parsedCategory2) filter.Category2 = parsedCategory2;

    const parsedCategory3 = toObjectIdArray(category3);
    if (parsedCategory3) filter.Category3 = parsedCategory3;

    const parsedBrands = toObjectIdArray(brand);
    if (parsedBrands) filter.Brand = parsedBrands;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean()
        .populate('Category1')
        .populate('Category2')
        .populate('Category3')
        .populate('Brand'),
      Product.countDocuments(filter)
    ]);


    res.status(200).json({
      data: products,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductsCount = async (req, res, next) => {
  try {
    const count = await Product.countDocuments(); // or add a filter if needed

    res.status(200).json({ data: count });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res.status(500).json({ message: "Something went wrong while counting products." });
  }
};

exports.getAdminProducts = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      category1,
      category2,
      category3,
      brand
    } = req.query;


    console.log(req.query);

    const filter = {};

    if (search) {
      const isNumber = !isNaN(Number(search));
      filter.$or = [
        { Style: { $regex: search, $options: "i" } },
        { Description: { $regex: search, $options: "i" } },
        { Code: { $regex: search, $options: "i" } },
        ...(isNumber ? [{ ISPCCombined: Number(search) }] : [])
      ];
    }


    const toObjectIdArray = (param) => {
      if (!param) return undefined;

      // Already an array (e.g., ?category1=A&category1=B)
      if (Array.isArray(param)) {
        return { $in: param.map(id => new mongoose.Types.ObjectId(id)) };
      }

      // Try to parse JSON (e.g. '["A","B"]')
      try {
        const parsed = JSON.parse(param);
        if (Array.isArray(parsed)) {
          return { $in: parsed.map(id => new mongoose.Types.ObjectId(id)) };
        }
        return mongoose.Types.ObjectId(parsed); // single string
      } catch {
        // Fallback: comma-separated string
        const ids = param.split(',');
        return { $in: ids.map(id => new mongoose.Types.ObjectId(id)) };
      }
    };

    const parsedCategory1 = toObjectIdArray(category1);
    if (parsedCategory1) filter.Category1 = parsedCategory1;

    const parsedCategory2 = toObjectIdArray(category2);
    if (parsedCategory2) filter.Category2 = parsedCategory2;

    const parsedCategory3 = toObjectIdArray(category3);
    if (parsedCategory3) filter.Category3 = parsedCategory3;

    const parsedBrands = toObjectIdArray(brand);
    if (parsedBrands) filter.Brand = parsedBrands;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean()
        .populate('Category1')
        .populate('Category2')
        .populate('Category3')
        .populate('Brand'),
      Product.countDocuments(filter)
    ]);


    res.status(200).json({
      data: products,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.updateVisibility = async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ data: product, message: "Status updated successfully!" });
  } catch (error) {
    console.error("Update visibility error:", error);
    res.status(500).json({
      message: "Status update failed",
      error: error.message
    });
  }
};


exports.addProduct = async (req, res, next) => {
  try {
    const {
      Code,
      Description,
      Pack,
      rrp,
      GrpSupplier,
      GrpSupplierCode,
      Manufacturer,
      ManufacturerCode,
      ISPCCombined,
      VATCode,
      Brand,
      ExtendedCharacterDesc,
      CatalogueCopy,
      ImageRef,
      Category1,
      Category2,
      Category3,
      Style,
    } = req.body;


    console.log(req.body);



    // Optional: Check for duplicate
    const existing = await Product.findOne({ Code });
    if (existing) {
      return res.status(409).json({ message: "Product with this code already exists" });
    }

    const product = new Product({
      Code,
      Description,
      Pack,
      rrp,
      GrpSupplier,
      GrpSupplierCode,
      Manufacturer,
      ManufacturerCode,
      ISPCCombined,
      VATCode,
      Brand,
      ExtendedCharacterDesc,
      CatalogueCopy,
      ImageRef,
      Category1,
      Category2,
      Category3,
      Style,
    });

    await product.save();

    res.status(201).json({ message: "Product added successfully", data: product });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};


exports.editProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      Code,
      Description,
      Pack,
      rrp,
      GrpSupplier,
      GrpSupplierCode,
      Manufacturer,
      ManufacturerCode,
      ISPCCombined,
      VATCode,
      Brand,
      ExtendedCharacterDesc,
      CatalogueCopy,
      ImageRef,
      Category1,
      Category2,
      Category3,
      Style,
    } = req.body;

    console.log("edit product ==> ", req.body);

    // Properly update the product
    const product = await Product.findByIdAndUpdate(
      id,
      {
        Code,
        Description,
        Pack,
        rrp,
        GrpSupplier,
        GrpSupplierCode,
        Manufacturer,
        ManufacturerCode,
        ISPCCombined,
        VATCode,
        Brand,
        ExtendedCharacterDesc,
        CatalogueCopy,
        ImageRef,
        Category1,
        Category2,
        Category3,
        Style,
      },
      { new: true } // return updated document
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", data: product });
  } catch (error) {
    console.error("Edit product error:", error);
    res.status(500).json({ message: "Failed to edit product", error: error.message });
  }
};


exports.deleteProduct = async (req, res, next) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ data: product, message: "Product Deleted Successfully!" });
  } catch (error) {
    console.error("Product delete error:", error);
    res.status(500).json({
      message: "Product delete failed",
      error: error.message
    });
  }
};


exports.getSingleProduct = async (req, res, next) => {

  const { productId } = req.params;
  console.log("productId ==> ", productId);

  if (!productId) {
    return res.status(400).json({ error: "Missing productId" });
  }

  try {
    const product = await Product.findById({ _id: productId }).populate([
      { path: "Brand" },
      { path: "Category1" },
      { path: "Category2" },
      { path: "Category3" }
    ]);



    if (!product) {
      return res.status(404).json({ error: "product not found" });
    }


    return res.json({ data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }

}

// exports.uploadFile = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file received" });
//     }

//     const filePath = req.file.path;
//     const products = await parseProductCSV(filePath);

//     try {
//       const result = await Product.insertMany(products);
//       console.log("Products inserted:", result.length);
//     } catch (insertErr) {
//       console.error("InsertMany Error:", insertErr);
//       if (insertErr && insertErr.writeErrors) {
//         insertErr.writeErrors.forEach((e, i) => {
//           console.error(`Error ${i + 1}:`, e.err.op.Code, e.err.errmsg || e.err);
//         });
//       }
//     }

//     // Clean up CSV file
//     try {
//       fs.unlinkSync(filePath);
//     } catch (unlinkErr) {
//       console.error("File deletion error:", unlinkErr);
//     }

//     res.status(200).json({ message: "Upload process completed" });
//   } catch (error) {
//     console.error("Upload handler error:", {
//       message: error.message,
//       stack: error.stack,
//     });
//     res.status(500).json({ message: "Upload Failed", error: error.message });
//   }
// };

async function resolveCategoryIds(row) {
  const [cat1, cat2, cat3] = await Promise.all([
    Category.findOne({ Category1: row.Category1 }),
    Subcategory.findOne({ Category2: row.Category2 }),
    SubChildCategory.findOne({ Category3: row.Category3 }),
  ]);
  return {
    Category1: cat1?._id || null,
    Category2: cat2?._id || null,
    Category3: cat3?._id || null,
  };
}

async function resolveBrandId(brandName) {
  const brand = await Brand.findOne({ Brand: brandName });
  return brand ? brand._id : null;

}

const cache = new Map();

const ensureExists = async (Model, field, value, image) => {
  if (!value) return null;
  const key = `${Model.modelName}_${value}`;
  if (cache.has(key)) return cache.get(key);

  let doc = await Model.findOne({ [field]: value });
  if (!doc) {
    doc = new Model({ [field]: value, image: image });
    await doc.save();
  }

  cache.set(key, doc._id);
  return doc._id;
};

const ensureCategoryHierarchy = async (cat1, cat2, cat3, image) => {
  const category1Id = await ensureExists(Category, 'Category1', cat1, image);

  const subKey = `Subcategory_${cat2}_${category1Id}`;
  let subCatId;
  if (cache.has(subKey)) {
    subCatId = cache.get(subKey);
  } else {
    let subCat = await Subcategory.findOne({ Category2: cat2, Category1: category1Id });
    if (!subCat) {
      subCat = new Subcategory({ Category2: cat2, Category1: category1Id, image: image });
      await subCat.save();
    }
    subCatId = subCat._id;
    cache.set(subKey, subCatId);
  }

  const subSubKey = `SubChildCategory_${cat3}_${category1Id}_${subCatId}`;
  let subSubCatId;
  if (cache.has(subSubKey)) {
    subSubCatId = cache.get(subSubKey);
  } else {
    let subSubCat = await SubChildCategory.findOne({
      Category3: cat3,
      Category1: category1Id,
      Category2: subCatId,
    });

    if (!subSubCat) {
      subSubCat = new SubChildCategory({
        Category3: cat3,
        Category1: category1Id,
        Category2: subCatId,
      });
      await subSubCat.save();
    }

    subSubCatId = subSubCat._id;
    cache.set(subSubKey, subSubCatId);
  }

  return [category1Id, subCatId, subSubCatId];
};


exports.uploadSimpleCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file received' });

    const filePath = req.file.path;
    const ext = path.extname(filePath).toLowerCase();
    const rows = [];

    if (ext === '.csv') {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', async () => {
          await processRows(rows, filePath, res);
        });
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      await processRows(data, filePath, res);
    } else {
      return res.status(400).json({ message: 'Unsupported file format' });
    }
  } catch (err) {
    console.error('Upload handler error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

const processRows = async (rows, filePath, res) => {
  try {
    const products = [];

    // === STEP 1: Collect unique values ===
    const brandSet = new Set();
    const category1Set = new Set();
    const subCatMap = new Map();
    const subSubCatMap = new Map();

    for (const row of rows) {
      if (row.Brand) brandSet.add(row.Brand);
      if (row.Category1) category1Set.add(row.Category1);

      if (row.Category1 && row.Category2) {
        const key = `${row.Category1}|${row.Category2}`;
        subCatMap.set(key, { Category1: row.Category1, Category2: row.Category2, image: row['Image Ref'] });
      }

      if (row.Category1 && row.Category2 && row.Category3) {
        const key = `${row.Category1}|${row.Category2}|${row.Category3}`;
        subSubCatMap.set(key, {
          Category1: row.Category1,
          Category2: row.Category2,
          Category3: row.Category3,
        });
      }
    }

    // === STEP 2: Fetch all existing brands & categories in bulk ===
    const brandDocs = await Brand.find({ Brand: { $in: Array.from(brandSet) } });
    for (const doc of brandDocs) cache.set(`Brand_${doc.Brand}`, doc._id);

    const categoryDocs = await Category.find({ Category1: { $in: Array.from(category1Set) } });
    for (const doc of categoryDocs) cache.set(`Category_${doc.Category1}`, doc._id);

    const subCatDocs = await Subcategory.find({
      $or: Array.from(subCatMap.values()).map((val) => ({
        Category1: cache.get(`Category_${val.Category1}`),
        Category2: val.Category2,
      })),
    });
    for (const doc of subCatDocs) {
      const key = `${doc.Category1}|${doc.Category2}`;
      cache.set(`Subcategory_${key}`, doc._id);
    }

    const subSubCatDocs = await SubChildCategory.find({
      $or: Array.from(subSubCatMap.values()).map((val) => ({
        Category1: cache.get(`Category_${val.Category1}`),
        Category2: cache.get(`Subcategory_${val.Category1}|${val.Category2}`),
        Category3: val.Category3,
      })),
    });
    for (const doc of subSubCatDocs) {
      const key = `${doc.Category1}|${doc.Category2}|${doc.Category3}`;
      cache.set(`SubChildCategory_${key}`, doc._id);
    }

    // === STEP 3: Process rows ===
    const existingDescriptions = await Product.find({ Description: { $in: rows.map(r => r.Description) } })
      .distinct('Description');
    const existingDescSet = new Set(existingDescriptions);

    for (const row of rows) {
      // Ensure brand
      const brandKey = `Brand_${row.Brand}`;
      let brandId = cache.get(brandKey);
      if (!brandId && row.Brand) {
        const newBrand = await new Brand({ Brand: row.Brand, image: row['Image Ref'] }).save();
        brandId = newBrand._id;
        cache.set(brandKey, brandId);
      }

      // Ensure Category1
      const catKey = `Category_${row.Category1}`;
      let category1Id = cache.get(catKey);
      if (!category1Id && row.Category1) {
        const newCat = await new Category({ Category1: row.Category1, image: row['Image Ref'] }).save();
        category1Id = newCat._id;
        cache.set(catKey, category1Id);
      }

      // Ensure Subcategory
      const subKey = `${row.Category1}|${row.Category2}`;
      const subCatCacheKey = `Subcategory_${subKey}`;
      let category2Id = cache.get(subCatCacheKey);
      if (!category2Id && row.Category2) {
        const newSub = await new Subcategory({
          Category1: category1Id,
          Category2: row.Category2,
          image: row['Image Ref'],
        }).save();
        category2Id = newSub._id;
        cache.set(subCatCacheKey, category2Id);
      }

      // Ensure SubChildCategory
      const subSubKey = `${row.Category1}|${row.Category2}|${row.Category3}`;
      const subSubCacheKey = `SubChildCategory_${subSubKey}`;
      let category3Id = cache.get(subSubCacheKey);
      if (!category3Id && row.Category3) {
        const newSubSub = await new SubChildCategory({
          Category1: category1Id,
          Category2: category2Id,
          Category3: row.Category3,
        }).save();
        category3Id = newSubSub._id;
        cache.set(subSubCacheKey, category3Id);
      }

      if (!existingDescSet.has(row.Description)) {
        const product = {
          Code: row.Code || row.Style,
          Description: row.Description,
          Pack: parseFloat(row.Pack),
          rrp: parseFloat(row.rrp),
          GrpSupplier: row.GrpSupplier,
          GrpSupplierCode: row.GrpSupplierCode,
          Manufacturer: row.Manufacturer,
          ManufacturerCode: row.ManufacturerCode,
          ISPCCombined: parseInt(row.ISPCCombined),
          VATCode: parseInt(row.VATCode),
          Brand: brandId,
          ExtendedCharacterDesc: row.ExtendedCharacterDesc,
          CatalogueCopy: row.CatalogueCopy,
          ImageRef: row['Image Ref'],
          Category1: category1Id,
          Category2: category2Id,
          Category3: category3Id,
          Style: row.Style,
        };

        products.push(product);
      }
    }

    // === STEP 4: Bulk insert ===
    if (products.length > 0) {
      await Product.insertMany(products, { ordered: false });
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      message: 'Products uploaded successfully',
      count: products.length,
    });
  } catch (err) {
    console.error('Process rows error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};


// exports.uploadSimpleCSV = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: 'No file received' });

//     const filePath = req.file.path;
//     const rows = [];

//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', (row) => rows.push(row))
//       .on('end', async () => {
//         try {
//           // Preload brands and categories into maps
//           const [brands, cats1, cats2, cats3] = await Promise.all([
//             Brand.find(),
//             Category.find(),
//             Subcategory.find(),
//             SubChildCategory.find(),
//           ]);

//           const brandMap = new Map(brands.map(b => [b.Brand, b._id]));
//           const cat1Map = new Map(cats1.map(c => [c.Category1, c._id]));
//           const cat2Map = new Map(cats2.map(c => [c.Category2, c._id]));
//           const cat3Map = new Map(cats3.map(c => [c.Category3, c._id]));

//           const products = [];

//           for (const row of rows) {
//             const product = {
//               Code: row.Code || row.Style,
//               Description: row.Description,
//               Pack: parseFloat(row.Pack),
//               rrp: parseFloat(row.rrp),
//               GrpSupplier: row.GrpSupplier,
//               GrpSupplierCode: row.GrpSupplierCode,
//               Manufacturer: row.Manufacturer,
//               ManufacturerCode: row.ManufacturerCode,
//               ISPCCombined: parseInt(row.ISPCCombined),
//               VATCode: parseInt(row.VATCode),
//               Brand: brandMap.get(row.Brand) || null,
//               ExtendedCharacterDesc: row.ExtendedCharacterDesc,
//               CatalogueCopy: row.CatalogueCopy,
//               ImageRef: row['Image Ref'],
//               Category1: cat1Map.get(row.Category1) || null,
//               Category2: cat2Map.get(row.Category2) || null,
//               Category3: cat3Map.get(row.Category3) || null,
//               Style: row.Style,
//             };

//             products.push(product);
//           }

//           await Product.insertMany(products, { ordered: false });
//           fs.unlinkSync(filePath);

//           res.status(200).json({ message: 'Products uploaded successfully', count: products.length });
//         } catch (err) {
//           console.error('Upload error:', err);
//           res.status(500).json({ message: 'Upload failed', error: err.message });
//         }
//       });
//   } catch (err) {
//     console.error('Upload handler error:', err);
//     res.status(500).json({ message: 'Upload failed', error: err.message });
//   }
// };


exports.topSelling = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { topSelling } = req.body;

    console.log(req.body)

    // Properly update the product
    const product = await Product.findByIdAndUpdate(
      id,
      {
        topSelling,
      },
      { new: true } // return updated document
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product updated successfully", data: product });
  } catch (error) {
    console.error("Edit product error:", error);
    res
      .status(500)
      .json({ message: "Failed to edit product", error: error.message });
  }
};
