const { Category } = require('../models');
const { emitToRole } = require('../socket');
const { ExpoPushToken } = require('../models');
// Removed old push service - using FCM instead

const categoryController = {
  getCategories: async (req, res) => {
    try {
      const categories = await Category.findAll({
        where: { isActive: true }
      });
      res.json({ categories, totalCategories: categories.length });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
  },

  getCategoryById: async (req, res) => {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
  },

  createCategory: async (req, res) => {
    try {
      const { name } = req.body;
      const category = await Category.create({ name });
      // Real-time: notify admins
      emitToRole('admin', 'category_created', { categoryId: category.id });
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Error creating category', error: error.message });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      await category.update(req.body);
      // Real-time: notify admins
      emitToRole('admin', 'category_updated', { categoryId: category.id });
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Error updating category', error: error.message });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      await category.update({ isActive: false });
      // Real-time: notify admins
      emitToRole('admin', 'category_deleted', { categoryId: category.id });
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
  },

  getSubCategories: async (req, res) => {
    try {
      const parentId = req.params.id;
      const subCategories = await Category.findAll({
        where: { parentId, isActive: true }
      });
      res.json(subCategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
    }
  }
};

module.exports = categoryController; 