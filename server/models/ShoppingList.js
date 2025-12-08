const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  unit: {
    type: String,
    default: 'un',
    trim: true
  },
  category: {
    type: String,
    default: 'Outros',
    trim: true
  },
  price: {
    type: Number,
    default: 0
  },
  checked: {
    type: Boolean,
    default: false
  },
  notes: String
});

const shoppingListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  items: [itemSchema],
  totalEstimated: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
shoppingListSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total estimated price
shoppingListSchema.methods.calculateTotal = function() {
  this.totalEstimated = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  return this.totalEstimated;
};

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
