const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

const payment = new Payment(client);
const preference = new Preference(client);

/**
 * Create a PIX payment
 */
async function createPixPayment(data) {
  try {
    const paymentData = {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: 'pix',
      payer: {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        identification: {
          type: data.identificationType || 'CPF',
          number: data.identificationNumber
        }
      },
      notification_url: `${process.env.APP_URL}/api/payments/webhook`,
      metadata: data.metadata || {}
    };

    const response = await payment.create({ body: paymentData });
    
    return {
      id: response.id,
      status: response.status,
      qrCode: response.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
      ticketUrl: response.point_of_interaction?.transaction_data?.ticket_url
    };
  } catch (error) {
    console.error('Error creating PIX payment:', error);
    throw error;
  }
}

/**
 * Create a credit card payment
 */
async function createCreditCardPayment(data) {
  try {
    const paymentData = {
      transaction_amount: data.amount,
      token: data.token, // Card token from frontend
      description: data.description,
      installments: data.installments || 1,
      payment_method_id: data.paymentMethodId,
      issuer_id: data.issuerId,
      payer: {
        email: data.email,
        identification: {
          type: data.identificationType || 'CPF',
          number: data.identificationNumber
        }
      },
      notification_url: `${process.env.APP_URL}/api/payments/webhook`,
      metadata: data.metadata || {}
    };

    const response = await payment.create({ body: paymentData });
    
    return {
      id: response.id,
      status: response.status,
      statusDetail: response.status_detail,
      authorizationCode: response.authorization_code
    };
  } catch (error) {
    console.error('Error creating credit card payment:', error);
    throw error;
  }
}

/**
 * Create a payment preference (for checkout)
 */
async function createPaymentPreference(data) {
  try {
    const preferenceData = {
      items: [
        {
          title: data.title,
          quantity: 1,
          unit_price: data.amount,
          currency_id: 'BRL'
        }
      ],
      payer: {
        email: data.email,
        name: data.name
      },
      back_urls: {
        success: `${process.env.APP_URL}/payment/success`,
        failure: `${process.env.APP_URL}/payment/failure`,
        pending: `${process.env.APP_URL}/payment/pending`
      },
      auto_return: 'approved',
      notification_url: `${process.env.APP_URL}/api/payments/webhook`,
      metadata: data.metadata || {}
    };

    const response = await preference.create({ body: preferenceData });
    
    return {
      id: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    };
  } catch (error) {
    console.error('Error creating payment preference:', error);
    throw error;
  }
}

/**
 * Get payment details
 */
async function getPaymentDetails(paymentId) {
  try {
    const response = await payment.get({ id: paymentId });
    return response;
  } catch (error) {
    console.error('Error getting payment details:', error);
    throw error;
  }
}

/**
 * Refund a payment
 */
async function refundPayment(paymentId) {
  try {
    const response = await payment.refund({ id: paymentId });
    return response;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
}

module.exports = {
  createPixPayment,
  createCreditCardPayment,
  createPaymentPreference,
  getPaymentDetails,
  refundPayment
};
