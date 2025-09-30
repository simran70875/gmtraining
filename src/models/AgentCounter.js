// models/AgnetCounter.js
const mongoose = require("mongoose");

const agentCounterSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // format: ddmmyy
  sequence: { type: Number, required: true },
});

module.exports = mongoose.model("AgentCounter", agentCounterSchema);
