const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, ref: "User" },
    agentId: { type: String },
    createdBy: { type: String, enum: ["admin", "user", "agent"], default: "user" },

    billingAddress: { type: String },
    invoiceAddress: { type: String },

    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String, required: true },
    address2: { type: String },
    city: { type: String, required: true },
    postcode: { type: String },
    company: { type: String, required: true },

    deliveryCharges: { type: Number, default: 0 },
    deliveryInstructions: { type: String },
    poNumber: { type: Number },
    message: { type: String },

    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        code: String,
        description: String,
        image: String,
        quantity: Number,
        buyPrice: Number,
        unitPrice: { type: Number },
        gressPrice: Number,
        commission: Number,
        totalPrice: { type: Number },
      },
    ],

    status: {
      type: String,
      enum: ["Pending", "Quotation Sent", "Order Received", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Unpaid", "Paid"],
      default: "Pending",
    },
    subtotal: { type: Number },
    tax: { type: Number },
    total: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
