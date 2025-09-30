const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

router.post("/add",  cartController.addCart);
router.get("/",  cartController.getCartProducts);
router.put("/update",  cartController.updateCartQuantity);
router.delete("/remove",  cartController.removeCartItem);

module.exports = router;
