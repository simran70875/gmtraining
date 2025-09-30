const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const auth = require('../middlewares/auth');
const uploadCSV = require('../utils/uploadCSV');
const { productAddValidator } = require('../utils/validators/productAddValidator');

router.get('/', productController.getProducts);
router.get('/productCount',auth, productController.getProductsCount);
router.get('/allProducts', auth, productController.getAdminProducts);
router.put('/visibility/:id', auth, productController.updateVisibility);

router.post('/add', auth, productAddValidator, productController.addProduct);
router.put('/edit/:id', auth, productAddValidator, productController.editProduct);
router.delete('/product/:id', auth, productController.deleteProduct);

router.get('/get-product/:productId', productController.getSingleProduct);
router.post('/upload-csv', auth, uploadCSV.single("file"), productController.uploadSimpleCSV);

router.put('/topSelling/:id', auth, productController.topSelling);

module.exports = router;