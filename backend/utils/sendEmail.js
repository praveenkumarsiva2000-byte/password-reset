/**
 * utils/sendEmail.js
 * Configures Nodemailer transport and exports a helper to send emails.
 * Uses SMTP settings from environment variables.
 */

const nodemailer = require("nodemailer");

/**
 * Creates and returns a Nodemailer transporter using env-based SMTP config.
 * Supports Gmail, SendGrid, Mailgun, etc.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs in dev
    },
  });
};

/**
 * sendPasswordResetEmail
 * Sends a styled HTML email containing the password reset link.
 *
 * @param {string} toEmail  - Recipient's email address
 * @param {string} toName   - Recipient's display name
 * @param {string} resetURL - Full reset URL with the token embedded
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (toEmail, toName, resetURL) => {
  const transporter = createTransporter();

  // Calculate expiry display (in hours)
  const expiryMs = parseInt(process.env.RESET_TOKEN_EXPIRY) || 3600000;
  const expiryHours = Math.round(expiryMs / 3600000);

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Password Reset" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔐 Password Reset Request",
    // Plain text fallback
    text: `Hi ${toName},\n\nYou requested a password reset.\n\nClick the link to reset your password:\n${resetURL}\n\nThis link expires in ${expiryHours} hour(s).\n\nIf you didn't request this, ignore this email.\n\nRegards,\nThe Support Team`,
    // Styled HTML email
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Password Reset</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f0f4f8;
              color: #333;
            }
            .wrapper {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            }
            .header {
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header .icon {
              font-size: 48px;
              display: block;
              margin-bottom: 16px;
            }
            .header h1 {
              color: #ffffff;
              font-size: 26px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .header p {
              color: #a0b4cc;
              font-size: 14px;
              margin-top: 6px;
            }
            .body {
              padding: 40px 36px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 600;
              color: #1a1a2e;
              margin-bottom: 14px;
            }
            .message {
              color: #555;
              font-size: 15px;
              line-height: 1.7;
              margin-bottom: 30px;
            }
            .btn-container {
              text-align: center;
              margin-bottom: 30px;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #e94560, #c73652);
              color: #ffffff !important;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 700;
              letter-spacing: 0.5px;
              transition: all 0.3s;
            }
            .divider {
              border: none;
              border-top: 1px solid #e8edf2;
              margin: 28px 0;
            }
            .link-fallback {
              background: #f7f9fc;
              border: 1px solid #e0e7ef;
              border-radius: 8px;
              padding: 16px;
              word-break: break-all;
              font-size: 13px;
              color: #0f3460;
            }
            .expiry-note {
              background: #fff8e1;
              border-left: 4px solid #f5a623;
              border-radius: 4px;
              padding: 12px 16px;
              margin-top: 20px;
              font-size: 13px;
              color: #7a5c00;
            }
            .footer {
              background: #f7f9fc;
              padding: 24px 36px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #e8edf2;
            }
            .footer a { color: #0f3460; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <span class="icon">🔐</span>
              <h1>Password Reset Request</h1>
              <p>We received a request to reset your password</p>
            </div>
            <div class="body">
              <p class="greeting">Hi ${toName},</p>
              <p class="message">
                Someone (hopefully you!) requested a password reset for your account.
                Click the button below to choose a new password. If you didn't make
                this request, you can safely ignore this email — your password won't change.
              </p>
              <div class="btn-container">
                <a href="${resetURL}" class="btn">Reset My Password</a>
              </div>
              <hr class="divider" />
              <p style="font-size:13px; color:#777; margin-bottom:10px;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <div class="link-fallback">${resetURL}</div>
              <div class="expiry-note">
                ⏰ <strong>This link expires in ${expiryHours} hour(s).</strong>
                After that, you'll need to request a new reset link.
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Password Reset App. All rights reserved.</p>
              <p style="margin-top:6px;">
                If you have any issues, <a href="mailto:${process.env.EMAIL_USER}">contact support</a>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  // Send the email via configured transporter
  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Password reset email sent to ${toEmail} | MessageId: ${info.messageId}`);
};

module.exports = { sendPasswordResetEmail };
