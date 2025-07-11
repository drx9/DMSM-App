const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Public routes
router.get('/', productController.getProducts);

// Add validation for UUID format before the :id route
router.get('/:id', (req, res, next) => {
    const { id } = req.params;
    // Check if id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ 
            message: 'Invalid product ID format. Expected UUID format.',
            received: id 
        });
    }
    next();
}, productController.getProductById);

// Admin routes
router.post('/', authenticateToken, isAdmin, productController.createProduct);
router.put('/:id', authenticateToken, isAdmin, productController.updateProduct);
router.delete('/:id', authenticateToken, isAdmin, productController.deleteProduct);
router.post('/bulk-upload', upload.single('file'), productController.bulkUploadProducts);

// Get product details with variants, similar, and bought together
router.get('/:id/details', productController.getProductDetails);

module.exports = router; 