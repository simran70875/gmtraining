const { body } = require("express-validator");

// Validation rules
exports.agentAddValidation = [
    body("firstName").notEmpty().withMessage("firstName is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
];