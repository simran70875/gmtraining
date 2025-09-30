const multer = require("multer");
const path = require("path");
const fs = require("fs");

// CSV upload directory
const uploadDir = path.join(__dirname, "../../public/uploads/csv");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const uploadCSV = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only CSV or Excel files are allowed!"), false);
    }
    cb(null, true);
  }
});

module.exports = uploadCSV;
