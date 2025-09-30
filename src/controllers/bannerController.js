const Banner = require("../models/TopBanners");
const FloatingBanner = require("../models/FloatingBanner");
const fs = require('fs');
const path = require('path');

// Add Banner
exports.addBanner = async (req, res) => {
    try {
        const { title } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "Banner image is required" });
        }

        const bannerPath = `/topBanners/${file.filename}`;
        const newBanner = new Banner({ title, banner: bannerPath });

        await newBanner.save();
        res.status(201).json({ message: "Banner added", data: newBanner });
    } catch (error) {
        res.status(500).json({ message: "Failed to add banner" });
    }
};

// Get All Banners
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({
            data: banners,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch banners" });
    }
};


// Get All Banners
exports.getAllBanners = async (req, res) => {

    try {
        let banners = await Banner.find().sort({ createdAt: -1 });

        res.status(200).json({
            data: banners,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch banners" });
    }
};



// Update Banner
exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const file = req.file;

        const existingBanner = await Banner.findById(id);
        if (!existingBanner) {
            return res.status(404).json({ error: "Banner not found" });
        }

        const updatedData = { title };

        if (file) {
            // Delete old banner image from filesystem
            const oldBannerPath = path.join(__dirname, "../../public", existingBanner.banner);

            if (fs.existsSync(oldBannerPath)) {
                fs.unlinkSync(oldBannerPath);
            }
            // fs.unlinkSync(oldBannerPath);
            // Update with new image path
            updatedData.banner = `/topBanners/${file.filename}`;
        }

        const updatedBanner = await Banner.findByIdAndUpdate(id, updatedData, { new: true });

        res.status(200).json({ message: "Banner updated", data: updatedBanner });
    } catch (error) {
        console.error("Error updating banner:", error);
        res.status(500).json({ error: "Failed to update banner" });
    }
};


// Delete Banner
exports.deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBanner = await Banner.findByIdAndDelete(id);
        if (!deletedBanner) {
            return res.status(404).json({ error: "Banner not found" });
        }
        res.status(200).json({ message: "Banner deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete banner" });
    }
};

// GET banner (only latest)
exports.getBanner = async (req, res) => {
    try {
        const banner = await FloatingBanner.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.json({ data: banner });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch banner' });
    }
};

// Get All Banners for admin
exports.getFloatingBanners = async (req, res) => {
    try {
        let banners = await FloatingBanner.find();

        res.status(200).json({
            data: banners,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch banners" });
    }
};

// CREATE banner
exports.createBanner = async (req, res) => {
    const { title, description } = req.body;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: "Banner image is required" });
    }
    try {
        const imageUrl = `/topBanners/${file.filename}`;
        const newBanner = new FloatingBanner({ title, description, imageUrl });
        await newBanner.save();
        res.status(201).json({ data: newBanner, message: "Banner added Successfully" });
    } catch (err) {
        res.status(400).json({ error: 'Failed to create banner' });
    }
};

// UPDATE banner by ID
exports.updateFloatingBanner = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    try {
        const existingBanner = await FloatingBanner.findById(id);
        if (!existingBanner) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        const updateData = { title, description };

        if (file) {
            // Delete the old image file
            const oldImagePath = path.join(__dirname, '..', 'public', existingBanner.imageUrl); // adjust based on your setup
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }

            // Add new image path
            updateData.imageUrl = `/topBanners/${file.filename}`;
        }

        const updatedBanner = await FloatingBanner.findByIdAndUpdate(id, updateData, { new: true });
        res.json(updatedBanner);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update banner' });
    }
};



exports.toggleABannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const updatedBanner = await Banner.findByIdAndUpdate(id, { isActive }, { new: true });

        if (!updatedBanner) {
            return res.status(404).json({ error: "Banner not found" });
        }
        res.status(200).json({ message: "Banner updated", data: updatedBanner });

    } catch (err) {
        res.status(500).json({ message: 'Failed to update banner status', error: err.message });
    }
};


exports.toggleFloatingBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const updatedBanner = await FloatingBanner.findByIdAndUpdate(id, { isActive }, { new: true });

        if (!updatedBanner) {
            return res.status(404).json({ error: "Banner not found" });
        }
        res.status(200).json({ message: "Banner updated", data: updatedBanner });

    } catch (err) {
        res.status(500).json({ message: 'Failed to update banner status', error: err.message });
    }
};