const { body } = require("express-validator");

exports.createOrderValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("firstName").notEmpty().withMessage("First name is required"),
  body("postcode").notEmpty().withMessage("postcode is required"),
  body("lastName")
    .notEmpty()
    .withMessage("Last name is required"),
  body("address")
    .notEmpty()
    .withMessage("Address is required"),
  body("city")
    .notEmpty()
    .withMessage("City is required"),
  // body("postcode")
  //   .notEmpty()
  //   .withMessage("postcode is required"),
  body("company")
    .notEmpty()
    .withMessage("company is required"),
  body("products")
    .isArray({ min: 1 })
    .withMessage("At least one product is required"),
  body("subtotal")
    .isNumeric()
    .withMessage("Subtotal is required and must be a number"),
  body("total")
    .isNumeric()
    .withMessage("Total is required and must be a number"),
];
