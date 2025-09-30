const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const upload = require("../utils/uploadBanner");
const auth = require("../middlewares/auth");

router.get("/", bannerController.getBanners);
router.get("/banners", auth, bannerController.getAllBanners);
router.post("/add", auth, upload.single("banner"), bannerController.addBanner);
router.put("/:id", auth, upload.single("banner"), bannerController.updateBanner);
router.put('/:id/status', auth, bannerController.toggleABannerStatus);
router.delete("/:id", auth, bannerController.deleteBanner);

router.get('/getFloatingBanner', bannerController.getBanner);
router.get("/getFloatingBannerAamin", auth, bannerController.getFloatingBanners);
router.post('/addFloatingBanner', auth, upload.single("banner"), bannerController.createBanner);
router.put('/updateFloatingBanner/:id', auth, upload.single("banner"), bannerController.updateFloatingBanner);
router.put('/updateFloatingBanner/:id/status', auth, bannerController.toggleFloatingBannerStatus);

module.exports = router;

