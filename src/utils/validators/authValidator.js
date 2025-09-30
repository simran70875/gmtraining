const { body } = require("express-validator");

// Validation rules
exports.signupValidation = [
    body("type").notEmpty().withMessage("User type is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
];

exports.loginValidation = [
    body("userIdOrEmail").notEmpty().withMessage("User ID or Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
];