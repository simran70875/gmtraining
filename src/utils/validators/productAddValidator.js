const { body } = require("express-validator");

// Validation rules for adding a product
exports.productAddValidator = [
  body("Code").notEmpty().withMessage("Code is required"),
  body("Description").notEmpty().withMessage("Description is required"),
  body("Pack").notEmpty().isNumeric().withMessage("Pack must be a number"),
  body("rrp").notEmpty().isNumeric().withMessage("RRP must be a number"),
  body("GrpSupplier").notEmpty().withMessage("GrpSupplier is required"),
  body("GrpSupplierCode").notEmpty().withMessage("GrpSupplierCode is required"),
  body("Manufacturer").notEmpty().withMessage("Manufacturer is required"),
  body("ManufacturerCode").notEmpty().withMessage("ManufacturerCode is required"),
  body("ISPCCombined").notEmpty().isInt().withMessage("ISPCCombined must be an integer"),
  body("VATCode").notEmpty().isInt().withMessage("VATCode must be an integer"),
  body("Brand").notEmpty().withMessage("Brand (ObjectId) is required"),
  body("ExtendedCharacterDesc").notEmpty().withMessage("ExtendedCharacterDesc is required"),
  body("CatalogueCopy").notEmpty().withMessage("CatalogueCopy is required"),
  body("ImageRef").notEmpty().withMessage("ImageRef is required"),
  body("Category1").notEmpty().withMessage("Category1 (ObjectId) is required"),
  body("Category2").notEmpty().withMessage("Category2 (ObjectId) is required"),
  body("Category3").notEmpty().withMessage("Category3 (ObjectId) is required"),
  body("Style").notEmpty().withMessage("Style is required"),
];