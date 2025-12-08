const express = require('express');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const mercadoPagoService = require('../services/mercadoPagoService');

const router = express.Router();

// Plan pricing
const PLANS = {
  basic: {
    name: 'Basic',
    price: 19.90,
    features: ['Up to 10 active lists', 'Up to 50 items per list', 'Basic support']
  },
  premium: {
    name: 'Premium',
    price: 39.90,
    features: ['Unlimited active lists', 'Unlimited items', 'Priority support', 'Advanced analytics']
  }
};

/**
 * Get available plans
 */
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

/**
 * Create PIX payment
 */
router.post('/pix', authMiddleware, async (req, res) => {
  try {
    const { plan, identificationNumber } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const amount = PLANS[plan].price;
    const description = `Subscription ${PLANS[plan].name} - ${req.user.name}`;

    // Create PIX payment with Mercado Pago
    const paymentResponse = await mercadoPagoService.createPixPayment({
      amount,
      description,
      email: req.user.email,
      firstName: req.user.name.split(' ')[0],
      lastName: req.user.name.split(' ').slice(1).join(' ') || 'User',
      identificationType: 'CPF',
      identificationNumber,
      metadata: {
        userId: req.user._id.toString(),
        plan
      }
    });

    // Save payment to database
    const payment = new Payment({
      userId: req.user._id,
      mercadoPagoId: paymentResponse.id,
      amount,
      paymentMethod: 'pix',
      status: paymentResponse.status,
      description,
      plan,
      pixQrCode: paymentResponse.qrCode,
      pixQrCodeBase64: paymentResponse.qrCodeBase64
    });

    await payment.save();

    res.json({
      message: 'PIX payment created successfully',
      payment: {
        id: payment._id,
        mercadoPagoId: payment.mercadoPagoId,
        amount: payment.amount,
        status: payment.status,
        qrCode: payment.pixQrCode,
        qrCodeBase64: payment.pixQrCodeBase64
      }
    });
  } catch (error) {
    console.error('PIX payment error:', error);
    res.status(500).json({ error: 'Failed to create PIX payment' });
  }
});

/**
 * Create credit card payment
 */
router.post('/credit-card', authMiddleware, async (req, res) => {
  try {
    const { plan, token, paymentMethodId, issuerId, installments, identificationNumber } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const amount = PLANS[plan].price;
    const description = `Subscription ${PLANS[plan].name} - ${req.user.name}`;

    // Create credit card payment with Mercado Pago
    const paymentResponse = await mercadoPagoService.createCreditCardPayment({
      amount,
      token,
      description,
      installments: installments || 1,
      paymentMethodId,
      issuerId,
      email: req.user.email,
      identificationType: 'CPF',
      identificationNumber,
      metadata: {
        userId: req.user._id.toString(),
        plan
      }
    });

    // Save payment to database
    const payment = new Payment({
      userId: req.user._id,
      mercadoPagoId: paymentResponse.id,
      amount,
      paymentMethod: 'credit_card',
      status: paymentResponse.status,
      description,
      plan,
      metadata: {
        statusDetail: paymentResponse.statusDetail,
        authorizationCode: paymentResponse.authorizationCode
      }
    });

    await payment.save();

    // If payment approved, update user subscription
    if (paymentResponse.status === 'approved') {
      await updateUserSubscription(req.user._id, plan, payment.mercadoPagoId);
    }

    res.json({
      message: 'Credit card payment created successfully',
      payment: {
        id: payment._id,
        mercadoPagoId: payment.mercadoPagoId,
        amount: payment.amount,
        status: payment.status,
        statusDetail: paymentResponse.statusDetail
      }
    });
  } catch (error) {
    console.error('Credit card payment error:', error);
    res.status(500).json({ error: 'Failed to create credit card payment' });
  }
});

/**
 * Create payment preference (checkout link)
 */
router.post('/preference', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const amount = PLANS[plan].price;
    const title = `Subscription ${PLANS[plan].name}`;

    // Create payment preference
    const preference = await mercadoPagoService.createPaymentPreference({
      title,
      amount,
      email: req.user.email,
      name: req.user.name,
      metadata: {
        userId: req.user._id.toString(),
        plan
      }
    });

    res.json({
      message: 'Payment preference created successfully',
      preferenceId: preference.id,
      initPoint: preference.initPoint,
      sandboxInitPoint: preference.sandboxInitPoint
    });
  } catch (error) {
    console.error('Preference creation error:', error);
    res.status(500).json({ error: 'Failed to create payment preference' });
  }
});

/**
 * Get payment status
 */
router.get('/:paymentId/status', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      userId: req.user._id
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Get updated status from Mercado Pago
    try {
      const mpPayment = await mercadoPagoService.getPaymentDetails(payment.mercadoPagoId);
      
      if (mpPayment.status !== payment.status) {
        payment.status = mpPayment.status;
        await payment.save();

        // Update subscription if payment approved
        if (mpPayment.status === 'approved' && payment.plan) {
          await updateUserSubscription(req.user._id, payment.plan, payment.mercadoPagoId);
        }
      }
    } catch (error) {
      console.error('Error fetching MP payment status:', error);
    }

    res.json({
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        plan: payment.plan,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

/**
 * Webhook endpoint for Mercado Pago notifications
 */
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;

      // Get payment details from Mercado Pago
      const mpPayment = await mercadoPagoService.getPaymentDetails(paymentId);

      // Find payment in database
      const payment = await Payment.findOne({ mercadoPagoId: paymentId });

      if (payment) {
        payment.status = mpPayment.status;
        await payment.save();

        // Update user subscription if payment approved
        if (mpPayment.status === 'approved' && payment.plan) {
          await updateUserSubscription(payment.userId, payment.plan, payment.mercadoPagoId);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Get user payment history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-pixQrCode -pixQrCodeBase64');

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

/**
 * Helper function to update user subscription
 */
async function updateUserSubscription(userId, plan, mercadoPagoId) {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

  user.subscription = {
    plan,
    status: 'active',
    startDate: now,
    endDate,
    mercadoPagoSubscriptionId: mercadoPagoId
  };

  await user.save();
}

module.exports = router;
