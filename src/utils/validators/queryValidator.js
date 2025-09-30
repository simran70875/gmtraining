const { body } = require("express-validator");

exports.validateQuery = [
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("company").notEmpty().withMessage("Company is required"),
    body("userId").notEmpty().withMessage("User ID is required")
];
