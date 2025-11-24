import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/*
 * Send an email (OTP for password reset in this case)
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject (optional)
 * @param {string} params.text - Plain text body (optional)
 * @param {string} params.html - HTML body (optional)
 * @param {string} params.otp - OTP to be included in email
 */

export const sendEmail = async ({ to, subject, html, otp }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Set default subject if not provided
    const mailSubject = subject || "Password Reset OTP";

    // Set default email body if not provided
    const mailText = `Your OTP for resetting the password is ${otp}. It expires in 10 minutes.`;

    const mailHtml = html || `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Password Reset OTP</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Your OTP is:</p>
        <h3 style="color: #e74c3c;">${otp}</h3>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    // Send the email
    const info = await transporter.sendMail({
      from: `"Hashtago" <${process.env.SMTP_USER}>`,
      to,
      subject: mailSubject,
      text: mailText,
      html: mailHtml,
    });

    console.log(`✅ Email sent to ${to}`);

    console.log("✅ Email accepted by SMTP:", {
      to,
      messageId: info.messageId,
      response: info.response,
    });
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
};
