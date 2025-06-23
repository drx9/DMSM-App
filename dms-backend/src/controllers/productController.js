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
        where.name = { [Op.iLike]: `%${search}%` };
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
      const product = await Product.findByPk(req.params.id, {
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
      const product = await Product.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Error creating product' });
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
      fs.unlinkSync(filePath); // Clean up uploaded file
      res.json({ message: 'Products uploaded successfully', count: products.length });
    } catch (error) {
      console.error('Error bulk uploading products:', error);
      res.status(500).json({ message: 'Error bulk uploading products' });
    }
  }
};

module.exports = productController; 