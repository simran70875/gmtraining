const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  // userId: { type: String, required: false },
  userId: { type: String, ref: "User" },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 }
    }
  ]
});

module.exports = mongoose.model("Cart", cartSchema);
