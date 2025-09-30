const express = require("express");
const router = express.Router();

const queryController = require("../controllers/userQueriesController");
const { validateQuery } = require("../utils/validators/queryValidator");
const uploadAny = require("../utils/uploads");
const auth = require("../middlewares/auth");

router.post("/send-query", uploadAny.single("document"), validateQuery, queryController.submitQuery);
router.get("/queries", auth, queryController.allQueries);
router.delete("/queries/:id", auth, queryController.deleteQuery);

module.exports = router;
