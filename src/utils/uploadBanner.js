const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the directory exists
const uploadDir = path.join(__dirname, "../../public/topBanners");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("📁 Destination middleware hit");
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    console.log("📝 Filename middleware hit", file);
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log("🔍 File filter:", file.originalname, file.mimetype);
    // Optional: Accept only images
    if (!file.mimetype.startsWith("image/")) {
      console.log("❌ Rejected non-image file");
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  }
});

module.exports = upload;
