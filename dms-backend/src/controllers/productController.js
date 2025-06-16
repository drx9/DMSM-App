const { Product, Category } = require('../models');
const { Op } = require('sequelize');

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
  }
};

module.exports = productController; 