import { generateSync } from "otplib";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

async function runSecurityTests() {
  console.log("🔒 ========================================================");
  console.log("🔒 STARTING COMPREHENSIVE 2FA / 3FA SECURITY VERIFICATION");
  console.log(`🔒 Target Base URL: ${BASE_URL}`);
  console.log("🔒 ========================================================\n");

  let fullToken: string = "";
  let totpSecret: string = "";
  let backupCodes: string[] = [];

  // TEST 1: Initial Login (Step 1)
  console.log("👉 TEST 1: Master Admin Initial Login (Step 1 Credentials)");
  const loginRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@vendor.com",
      password: "Admin@123456",
    }),
  });

  const loginData1 = await loginRes1.json();
  console.log("   Login Response:", {
    status: loginRes1.status,
    success: loginData1.success,
    two_factor_required: loginData1.two_factor_required,
    clientIp: loginData1.clientIp,
  });

  if (!loginData1.success) {
    throw new Error(`Test 1 Failed: ${loginData1.error}`);
  }
  fullToken = loginData1.token || "";
  console.log("   ✅ Test 1 Passed: Initial Admin Login Authenticated.\n");

  // TEST 2: Check Current Profile (/api/auth/me)
  console.log("👉 TEST 2: Verify Profile Session (/api/auth/me)");
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${fullToken}` },
  });
  const meData = await meRes.json();
  console.log("   Profile Info:", {
    email: meData.admin?.email,
    two_factor_enabled: meData.admin?.two_factor_enabled,
    ip_whitelist_enabled: meData.admin?.ip_whitelist_enabled,
  });
  if (!meData.success) throw new Error("Test 2 Failed");
  console.log("   ✅ Test 2 Passed: Protected Session Endpoint Verified.\n");

  // TEST 3: Initiate 2FA TOTP Setup (/api/auth/setup-2fa)
  console.log("👉 TEST 3: Setup Two-Factor Authentication (TOTP Secret & QR)");
  const setupRes = await fetch(`${BASE_URL}/api/auth/setup-2fa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fullToken}`,
    },
  });
  const setupData = await setupRes.json();
  console.log("   Setup Result:", {
    success: setupData.success,
    hasSecret: !!setupData.secret,
    hasQrCode: !!setupData.qrCodeUrl,
    backupCodesCount: setupData.backupCodes?.length,
  });
  if (!setupData.success || !setupData.secret) {
    throw new Error("Test 3 Failed: No 2FA secret returned");
  }
  totpSecret = setupData.secret;
  backupCodes = setupData.backupCodes || [];
  console.log(`   Generated TOTP Secret: ${totpSecret}`);
  console.log(`   Generated Backup Codes: ${backupCodes.slice(0, 3).join(", ")}...`);
  console.log("   ✅ Test 3 Passed: 2FA Setup Initiated.\n");

  // TEST 4: Confirm 2FA Setup with Generated OTP Code
  console.log("👉 TEST 4: Confirm 2FA with Real-Time TOTP Code");
  const initialOtp = generateSync({ secret: totpSecret });
  console.log(`   Simulating Authenticator App OTP: ${initialOtp}`);

  const confirmRes = await fetch(`${BASE_URL}/api/auth/confirm-2fa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fullToken}`,
    },
    body: JSON.stringify({
      otp_code: initialOtp,
      backup_codes: backupCodes,
    }),
  });
  const confirmData = await confirmRes.json();
  console.log("   Confirm Result:", confirmData);
  if (!confirmData.success) {
    throw new Error(`Test 4 Failed: ${confirmData.error}`);
  }
  console.log("   ✅ Test 4 Passed: 2FA is Officially Enabled.\n");

  // TEST 5: Step 1 Login with 2FA Enabled -> Expects two_factor_required: true & temp_token
  console.log("👉 TEST 5: Login with 2FA Enabled (Step 1 Expects 2FA Challenge)");
  const loginRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@vendor.com",
      password: "Admin@123456",
    }),
  });
  const loginData2 = await loginRes2.json();
  console.log("   Login Step 1 Result:", {
    success: loginData2.success,
    two_factor_required: loginData2.two_factor_required,
    hasTempToken: !!loginData2.temp_token,
  });
  if (!loginData2.two_factor_required || !loginData2.temp_token) {
    throw new Error("Test 5 Failed: 2FA Challenge was not prompted");
  }
  const tempToken = loginData2.temp_token;
  console.log("   ✅ Test 5 Passed: 2FA Challenge Successfully Triggered.\n");

  // TEST 6: Step 2 2FA Verification with Invalid OTP -> Expects Failure
  console.log("👉 TEST 6: Step 2 2FA with Invalid OTP (Expects Rejection)");
  const invalidRes = await fetch(`${BASE_URL}/api/auth/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      temp_token: tempToken,
      otp_code: "000000",
    }),
  });
  const invalidData = await invalidRes.json();
  console.log("   Invalid OTP Result:", {
    status: invalidRes.status,
    success: invalidData.success,
    error: invalidData.error,
  });
  if (invalidRes.status !== 400 || invalidData.success) {
    throw new Error("Test 6 Failed: Invalid OTP was accepted");
  }
  console.log("   ✅ Test 6 Passed: Invalid OTP correctly rejected.\n");

  // TEST 7: Step 2 2FA Verification with Valid OTP -> Expects Full Session Token
  console.log("👉 TEST 7: Step 2 2FA with Valid TOTP Code");
  const validOtp = generateSync({ secret: totpSecret });
  const validRes = await fetch(`${BASE_URL}/api/auth/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      temp_token: tempToken,
      otp_code: validOtp,
    }),
  });
  const validData = await validRes.json();
  console.log("   Valid OTP Result:", {
    status: validRes.status,
    success: validData.success,
    hasSessionToken: !!validData.token,
    admin: validData.admin,
  });
  if (!validData.success || !validData.token) {
    throw new Error(`Test 7 Failed: ${validData.error}`);
  }
  fullToken = validData.token;
  console.log("   ✅ Test 7 Passed: Step 2 2FA Verified and Full Session Issued.\n");

  // TEST 8: Test Backup Recovery Code
  console.log("👉 TEST 8: Verify Backup Recovery Code Functionality");
  const loginRes3 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@vendor.com",
      password: "Admin@123456",
    }),
  });
  const loginData3 = await loginRes3.json();
  const backupCodeToUse = backupCodes[0];
  console.log(`   Using Emergency Backup Code: ${backupCodeToUse}`);

  const backupRes = await fetch(`${BASE_URL}/api/auth/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      temp_token: loginData3.temp_token,
      backup_code: backupCodeToUse,
    }),
  });
  const backupData = await backupRes.json();
  console.log("   Backup Code Result:", {
    status: backupRes.status,
    success: backupData.success,
    hasToken: !!backupData.token,
  });
  if (!backupData.success) {
    throw new Error(`Test 8 Failed: ${backupData.error}`);
  }
  fullToken = backupData.token;
  console.log("   ✅ Test 8 Passed: Backup Code Accepted & Verified.\n");

  // TEST 9: Layer 3 - IP Whitelisting Protection
  console.log("👉 TEST 9: 3FA IP Whitelisting Layer Protection");
  console.log("   Configuring IP Whitelist to exclude current IP (simulating untrusted network)...");
  const ipUpdateRes = await fetch(`${BASE_URL}/api/auth/ip-whitelist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fullToken}`,
    },
    body: JSON.stringify({
      allowed_ips: "198.51.100.1,203.0.113.1",
      ip_whitelist_enabled: true,
    }),
  });
  const ipUpdateData = await ipUpdateRes.json();
  console.log("   IP Whitelist Enabled:", ipUpdateData);

  // Attempt login from untrusted IP
  const blockedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@vendor.com",
      password: "Admin@123456",
    }),
  });
  const blockedData = await blockedLoginRes.json();
  console.log("   Blocked Login Attempt Result:", {
    status: blockedLoginRes.status,
    success: blockedData.success,
    error: blockedData.error,
    message: blockedData.message,
  });
  if (blockedLoginRes.status !== 403) {
    throw new Error("Test 9 Failed: IP Whitelisting did not block unauthorized IP");
  }
  console.log("   ✅ Test 9 Passed: Layer 3 IP Guard Successfully Blocked Unauthorized Network.\n");

  // Restore current IP to whitelist
  console.log("👉 RESTORING IP WHITELIST");
  const restoreRes = await fetch(`${BASE_URL}/api/auth/ip-whitelist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fullToken}`,
    },
    body: JSON.stringify({
      allowed_ips: "127.0.0.1,::1,localhost",
      ip_whitelist_enabled: false,
    }),
  });
  console.log("   IP Whitelist Restored:", (await restoreRes.json()).success);

  // TEST 10: Disable 2FA with Password Confirmation
  console.log("\n👉 TEST 10: Disable 2FA");
  const disableRes = await fetch(`${BASE_URL}/api/auth/disable-2fa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fullToken}`,
    },
    body: JSON.stringify({
      password: "Admin@123456",
    }),
  });
  const disableData = await disableRes.json();
  console.log("   Disable 2FA Result:", disableData);
  if (!disableData.success) {
    throw new Error(`Test 10 Failed: ${disableData.error}`);
  }
  console.log("   ✅ Test 10 Passed: 2FA Disabled and Reset Successfully.\n");

  console.log("🔒 ========================================================");
  console.log("🎉 ALL 10 MULTI-FACTOR AUTHENTICATION (2FA/3FA) TESTS PASSED!");
  console.log("🔒 ========================================================\n");
}

runSecurityTests().catch((err) => {
  console.error("❌ Test Suite Error:", err);
  process.exit(1);
});
