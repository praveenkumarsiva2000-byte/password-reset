const https = require("https");

const sendPasswordResetEmail = async (toEmail, toName, resetURL) => {
  const expiryHours = Math.round(
    (parseInt(process.env.RESET_TOKEN_EXPIRY) || 3600000) / 3600000
  );

  const data = JSON.stringify({
    sender: { name: "Password Reset", email: process.env.EMAIL_USER },
    to: [{ email: toEmail, name: toName }],
    subject: "🔐 Password Reset Request",
    htmlContent: `<h2>Hi ${toName},</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${resetURL}" style="background:#e94560;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin:20px 0;">Reset My Password</a>
      <p>This link expires in <strong>${expiryHours} hour(s)</strong>.</p>
      <p>If you didn't request this, ignore this email.</p>`,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        "content-length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode === 201) {
          console.log(`📧 Email sent to ${toEmail}`);
          resolve(body);
        } else {
          reject(new Error(`Brevo API error: ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
};

module.exports = { sendPasswordResetEmail };