const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

const checkSubscription = (requiredPlan) => {
  return (req, res, next) => {
    const planLevels = { free: 0, basic: 1, premium: 2 };
    const userPlanLevel = planLevels[req.user.subscription.plan];
    const requiredPlanLevel = planLevels[requiredPlan];

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({ 
        error: 'Subscription upgrade required',
        currentPlan: req.user.subscription.plan,
        requiredPlan
      });
    }

    if (req.user.subscription.status !== 'active' && req.user.subscription.plan !== 'free') {
      return res.status(403).json({ 
        error: 'Subscription is not active',
        status: req.user.subscription.status
      });
    }

    next();
  };
};

module.exports = { authMiddleware, checkSubscription };
