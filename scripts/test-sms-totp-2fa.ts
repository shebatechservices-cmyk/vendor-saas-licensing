import { generateSync } from "otplib";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

// Test direct imports of utils/smsService and controllers/authController
const { sendOtpSMS, generateNumericOtp, maskPhoneNumber } = require("../utils/smsService");
const { generateTotpSetup, verifyTotpToken, sendSmsOtp } = require("../controllers/authController");

async function runTests() {
  console.log("📱 ========================================================");
  console.log("📱 STARTING 2FA MODULE & SMS SERVICE VERIFICATION");
  console.log("📱 ========================================================\n");

  // TEST 1: Unit Test SMS Service Utility (utils/smsService.js)
  console.log("👉 TEST 1: Unit Test SMS Service Utility (utils/smsService.js)");
  const sampleOtp = generateNumericOtp(6);
  console.log(`   Generated Numeric OTP: ${sampleOtp}`);
  if (!sampleOtp || sampleOtp.length !== 6 || !/^\d{6}$/.test(sampleOtp)) {
    throw new Error("Test 1 Failed: Invalid numeric OTP format");
  }

  const masked = maskPhoneNumber("+8801712345678");
  console.log(`   Masked Phone (+8801712345678) -> ${masked}`);
  if (!masked.includes("****")) {
    throw new Error("Test 1 Failed: Phone masking incorrect");
  }

  const smsRes = await sendOtpSMS("+8801712345678", sampleOtp, "Vendor SaaS");
  console.log("   SMS Dispatch Result:", smsRes);
  if (!smsRes.success) throw new Error("Test 1 Failed: sendOtpSMS failed");
  console.log("   ✅ Test 1 Passed: SMS Service Utility verified.\n");

  // TEST 2: Unit Test controllers/authController.js
  console.log("👉 TEST 2: Unit Test controllers/authController.js");
  const totpSetup = await generateTotpSetup("admin@vendor.com", "Vendor SaaS");
  console.log("   TOTP Setup Result:", {
    hasSecret: !!totpSetup.secret,
    hasQrCode: !!totpSetup.qrCodeDataUrl,
    backupCount: totpSetup.backupCodes.length,
  });
  if (!totpSetup.secret || !totpSetup.qrCodeDataUrl || totpSetup.backupCodes.length !== 8) {
    throw new Error("Test 2 Failed: TOTP setup generation error");
  }

  const testOtp = generateSync({ secret: totpSetup.secret });
  const isTotpValid = verifyTotpToken(testOtp, totpSetup.secret);
  console.log(`   Generated Token: ${testOtp} -> Valid: ${isTotpValid}`);
  if (!isTotpValid) throw new Error("Test 2 Failed: TOTP verification failed");
  console.log("   ✅ Test 2 Passed: controllers/authController.js verified.\n");

  // Reset admin in database for clean slate
  await prisma.adminUser.updateMany({
    data: {
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_temp_secret: null,
      backup_codes: null,
      sms_otp_code: null,
      sms_otp_expires_at: null,
      phone: "+8801700000000",
      phone_verified: true,
      allowed_ips: "127.0.0.1,::1,localhost",
      ip_whitelist_enabled: false,
    },
  });

  // TEST 3: Step 1 Initial Login & Profile Fetch
  console.log("👉 TEST 3: Authenticate Step 1 & Activate 2FA");
  const loginRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@vendor.com", password: "Admin@123456" }),
  });
  const loginData1 = await loginRes1.json();
  const token = loginData1.token;

  // Setup & Confirm 2FA
  const setupApiRes = await fetch(`${BASE_URL}/api/auth/setup-2fa`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const setupApiData = await setupApiRes.json();
  const totpSecret = setupApiData.secret;

  const realOtp = generateSync({ secret: totpSecret });
  const confirmApiRes = await fetch(`${BASE_URL}/api/auth/confirm-2fa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      otp_code: realOtp,
      backup_codes: setupApiData.backupCodes,
    }),
  });
  const confirmApiData = await confirmApiRes.json();
  if (!confirmApiData.success) throw new Error("Failed to confirm 2FA");
  console.log("   ✅ Test 3 Passed: 2FA is officially enabled on Admin.\n");

  // TEST 4: Login with 2FA Challenge -> Send SMS OTP -> Verify with SMS
  console.log("👉 TEST 4: Step 2 Login via SMS OTP Gateway");
  const loginRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@vendor.com", password: "Admin@123456" }),
  });
  const loginData2 = await loginRes2.json();
  console.log("   Step 1 Response with Phone & 2FA Info:", {
    two_factor_required: loginData2.two_factor_required,
    phone_masked: loginData2.phone_masked,
    has_phone: loginData2.has_phone,
    has_totp: loginData2.has_totp,
  });

  const tempToken = loginData2.temp_token;

  // Dispatch SMS OTP
  const sendSmsRes = await fetch(`${BASE_URL}/api/auth/send-sms-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ temp_token: tempToken }),
  });
  const sendSmsData = await sendSmsRes.json();
  console.log("   Send SMS OTP API Result:", sendSmsData);
  if (!sendSmsData.success) throw new Error("Test 4 Failed: Send SMS API failed");

  // Retrieve the generated SMS OTP code from DB to simulate reception
  const updatedAdmin = await prisma.adminUser.findUnique({
    where: { email: "admin@vendor.com" },
  });
  const receivedSmsCode = updatedAdmin?.sms_otp_code;
  console.log(`   Simulated SMS Inbound Message Code: ${receivedSmsCode}`);

  // Verify using SMS code
  const verifySmsRes = await fetch(`${BASE_URL}/api/auth/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      temp_token: tempToken,
      otp_code: receivedSmsCode,
      type: "sms",
    }),
  });
  const verifySmsData = await verifySmsRes.json();
  console.log("   Verify SMS 2FA Result:", {
    status: verifySmsRes.status,
    success: verifySmsData.success,
    message: verifySmsData.message,
    hasToken: !!verifySmsData.token,
  });
  if (!verifySmsData.success || !verifySmsData.token) {
    throw new Error(`Test 4 Failed: ${verifySmsData.error}`);
  }
  console.log("   ✅ Test 4 Passed: SMS OTP Verification Succeeded.\n");

  // TEST 5: Login with 2FA Challenge -> Verify with Authenticator App TOTP
  console.log("👉 TEST 5: Step 2 Login via Authenticator App (TOTP)");
  const loginRes3 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@vendor.com", password: "Admin@123456" }),
  });
  const loginData3 = await loginRes3.json();
  const currentTotp = generateSync({ secret: totpSecret });

  const verifyTotpRes = await fetch(`${BASE_URL}/api/auth/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      temp_token: loginData3.temp_token,
      otp_code: currentTotp,
      type: "totp",
    }),
  });
  const verifyTotpData = await verifyTotpRes.json();
  console.log("   Verify TOTP Result:", {
    status: verifyTotpRes.status,
    success: verifyTotpData.success,
    message: verifyTotpData.message,
    hasToken: !!verifyTotpData.token,
  });
  if (!verifyTotpData.success) throw new Error("Test 5 Failed");
  console.log("   ✅ Test 5 Passed: Authenticator App TOTP Verification Succeeded.\n");

  // TEST 6: Update Phone Number & Preferences
  console.log("👉 TEST 6: Update Security Phone Number via API");
  const phoneUpdateRes = await fetch(`${BASE_URL}/api/auth/phone`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${verifyTotpData.token}`,
    },
    body: JSON.stringify({
      phone: "+8801812345678",
      preferred_2fa_method: "sms",
    }),
  });
  const phoneUpdateData = await phoneUpdateRes.json();
  console.log("   Phone Update Result:", phoneUpdateData);
  if (!phoneUpdateData.success || phoneUpdateData.phone !== "+8801812345678") {
    throw new Error("Test 6 Failed: Phone update failed");
  }
  console.log("   ✅ Test 6 Passed: Phone number updated successfully.\n");

  console.log("📱 ========================================================");
  console.log("🎉 ALL 2FA MODULE (SMS + TOTP + BACKUP) TESTS PASSED!");
  console.log("📱 ========================================================\n");
}

runTests()
  .catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
