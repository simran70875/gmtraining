const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middlewares/auth');
const upload = require("../utils/uploadBanner");

router.get('/nested-categories', categoryController.getNestedCategories);
router.get('/top-categories', categoryController.getTopCategories);


router.get('/brands', categoryController.getBrands);
router.post('/brand', auth, categoryController.addBrand);
router.put('/brand/:id', auth, categoryController.updateBrand);
router.delete('/brand/:id', auth, categoryController.deleteBrand);

// Category
router.get('/', auth, categoryController.getCategories);
router.post('/category', auth, upload.single("image"), categoryController.addCategory);
router.put('/category/:id', auth, upload.single("image"), categoryController.updateCategory);
router.delete('/category/:id', auth, categoryController.deleteCategory);
router.put('/top-category/:id/top', auth, categoryController.markTopCategory)

// Subcategory
router.get('/sub-categories', auth, categoryController.getSubCategory);
router.post('/sub-category', auth, upload.single("image"), categoryController.addSubCategory);
router.put('/sub-category/:id', auth, upload.single("image"), categoryController.updateSubCategory);
router.delete('/sub-category/:id', auth, categoryController.deleteSubCategory);

// Sub-Subcategory
router.get('/sub-child-categories', auth, categoryController.getSubChildCategory);
router.post('/sub-child-category', auth, categoryController.addSubSubCategory);
router.put('/sub-child-category/:id', auth, categoryController.updateSubSubCategory);
router.delete('/sub-child-category/:id', auth, categoryController.deleteSubSubCategory);

module.exports = router;
