const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");

// Add to cart (single global cart)
exports.addCart = async (req, res) => {
    const { productId, quantity, userId } = req.body;

    try {
        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Product ID and valid quantity are required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (!userId) {
            return res.status(400).json({ message: 'User ID required for guest cart' });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            const newUser = new User({
                userId,
                type: "guest",
            });

            await newUser.save();
        }


        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                items: [{ product: productId, quantity }]
            });
        } else {
            const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity });
            }
        }

        await cart.save();
        res.status(200).json({ data: cart, message: "Product Saved Successfully to Your Cart" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add product to cart" });
    }
};

exports.updateCartQuantity = async (req, res) => {
    // Check if req.body exists and is an object
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: 'Request body is required' });
    }

    const { productId, quantity, userId } = req.body;

    if (!productId || !quantity || quantity <= 0 || !userId) {
        return res.status(400).json({
            message: 'Product ID, valid quantity, and session ID are required',
        });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const item = cart.items.find((i) => i.productId.toString() === productId);
        if (!item) return res.status(404).json({ message: 'Product not found in cart' });

        item.quantity = quantity;
        await cart.save();

        res.json({ message: 'Cart updated Successfully', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update quantity' });
    }
};

exports.removeCartItem = async (req, res) => {
    const { productId, userId } = req.body;

    if (!productId || !userId) {
        return res.status(400).json({
            message: 'Product ID and user ID are required',
        });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.product.toString() !== productId);

        if (cart.items.length === initialLength) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        await cart.save();

        res.json({ message: 'Item removed successfully', cart });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
};

exports.getCartProducts = async (req, res) => {
    const { userId } = req.query;
    try {
        if (!userId) {
            return res.status(400).json({ message: 'User ID required to get guest cart' });
        }
        const cart = await Cart.find({ userId }).populate('items.product')
        if (!cart) return res.status(404).json({ message: 'Cart not found' });
        res.json({ data: cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get product from cart" });
    }
}
