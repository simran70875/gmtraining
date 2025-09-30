const mongoose = require('mongoose');


const variationSchema = new mongoose.Schema({
    sku: { type: String, },
    size: { type: String, },
    color: { type: String, }
});


const productSchema = new mongoose.Schema({
    Code: { type: String, required: true },
    Description: String,
    Pack: Number,
    rrp: Number,
    GrpSupplier: String,
    GrpSupplierCode: String,
    Manufacturer: String,
    ManufacturerCode: String,
    ISPCCombined: Number,
    VATCode: Number,
    Brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    ExtendedCharacterDesc: String,
    CatalogueCopy: String,
    ImageRef: { type: String, alias: 'Image Ref' },
    Category1: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    Category2: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
    Category3: { type: mongoose.Schema.Types.ObjectId, ref: 'SubChildCategory' },
    Style: String,
    isActive: { type: Boolean, default: true },
    topSelling: { type: Boolean, default: true },
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema, 'products');

