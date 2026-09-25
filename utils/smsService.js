/**
 * SMS Service Utility for Vendor SaaS 2FA OTP Gateway
 * Supports HTTP API SMS Gateways with fallback to simulation mode for development/testing.
 */

const crypto = require("crypto");

/**
 * Configuration from environment variables
 */
const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL || "";
const SMS_API_KEY = process.env.SMS_API_KEY || "";
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || "VendorSaaS";
const SMS_ENABLED = process.env.SMS_ENABLED !== "false"; // Default true

/**
 * Generate a cryptographically secure 6-digit numeric OTP code
 * @param {number} length
 * @returns {string}
 */
function generateNumericOtp(length = 6) {
  const digits = "0123456789";
  let otp = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
}

/**
 * Format and mask a phone number for UI display
 * e.g. "+8801712345678" -> "+880 17****5678"
 * @param {string} phone
 * @returns {string}
 */
function maskPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.length < 8) return cleaned;
  const start = cleaned.slice(0, cleaned.startsWith("+") ? 6 : 4);
  const end = cleaned.slice(-4);
  return `${start}****${end}`;
}

/**
 * Normalize phone number format (E.164 standard)
 * @param {string} phone
 * @returns {string}
 */
function normalizePhoneNumber(phone) {
  if (!phone) return "";
  let cleaned = phone.trim().replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("01") && cleaned.length === 11) {
    cleaned = `+880${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("880") && !cleaned.startsWith("+880")) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

/**
 * Send an SMS message via HTTP API Gateway
 * @param {Object} params
 * @param {string} params.to - Recipient phone number
 * @param {string} params.message - SMS body text
 * @param {string} [params.senderId] - Custom sender ID
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, simulated?: boolean }>}
 */
async function sendSMS({ to, message, senderId = SMS_SENDER_ID }) {
  const recipient = normalizePhoneNumber(to);
  if (!recipient) {
    return { success: false, error: "Valid recipient phone number is required" };
  }

  // If SMS Gateway API is not configured or in development mode -> Simulation Mode
  if (!SMS_GATEWAY_URL || !SMS_API_KEY) {
    console.log("📱 ========================================================");
    console.log("📱 [SIMULATED SMS GATEWAY] Outgoing Message Dispatched");
    console.log(`📱 Recipient: ${recipient} (${maskPhoneNumber(recipient)})`);
    console.log(`📱 Sender ID : ${senderId}`);
    console.log(`📱 Body      : ${message}`);
    console.log("📱 ========================================================");

    return {
      success: true,
      simulated: true,
      messageId: `SIM-SMS-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      maskedPhone: maskPhoneNumber(recipient),
    };
  }

  // Real HTTP Gateway Dispatch (supports standard JSON POST)
  try {
    const response = await fetch(SMS_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SMS_API_KEY}`,
      },
      body: JSON.stringify({
        apiKey: SMS_API_KEY,
        senderId: senderId,
        to: recipient,
        message: message,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: data.message || `SMS Gateway Error (${response.status})`,
      };
    }

    return {
      success: true,
      messageId: data.messageId || data.id || `SMS-${Date.now()}`,
      maskedPhone: maskPhoneNumber(recipient),
    };
  } catch (err) {
    console.error("❌ SMS Gateway Connection Failure:", err);
    return {
      success: false,
      error: err.message || "Failed to connect to SMS Gateway",
    };
  }
}

/**
 * Send a 2FA OTP verification code via SMS
 * @param {string} phoneNumber
 * @param {string} otpCode
 * @param {string} [appName]
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, simulated?: boolean, maskedPhone?: string }>}
 */
async function sendOtpSMS(phoneNumber, otpCode, appName = "Vendor SaaS") {
  const message = `[${appName}] Your 2-Factor Authentication OTP code is ${otpCode}. Valid for 5 minutes. Do NOT share this code with anyone.`;
  return sendSMS({
    to: phoneNumber,
    message,
    senderId: SMS_SENDER_ID,
  });
}

module.exports = {
  sendSMS,
  sendOtpSMS,
  generateNumericOtp,
  maskPhoneNumber,
  normalizePhoneNumber,
};
