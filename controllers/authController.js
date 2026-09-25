/**
 * Auth Controller for Vendor SaaS 2FA/3FA Architecture
 * Features TOTP (Google Authenticator) with otplib, SMS OTP Gateway, and IP Whitelisting
 */

const { generateSecret, generateURI, verifySync } = require("otplib");
const QRCode = require("qrcode");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendOtpSMS, generateNumericOtp, maskPhoneNumber } = require("../utils/smsService");

/**
 * Generate TOTP secret and QR code for Google Authenticator
 */
async function generateTotpSetup(email, issuer = "Vendor SaaS Licensing") {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer,
    label: email,
    secret,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  const backupCodes = [];
  for (let i = 0; i < 8; i++) {
    const raw = crypto.randomBytes(4).toString("hex").toUpperCase();
    backupCodes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
    backupCodes,
  };
}

/**
 * Verify a 6-digit TOTP code against a secret
 */
function verifyTotpToken(token, secret) {
  try {
    const cleanToken = String(token).replace(/\s+/g, "").trim();
    const result = verifySync({
      token: cleanToken,
      secret,
      epochTolerance: 30,
    });
    return !!(result && result.valid);
  } catch (err) {
    return false;
  }
}

/**
 * Send SMS OTP using the SMS service utility
 */
async function sendSmsOtp(phoneNumber, appName = "Vendor SaaS") {
  const otp = generateNumericOtp(6);
  const result = await sendOtpSMS(phoneNumber, otp, appName);
  return {
    ...result,
    otp, // For verification / internal storage
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };
}

module.exports = {
  generateTotpSetup,
  verifyTotpToken,
  sendSmsOtp,
  maskPhoneNumber,
  generateNumericOtp,
};
