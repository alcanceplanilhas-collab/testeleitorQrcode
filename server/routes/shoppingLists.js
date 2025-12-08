const express = require('express');
const ShoppingList = require('../models/ShoppingList');
const { authMiddleware, checkSubscription } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Get all shopping lists for the current user
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.userId };
    
    if (status) {
      filter.status = status;
    }

    const lists = await ShoppingList.find(filter).sort({ updatedAt: -1 });

    res.json({
      lists,
      total: lists.length
    });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ error: 'Failed to get shopping lists' });
  }
});

/**
 * Get a specific shopping list
 */
router.get('/:id', async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    res.json({ list });
  } catch (error) {
    console.error('Get list error:', error);
    res.status(500).json({ error: 'Failed to get shopping list' });
  }
});

/**
 * Create a new shopping list
 */
router.post('/', async (req, res) => {
  try {
    const { name, items } = req.body;

    // Check list limit for free users
    if (req.user.subscription.plan === 'free') {
      const listCount = await ShoppingList.countDocuments({
        userId: req.userId,
        status: 'active'
      });

      if (listCount >= 3) {
        return res.status(403).json({
          error: 'Free plan allows maximum 3 active lists. Please upgrade your plan.',
          limit: 3,
          currentCount: listCount
        });
      }
    }

    const list = new ShoppingList({
      userId: req.userId,
      name,
      items: items || []
    });

    list.calculateTotal();
    await list.save();

    res.status(201).json({
      message: 'Shopping list created successfully',
      list
    });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Failed to create shopping list' });
  }
});

/**
 * Update a shopping list
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, items, status } = req.body;

    const list = await ShoppingList.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    if (name) list.name = name;
    if (items) list.items = items;
    if (status) list.status = status;

    list.calculateTotal();
    await list.save();

    res.json({
      message: 'Shopping list updated successfully',
      list
    });
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ error: 'Failed to update shopping list' });
  }
});

/**
 * Delete a shopping list
 */
router.delete('/:id', async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    res.json({ message: 'Shopping list deleted successfully' });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ error: 'Failed to delete shopping list' });
  }
});

/**
 * Add item to shopping list
 */
router.post('/:id/items', async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    // Check item limit for free users
    if (req.user.subscription.plan === 'free' && list.items.length >= 20) {
      return res.status(403).json({
        error: 'Free plan allows maximum 20 items per list. Please upgrade your plan.',
        limit: 20,
        currentCount: list.items.length
      });
    }

    list.items.push(req.body);
    list.calculateTotal();
    await list.save();

    res.json({
      message: 'Item added successfully',
      list
    });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

/**
 * Update item in shopping list
 */
router.put('/:id/items/:itemId', async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    const item = list.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    Object.assign(item, req.body);
    list.calculateTotal();
    await list.save();

    res.json({
      message: 'Item updated successfully',
      list
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

/**
 * Delete item from shopping list
 */
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    list.items.pull(req.params.itemId);
    list.calculateTotal();
    await list.save();

    res.json({
      message: 'Item deleted successfully',
      list
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
