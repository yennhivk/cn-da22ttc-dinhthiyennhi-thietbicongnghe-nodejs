const nodemailer = require('nodemailer');

// Tạo transporter để gửi email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Gửi mã OTP
async function sendOTPEmail(email, otp, userName) {
    const mailOptions = {
        from: `"Yến Nhi Tech" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Mã xác nhận đăng ký - Yến Nhi Tech',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f59e0b, #eab308); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Yến Nhi Tech</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1f2937;">Xin chào ${userName}!</h2>
                    <p style="color: #4b5563; font-size: 16px;">
                        Cảm ơn bạn đã đăng ký tài khoản tại Yến Nhi Tech. 
                        Vui lòng sử dụng mã OTP bên dưới để xác nhận email của bạn:
                    </p>
                    <div style="background: #fef3c7; border: 2px dashed #f59e0b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px;">
                        <span style="font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 8px;">${otp}</span>
                    </div>
                    <p style="color: #ef4444; font-size: 14px; text-align: center;">
                        ⏰ Mã này sẽ hết hạn sau <strong>60 giây</strong>
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">
                        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
                    </p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail };
