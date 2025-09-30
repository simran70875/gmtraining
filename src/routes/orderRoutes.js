const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');
const { createOrderValidation } = require('../utils/validators/createOrderValidator');

router.post('/request-quote', orderController.requestQuote);
router.post('/send-invoice', auth, orderController.finalizeQuote); 
router.get("/get-all-orders", auth, orderController.getOrders);
router.get('/get-order/:orderId',  orderController.getOrder);
router.put('/edit-order/:orderId', orderController.confirm_Order);

router.post('/create-order', auth, createOrderValidation, orderController.createOrderByAdmin); 
router.post('/generate-token/:id', auth, orderController.generateToken); 


router.put('/:id/status', auth, orderController.updateOrderStatus);
router.put('/:id/paymentStatus', auth, orderController.updateOrderPaymentStatus);
router.delete('/:id/delete', auth, orderController.deleteOrder);

//graphs 
router.get('/compare-orders', auth, orderController.getOrderStatsComparison);
router.get('/monthly-profits', auth, orderController.getMonthlyProfits);
router.get("/agent-monthly-profits", auth, orderController.getAgentMonthlyProfits);

module.exports = router;
