// models/OrderCounter.js
const mongoose = require("mongoose");

const orderCounterSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // format: ddmmyy
  sequence: { type: Number, required: true },
});

module.exports = mongoose.model("OrderCounter", orderCounterSchema);
