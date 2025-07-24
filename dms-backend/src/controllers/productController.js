const db = require('../models');
const { Product, Category } = db;
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const fs = require('fs');

const VALID_SORT_COLUMNS = [
  'createdAt', 'price', 'discount', 'stock', 'rating', 'reviewCount', 'isOutOfStock', 'isActive', 'name'
];

const productController = {
  getProducts: async (req, res) => {
    try {
      let {
        page = 1,
        limit = 10,
        search,
        category,
        sort = 'createdAt',
        order = 'DESC',
        filters
      } = req.query;

      // Only allow sorting by valid columns
      if (!VALID_SORT_COLUMNS.includes(sort)) {
        sort = 'createdAt';
      }

      const offset = (page - 1) * limit;
      const where = { isActive: true };

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (category) {
        where.categoryId = category;
      }

      if (filters) {
        const filterObj = JSON.parse(filters);
        if (filterObj.inStock) {
          where.isOutOfStock = false;
        }
        if (filterObj.discount) {
          where.discount = { [Op.gt]: 0 };
        }
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where,
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }],
        order: [[sort, order]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        products,
        totalProducts: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Error fetching products' });
    }
  },

  getProductById: async (req, res) => {
    try {
      const productId = req.params.id;
      
      // Additional validation for UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(productId)) {
        console.error('[getProductById] Invalid UUID format:', productId);
        return res.status(400).json({ 
          message: 'Invalid product ID format. Expected UUID format.',
          received: productId 
        });
      }
      
      const product = await Product.findByPk(productId, {
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }]
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Error fetching product' });
    }
  },

  createProduct: async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        mrp,
        discount = 0,
        stock = 0,
        images = [],
        categoryId,
        details = {},
      } = req.body;

      // Validate required fields
      if (!name || !description || !price || !mrp || !categoryId) {
        return res.status(400).json({
          message: 'Missing required fields',
          required: ['name', 'description', 'price', 'mrp', 'categoryId']
        });
      }

      // Validate numeric fields
      if (isNaN(price) || isNaN(mrp) || isNaN(discount) || isNaN(stock)) {
        return res.status(400).json({
          message: 'Invalid numeric values',
          details: 'price, mrp, discount, and stock must be numbers'
        });
      }

      // Validate categoryId exists
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({
          message: 'Invalid categoryId',
          details: 'Category does not exist'
        });
      }

      // Get createdBy from authenticated user or request
      const createdBy = req.user?.id || req.body.createdBy;
      if (!createdBy) {
        return res.status(400).json({
          message: 'Missing createdBy field',
          details: 'Product must have a creator'
        });
      }

      // Create the product with validated data
      const product = await Product.create({
        name,
        description,
        price,
        mrp,
        discount,
        stock,
        images,
        categoryId,
        createdBy,
        details,
        isOutOfStock: stock <= 0,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ 
        message: 'Error creating product',
        details: error.message 
      });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      await product.update(req.body);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Error updating product' });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      await product.update({ isActive: false });
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Error deleting product' });
    }
  },

  bulkUploadProducts: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const filePath = req.file.path;
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);

      // Default admin UUID (replace with your actual admin UUID if needed)
      const DEFAULT_ADMIN_ID = '11111111-1111-1111-1111-111111111111';

      // Map rows to product fields (adjust as needed)
      const products = rows.map((row) => ({
        id: row.id || undefined,
        name: row.name || row.Name,
        description: row.description || row.Description || '',
        price: Number(row.price || row.Price || 0),
        discount: Number(row.discount || row.Discount || 0),
        stock: Number(row.stock || row.Stock || 0),
        images: row.images ? (typeof row.images === 'string' ? row.images.split(',') : row.images) : [],
        isOutOfStock: row.isOutOfStock === true || row.isOutOfStock === 'TRUE' || row.stock === 0 || row.Stock === 0,
        isActive: row.isActive !== false && row.isActive !== 'FALSE',
        categoryId: row.categoryId || row.category_id || row.CategoryId || null,
        createdBy: row.createdBy || row.created_by || DEFAULT_ADMIN_ID,
      }));

      await Product.bulkCreate(products);
      fs.unlinkSync(filePath);
      res.json({ message: 'Products uploaded successfully', count: products.length });
    } catch (error) {
      console.error('Error bulk uploading products:', error);
      if (error.stack) console.error(error.stack);
      res.status(500).json({ message: 'Error bulk uploading products', error: error.message });
    }
  },

  getProductDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id, {
        include: [
          { model: db.Variant, as: 'variants' },
          { model: db.Review, as: 'reviews' },
        ],
      });
      if (!product) return res.status(404).json({ message: 'Product not found' });

      // --- Similar Products: same category, exclude current ---
      const similarProducts = await Product.findAll({
        where: {
          categoryId: product.categoryId,
          id: { [db.Sequelize.Op.ne]: product.id },
          isActive: true,
        },
        limit: 10,
      });

      // --- Bought Together: products from same orders ---
      // 1. Find all orderIds where this product was bought
      const orderItems = await db.OrderItem.findAll({
        where: { productId: product.id },
        attributes: ['orderId'],
      });
      const orderIds = orderItems.map(oi => oi.orderId);
      let boughtTogether = [];
      if (orderIds.length > 0) {
        // 2. Find all products in those orders, excluding this product
        const boughtItems = await db.OrderItem.findAll({
          where: {
            orderId: { [db.Sequelize.Op.in]: orderIds },
            productId: { [db.Sequelize.Op.ne]: product.id },
          },
          attributes: ['productId'],
          group: ['productId'],
          limit: 10,
        });
        const boughtProductIds = boughtItems.map(bi => bi.productId);
        boughtTogether = await Product.findAll({
          where: {
            id: { [db.Sequelize.Op.in]: boughtProductIds },
            isActive: true,
          },
          limit: 10,
        });
      }
      // Fallback: if no bought together, use similar products
      if (boughtTogether.length === 0) {
        boughtTogether = similarProducts.slice(0, 5);
      }

      res.json({
        product,
        variants: product.variants,
        similarProducts,
        boughtTogether,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = productController; 