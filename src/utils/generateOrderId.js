// utils/generateOrderId.js
const OrderCounter = require("../models/OrderCounter");

async function generateOrderId() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const dateStr = `${dd}${mm}${yy}`;
  const prefix = `WS${dateStr}`;

  // Find or create the counter for today
  const counter = await OrderCounter.findOneAndUpdate(
    { date: dateStr },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  const sequenceStr = String(counter.sequence).padStart(2, "0");
  return `${prefix}-${sequenceStr}`;
}

module.exports = generateOrderId;
