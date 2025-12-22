// MoMo Payment Configuration
// Sử dụng môi trường test của MoMo

const crypto = require('crypto');

const momoConfig = {
    // Thông tin test từ MoMo Developer
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
    accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    
    // Endpoints
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    
    // URLs callback
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3300/api/payment/momo/callback',
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3300/api/payment/momo/ipn',
    
    // Request type
    requestType: 'payWithMethod'
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
