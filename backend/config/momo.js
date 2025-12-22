// MoMo Payment Configuration
// Sử dụng môi trường test của MoMo

const crypto = require('crypto');

const momoConfig = {
    // Thông tin test chính thức từ MoMo Developer Portal
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMOBKUN20180529',
    accessKey: process.env.MOMO_ACCESS_KEY || 'klm05TvNBzhg7h7j',
    secretKey: process.env.MOMO_SECRET_KEY || 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa',
    
    // Endpoints
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    
    // URLs callback - sử dụng frontend URL
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://127.0.0.1:5509/frontend/pages/payment-result.html',
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3300/api/payment/momo/ipn',
    
    // Request type
    requestType: 'captureWallet'
};

// Tạo chữ ký HMAC SHA256
function createSignature(rawSignature) {
    return crypto.createHmac('sha256', momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex');
}

// Tạo request ID unique
function generateRequestId() {
    return momoConfig.partnerCode + Date.now();
}

// Tạo order ID unique
function generateOrderId(orderId) {
    return `YNT${orderId}_${Date.now()}`;
}

module.exports = {
    momoConfig,
    createSignature,
    generateRequestId,
    generateOrderId
};
