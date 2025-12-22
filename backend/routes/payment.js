const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/database');
const { momoConfig, createSignature, generateRequestId, generateOrderId } = require('../config/momo');

// ==========================================
// TẠO THANH TOÁN MOMO
// ==========================================
router.post('/momo/create', async (req, res) => {
    try {
        const { orderId, amount, orderInfo } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông tin đơn hàng' 
            });
        }

        const requestId = generateRequestId();
        const momoOrderId = generateOrderId(orderId);
        const orderInfoText = orderInfo || `Thanh toán đơn hàng #${orderId} - Yến Nhi Tech`;

        // Tạo raw signature theo format MoMo yêu cầu
        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=&ipnUrl=${momoConfig.ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfoText}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;

        const signature = createSignature(rawSignature);

        // Request body gửi đến MoMo
        const requestBody = {
            partnerCode: momoConfig.partnerCode,
            partnerName: 'Yến Nhi Tech',
            storeId: 'YenNhiTechStore',
            requestId: requestId,
            amount: amount,
            orderId: momoOrderId,
            orderInfo: orderInfoText,
            redirectUrl: momoConfig.redirectUrl,
            ipnUrl: momoConfig.ipnUrl,
            lang: 'vi',
            requestType: momoConfig.requestType,
            autoCapture: true,
            extraData: '',
            signature: signature
        };

        console.log('🔵 MoMo Request:', JSON.stringify(requestBody, null, 2));

        // Gọi API MoMo
        const response = await axios.post(momoConfig.endpoint, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('🟢 MoMo Response:', JSON.stringify(response.data, null, 2));

        if (response.data.resultCode === 0) {
            // Lưu thông tin giao dịch vào database
            await db.query(`
                UPDATE thanh_toan 
                SET ma_giao_dich = ?, trang_thai = 'cho_thanh_toan'
                WHERE ma_don_hang = ?
            `, [momoOrderId, orderId]);

            res.json({
                success: true,
                data: {
                    payUrl: response.data.payUrl,
                    deeplink: response.data.deeplink,
                    qrCodeUrl: response.data.qrCodeUrl,
                    orderId: momoOrderId,
                    requestId: requestId
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.data.message || 'Không thể tạo thanh toán MoMo',
                resultCode: response.data.resultCode
            });
        }

    } catch (error) {
        console.error('❌ MoMo Create Error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi kết nối đến MoMo',
            error: error.response?.data || error.message
        });
    }
});

// ==========================================
// CALLBACK TỪ MOMO (Redirect URL)
// ==========================================
router.get('/momo/callback', async (req, res) => {
    try {
        console.log('🔵 MoMo Callback:', req.query);

        const { 
            partnerCode, orderId, requestId, amount, 
            orderInfo, orderType, transId, resultCode, 
            message, payType, responseTime, extraData, signature 
        } = req.query;

        // Verify signature
        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData || ''}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        
        const expectedSignature = createSignature(rawSignature);

        if (signature !== expectedSignature) {
            console.error('❌ Invalid signature');
            return res.redirect(`/pages/payment-result.html?status=error&message=Invalid signature`);
        }

        // Lấy orderId gốc từ momoOrderId (format: YNT{orderId}_{timestamp})
        const originalOrderId = orderId.split('_')[0].replace('YNT', '');

        if (resultCode === '0') {
            // Thanh toán thành công
            await db.query(`
                UPDATE don_hang 
                SET trang_thai_thanh_toan = 'da_thanh_toan'
                WHERE ma_don_hang = ?
            `, [originalOrderId]);

            await db.query(`
                UPDATE thanh_toan 
                SET trang_thai = 'thanh_cong', ma_giao_dich = ?
                WHERE ma_don_hang = ?
            `, [transId, originalOrderId]);

            console.log('✅ Payment success for order:', originalOrderId);
            
            // Redirect về trang kết quả thanh toán
            res.redirect(`/pages/payment-result.html?status=success&orderId=${originalOrderId}&transId=${transId}`);
        } else {
            // Thanh toán thất bại
            await db.query(`
                UPDATE thanh_toan 
                SET trang_thai = 'that_bai'
                WHERE ma_don_hang = ?
            `, [originalOrderId]);

            console.log('❌ Payment failed for order:', originalOrderId, 'Message:', message);
            
            res.redirect(`/pages/payment-result.html?status=failed&orderId=${originalOrderId}&message=${encodeURIComponent(message)}`);
        }

    } catch (error) {
        console.error('❌ MoMo Callback Error:', error);
        res.redirect(`/pages/payment-result.html?status=error&message=${encodeURIComponent('Lỗi xử lý thanh toán')}`);
    }
});

// ==========================================
// IPN (Instant Payment Notification) từ MoMo
// ==========================================
router.post('/momo/ipn', async (req, res) => {
    try {
        console.log('🔵 MoMo IPN:', req.body);

        const { 
            partnerCode, orderId, requestId, amount, 
            orderInfo, orderType, transId, resultCode, 
            message, payType, responseTime, extraData, signature 
        } = req.body;

        // Verify signature
        const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData || ''}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        
        const expectedSignature = createSignature(rawSignature);

        if (signature !== expectedSignature) {
            console.error('❌ IPN Invalid signature');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        // Lấy orderId gốc
        const originalOrderId = orderId.split('_')[0].replace('YNT', '');

        if (resultCode === 0) {
            // Cập nhật trạng thái thanh toán
            await db.query(`
                UPDATE don_hang 
                SET trang_thai_thanh_toan = 'da_thanh_toan'
                WHERE ma_don_hang = ?
            `, [originalOrderId]);

            await db.query(`
                UPDATE thanh_toan 
                SET trang_thai = 'thanh_cong', ma_giao_dich = ?
                WHERE ma_don_hang = ?
            `, [transId, originalOrderId]);

            console.log('✅ IPN: Payment confirmed for order:', originalOrderId);
        }

        // Trả về response cho MoMo
        res.status(204).send();

    } catch (error) {
        console.error('❌ MoMo IPN Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// KIỂM TRA TRẠNG THÁI THANH TOÁN
// ==========================================
router.get('/momo/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        const [payments] = await db.query(`
            SELECT tt.*, dh.trang_thai_thanh_toan
            FROM thanh_toan tt
            JOIN don_hang dh ON tt.ma_don_hang = dh.ma_don_hang
            WHERE tt.ma_don_hang = ?
        `, [orderId]);

        if (payments.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy thông tin thanh toán' 
            });
        }

        res.json({
            success: true,
            data: payments[0]
        });

    } catch (error) {
        console.error('Check payment status error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
