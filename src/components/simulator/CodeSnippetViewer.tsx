"use client";

import React, { useState } from "react";
import { Code2, Copy, Check } from "lucide-react";

interface CodeSnippetViewerProps {
  currentClient: any;
  redeemCode: string;
}

export function CodeSnippetViewer({ currentClient, redeemCode }: CodeSnippetViewerProps) {
  const [activeCodeLang, setActiveCodeLang] = useState<"nodejs" | "php" | "curl">("nodejs");
  const [copiedSdk, setCopiedSdk] = useState<string | null>(null);

  const copyCodeToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSdk(id);
    setTimeout(() => setCopiedSdk(null), 2000);
  };

  const nodeJsSnippet = `// Madrasa/School Client App - Strict Redemption Controller (Node.js / Express / Next.js)
import axios from 'axios';

const VENDOR_API_URL = 'http://localhost:3001';
const CLIENT_APP_ID = '${currentClient?.clientCode || "CLI-MADRASA-001"}';
const SECRET_KEY = '${currentClient?.secretKey || "sec_your_secret_key"}';

export async function handleClientCodeRedemption(userInputtedCode) {
  try {
    const response = await axios.post(\`\${VENDOR_API_URL}/api/vendor/redeem\`, {
      clientId: CLIENT_APP_ID,
      secretKey: SECRET_KEY,
      code: userInputtedCode
    });

    const data = response.data;
    if (!data.success) {
      throw new Error(data.error || 'Verification Failed');
    }

    const { code_type, duration_years, is_lifetime, student_quota_added } = data;
    const now = new Date();

    switch (code_type) {
      case 'License':
        if (is_lifetime) {
          await db.systemSettings.update({ is_lifetime_license: true, license_expires_at: null });
        } else {
          const currentExpiry = await db.systemSettings.getLicenseExpiry();
          const baseDate = currentExpiry && new Date(currentExpiry) > now ? new Date(currentExpiry) : now;
          baseDate.setFullYear(baseDate.getFullYear() + (duration_years || 1));
          await db.systemSettings.update({ license_expires_at: baseDate, is_suspended: false });
        }
        break;

      case 'Domain':
        const currentDomainExp = await db.systemSettings.getDomainExpiry();
        const baseDomainDate = currentDomainExp && new Date(currentDomainExp) > now ? new Date(currentDomainExp) : now;
        baseDomainDate.setFullYear(baseDomainDate.getFullYear() + (duration_years || 1));
        await db.systemSettings.update({ domain_expires_at: baseDomainDate });
        break;

      case 'Hosting':
        const currentHostExp = await db.systemSettings.getHostingExpiry();
        const baseHostDate = currentHostExp && new Date(currentHostExp) > now ? new Date(currentHostExp) : now;
        baseHostDate.setFullYear(baseHostDate.getFullYear() + (duration_years || 1));
        await db.systemSettings.update({ hosting_expires_at: baseHostDate });
        break;

      case 'StudentQuota':
        if (student_quota_added) {
          await db.systemSettings.incrementStudentQuota(student_quota_added);
        }
        break;

      default:
        throw new Error(\`Unrecognized verified code_type: \${code_type}\`);
    }

    return {
      success: true,
      message: \`Successfully redeemed \${data.duration} \${data.code_type} upgrade!\`,
      details: data
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    return { success: false, error: errorMessage };
  }
}`;

  const phpSnippet = `<?php
// Madrasa/School Client App - Strict Redemption Controller (PHP / Laravel)

function redeemCodeStrictly($userInputtedCode) {
    $vendorUrl = 'http://localhost:3001/api/vendor/redeem';
    $clientAppId = '${currentClient?.clientCode || "CLI-MADRASA-001"}';
    $secretKey = '${currentClient?.secretKey || "sec_your_secret_key"}';

    $ch = curl_init($vendorUrl);
    $payload = json_encode([
        'clientId' => $clientAppId,
        'secretKey' => $secretKey,
        'code' => trim($userInputtedCode)
    ]);

    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $responseRaw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($responseRaw, true);

    if ($httpCode !== 200 || empty($data['success'])) {
        return [
            'success' => false,
            'error' => $data['error'] ?? 'Code Verification Failed'
        ];
    }

    $codeType = $data['code_type'];
    $durationYears = intval($data['duration_years'] ?? 1);

    if ($codeType === 'License') {
        if (!empty($data['is_lifetime'])) {
            DB::table('settings')->update(['is_lifetime' => 1, 'license_expires_at' => null]);
        } else {
            $currentExpiry = DB::table('settings')->value('license_expires_at');
            $base = ($currentExpiry && strtotime($currentExpiry) > time()) ? strtotime($currentExpiry) : time();
            $newExpiry = date('Y-m-d H:i:s', strtotime("+$durationYears years", $base));
            DB::table('settings')->update(['license_expires_at' => $newExpiry, 'is_suspended' => 0]);
        }
    } elseif ($codeType === 'Domain') {
        $currentExpiry = DB::table('settings')->value('domain_expires_at');
        $base = ($currentExpiry && strtotime($currentExpiry) > time()) ? strtotime($currentExpiry) : time();
        $newExpiry = date('Y-m-d H:i:s', strtotime("+$durationYears years", $base));
        DB::table('settings')->update(['domain_expires_at' => $newExpiry]);
    } elseif ($codeType === 'Hosting') {
        $currentExpiry = DB::table('settings')->value('hosting_expires_at');
        $base = ($currentExpiry && strtotime($currentExpiry) > time()) ? strtotime($currentExpiry) : time();
        $newExpiry = date('Y-m-d H:i:s', strtotime("+$durationYears years", $base));
        DB::table('settings')->update(['hosting_expires_at' => $newExpiry]);
    } elseif ($codeType === 'StudentQuota') {
        $slots = intval($data['student_quota_added'] ?? 100);
        DB::table('settings')->increment('student_quota', $slots);
    }

    return [
        'success' => true,
        'message' => "Successfully applied {$data['duration']} {$data['code_type']} upgrade.",
        'data' => $data
    ];
}`;

  const curlSnippet = `# Strict Remote Code Redemption Request to Vendor App
curl -X POST http://localhost:3001/api/vendor/redeem \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientId": "${currentClient?.clientCode || "CLI-MADRASA-001"}",
    "secretKey": "${currentClient?.secretKey || "sec_your_secret_key"}",
    "code": "${redeemCode || "LIC-Z4ZA-2A5E-A479"}"
  }'`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            Client Software Integration SDK Snippets
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Embed into client applications (e.g., Madrasa or School ERPs) for automated heartbeats and remote license renewal.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(["nodejs", "php", "curl"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveCodeLang(lang)}
              className={`px-3 py-1 rounded-lg font-bold uppercase transition cursor-pointer ${
                activeCodeLang === lang
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() =>
            copyCodeToClipboard(
              activeCodeLang === "nodejs"
                ? nodeJsSnippet
                : activeCodeLang === "php"
                ? phpSnippet
                : curlSnippet,
              "sdk"
            )
          }
          className="absolute right-4 top-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition z-10 cursor-pointer"
        >
          {copiedSdk === "sdk" ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy SDK Code
            </>
          )}
        </button>

        <pre className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-96">
          {activeCodeLang === "nodejs" && nodeJsSnippet}
          {activeCodeLang === "php" && phpSnippet}
          {activeCodeLang === "curl" && curlSnippet}
        </pre>
      </div>
    </div>
  );
}
