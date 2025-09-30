const fs = require('fs');
const csv = require('csv-parser');
const resolveCategoryIds = require('./resolveCategories');

/**
 * Parses a CSV file and groups products by base code, nesting variations.
 * @param {string} filePath - Full path to the CSV file.
 * @returns {Promise<Array<Object>>} - Promise that resolves to an array of grouped product objects.
 */


function extractColorAndSize(desc) {
    if (!desc) return { color: null, size: null };

    // Matches size patterns like XS, S, M, L, XL, XXL, 5XL etc
    const sizePattern = /\b([0-9]?[X]{0,3}[SLM]{1,2})\b$/i;
    const sizeMatch = desc.match(sizePattern);
    const size = sizeMatch ? sizeMatch[0] : null;

    // Remove size from the string to get color
    let color = size ? desc.replace(sizePattern, '').trim() : null;

    // Special case: try to pick last 1-3 words as color
    if (color) {
        const words = color.split(/\s+/);
        color = words.slice(-3).join(' '); // Last 3 words max
    }

    return { color, size };
}

function parseProductCSV(filePath) {
    return new Promise((resolve, reject) => {
        const rawRows = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                rawRows.push(row); // Buffer all rows first
            })
            .on('end', async () => {
                try {
                    const productsMap = {};

                    for (const row of rawRows) {
                        const code = row['Style'];

                        const categoryIds = await resolveCategoryIds({
                            category1: row['Category1'],
                            category2: row['Category2'],
                            category3: row['Category3'],
                        });

                        if (!productsMap[code]) {
                            productsMap[code] = {
                                Code: code,
                                Description: row['Description'],
                                Pack: parseFloat(row['Pack']),
                                rrp: parseFloat(row['rrp']),
                                GrpSupplier: row['GrpSupplier'],
                                GrpSupplierCode: row['GrpSupplierCode'],
                                ManufacturerCode: row['ManufacturerCode'],
                                Manufacturer: row['Manufacturer'],
                                ISPCCombined: parseInt(row['ISPCCombined']),
                                VATCode: parseInt(row['VATCode']),
                                Brand: row['Brand'],
                                ExtendedCharacterDesc: row['ExtendedCharacterDesc'],
                                CatalogueCopy: row['CatalogueCopy'],
                                ImageRef: row['ImageRef'],
                                Category1: categoryIds.Category1,
                                Category2: categoryIds.Category2,
                                Category3: categoryIds.Category3,
                                Style: row['Style'],
                                variations: [],
                            };
                        }

                        const { color, size } = extractColorAndSize(row['ExtendedCharacterDesc']);

                        console.log(color, size);
                        productsMap[code].variations.push({
                            sku: row['Code'],
                            size,
                            color,
                        });
                    }

                    const finalProducts = Object.values(productsMap);
                    console.log(`Final products to insert: ${finalProducts.length}`);
                    resolve(finalProducts);
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}


module.exports = parseProductCSV;
