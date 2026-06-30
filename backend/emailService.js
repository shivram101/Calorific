// emailService.js
// Wraps SendGrid so route files don't need to know template details.
// Per course requirements: email verification + password reset must use SendGrid.

const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

async function sendVerificationEmail(toEmail, token) {
  const verifyLink = `${CLIENT_URL}/verify-email/${token}`;

  const msg = {
    to: toEmail,
    from: FROM_EMAIL,
    subject: "Verify your Calorific account",
    text: `Welcome to Calorific! Verify your email by visiting: ${verifyLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to Calorific</h2>
        <p>Please confirm your email address to activate your account.</p>
        <p>
          <a href="${verifyLink}"
             style="background:#2E7D6B;color:#fff;padding:12px 20px;
                    text-decoration:none;border-radius:6px;display:inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy this link into your browser:<br>${verifyLink}</p>
        <p style="color:#888;font-size:12px;">If you didn't create a Calorific account, you can ignore this email.</p>
      </div>
    `,
  };

  await sgMail.send(msg);
}

async function sendPasswordResetEmail(toEmail, token) {
  const resetLink = `${CLIENT_URL}/reset-password/${token}`;

  const msg = {
    to: toEmail,
    from: FROM_EMAIL,
    subject: "Reset your Calorific password",
    text: `Reset your password by visiting: ${resetLink} - This link expires in 1 hour.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your Calorific password. This link expires in 1 hour.</p>
        <p>
          <a href="${resetLink}"
             style="background:#1F3A5F;color:#fff;padding:12px 20px;
                    text-decoration:none;border-radius:6px;display:inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link into your browser:<br>${resetLink}</p>
        <p style="color:#888;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await sgMail.send(msg);
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
