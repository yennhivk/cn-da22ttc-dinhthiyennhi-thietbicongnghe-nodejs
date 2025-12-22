// MoMo Payment Configuration
// Sử dụng môi trường test của MoMo - Cập nhật 2024-2025

const crypto = require('crypto');

const momoConfig = {
    // Thông tin test mới nhất từ MoMo Developer Portal (2024-2025)
    // Nguồn: https://developers.momo.vn/v3/docs/payment/onboarding/test-instructions/
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
    accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    
    // Endpoints - sử dụng endpoint mới
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    
    // URLs callback - sử dụng frontend URL
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://127.0.0.1:5509/frontend/pages/payment-result.html',
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3300/api/payment/momo/ipn',
    
    // Request type - payWithMethod cho phép nhiều phương thức thanh toán
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
