"use client";

import React, { useState } from "react";
import { Code2, Copy, Check, Terminal, ShieldCheck, Zap } from "lucide-react";

interface ApiIntegrationGuideProps {
  clientCode?: string;
  secretKey?: string;
}

export function ApiIntegrationGuide({
  clientCode = "CLI-APP-001",
  secretKey = "sec_your_client_secret",
}: ApiIntegrationGuideProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<"sheba-erp" | "nodejs" | "php" | "curl">("sheba-erp");

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const shebaErpSnippet = `// Sheba ERP - Enterprise Licensing Middleware & Verification Client
import axios from 'axios';

const VENDOR_API_URL = process.env.VENDOR_API_URL || 'http://localhost:3001';
const CLIENT_APP_ID  = process.env.CLIENT_APP_ID  || '${clientCode}';
const CLIENT_SECRET  = process.env.CLIENT_SECRET  || '${secretKey}';

/**
 * 1. Verify License & Sync Telemetry with Vendor
 * Run this on system boot and periodically (every 5-10 minutes)
 */
export async function verifyShebaErpLicense() {
  try {
    const response = await axios.post(\`\${VENDOR_API_URL}/api/license/verify\`, {
      clientId: CLIENT_APP_ID,
      secretKey: CLIENT_SECRET,
      appVersion: 'v3.2.0',
      domain: window.location.hostname,
      activeStudentsCount: 450, // Active users/students count
      databaseSizeMb: 142.5
    });

    const data = response.data;

    // Master Killswitch / Suspension Enforcer
    if (data.killswitch || data.status === 'BLOCKED' || data.status === 'SUSPENDED') {
      console.error('CRITICAL: Sheba ERP license is blocked or suspended by Vendor.');
      return { isValid: false, killswitch: true, message: data.message };
    }

    if (data.status === 'EXPIRED') {
      return { isValid: false, killswitch: true, message: 'Subscription expired.' };
    }

    // Cache verified JWT token and quotas locally
    localStorage.setItem('VENDOR_LICENSE_TOKEN', data.license_token);
    localStorage.setItem('MAX_STUDENT_QUOTA', String(data.client.student_quota));

    return { isValid: true, client: data.client, token: data.license_token };
  } catch (error: any) {
    console.error('Vendor API communication failed:', error.message);
    return { isValid: false, error: error.message };
  }
}

/**
 * 2. Remote Code Redemption (License Extension, Domain, Hosting, Quota Upgrade)
 */
export async function redeemLicenseCode(inputCode: string) {
  const res = await axios.post(\`\${VENDOR_API_URL}/api/vendor/redeem\`, {
    clientId: CLIENT_APP_ID,
    secretKey: CLIENT_SECRET,
    code: inputCode.trim()
  });
  return res.data;
}`;

  const nodeJsSnippet = `// Node.js Express Client Middleware
import axios from 'axios';

export async function checkVendorLicense(req, res, next) {
  try {
    const { data } = await axios.post('http://localhost:3001/api/license/verify', {
      clientId: '${clientCode}',
      secretKey: '${secretKey}',
      appVersion: 'v2.4.1'
    });

    if (data.killswitch) {
      return res.status(403).json({
        error: 'Application Blocked',
        message: data.message
      });
    }

    req.vendorLicense = data.client;
    next();
  } catch (err) {
    next();
  }
}`;

  const phpSnippet = `<?php
// PHP / Laravel Client Licensing Helper

function verifyVendorLicense($studentCount = 0) {
    $vendorUrl = 'http://localhost:3001/api/license/verify';
    $payload = json_encode([
        'clientId'  => '${clientCode}',
        'secretKey' => '${secretKey}',
        'appVersion' => 'v2.4.1',
        'activeStudentsCount' => $studentCount
    ]);

    $ch = curl_init($vendorUrl);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (!empty($response['killswitch']) && $response['killswitch'] === true) {
        die("<h1>403 Forbidden: Application is suspended by Vendor</h1>");
    }

    return $response;
}`;

  const curlSnippet = `# 1. Verify License Endpoint (Sheba ERP / Client Ping)
curl -X POST http://localhost:3001/api/license/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientId": "${clientCode}",
    "secretKey": "${secretKey}",
    "appVersion": "v3.2.0",
    "activeStudentsCount": 450
  }'

# 2. Remote Code Redemption
curl -X POST http://localhost:3001/api/vendor/redeem \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientId": "${clientCode}",
    "secretKey": "${secretKey}",
    "code": "LIC-Z4ZA-2A5E-A479"
  }'`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            Client App Integration (Sheba ERP / Madrasa & School Apps)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Copy-paste ready integration code for heartbeat checks, killswitch enforcement, and remote code redemption.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: "sheba-erp", label: "Sheba ERP (TS)" },
            { id: "nodejs", label: "Node.js" },
            { id: "php", label: "PHP" },
            { id: "curl", label: "cURL" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveLang(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeLang === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() =>
            copyCode(
              activeLang === "sheba-erp"
                ? shebaErpSnippet
                : activeLang === "nodejs"
                ? nodeJsSnippet
                : activeLang === "php"
                ? phpSnippet
                : curlSnippet,
              "code-snippet"
            )
          }
          className="absolute right-4 top-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition z-10"
        >
          {copiedTab === "code-snippet" ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy Code
            </>
          )}
        </button>

        <pre className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-96">
          {activeLang === "sheba-erp" && shebaErpSnippet}
          {activeLang === "nodejs" && nodeJsSnippet}
          {activeLang === "php" && phpSnippet}
          {activeLang === "curl" && curlSnippet}
        </pre>
      </div>
    </div>
  );
}
