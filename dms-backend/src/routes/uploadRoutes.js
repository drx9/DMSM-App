const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dpdlmdl5x',
    api_key: '298524623458681',
    api_secret: 'I6SZkaBwqNIC6sHUXWUhO2BnTY8',
});

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
    try {
        console.log('Received file:', req.file);
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'avatars',
            resource_type: 'image',
        });
        fs.unlinkSync(req.file.path); // Clean up local file
        res.json({ url: result.secure_url });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({ error: error.message, details: error });
    }
});

module.exports = router; 