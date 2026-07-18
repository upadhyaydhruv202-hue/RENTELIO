/**
 * Demo KYC / document intelligence — deterministic scoring for hackathon demos.
 * Not a real ML or government ID API.
 */
function scoreDocumentUrl(url = '') {
  const u = String(url || '').trim().toLowerCase();
  if (!u) {
    return { ok: false, score: 0, issues: ['Missing document'], authenticity: 'Missing' };
  }
  const issues = [];
  let score = 72;
  if (u.includes('fake') || u.includes('tamper')) {
    score -= 50;
    issues.push('Tampering / fake pattern detected');
  }
  if (u.includes('blur') || u.includes('low')) {
    score -= 20;
    issues.push('Low image quality');
  }
  if (u.startsWith('http') || u.startsWith('/uploads') || u.startsWith('data:')) {
    score += 10;
  } else {
    score -= 15;
    issues.push('Untrusted document path');
  }
  if (u.includes('aadhaar') || u.includes('pan') || u.includes('gst') || u.includes('license')) {
    score += 8;
  }
  score = Math.max(0, Math.min(100, score));
  let authenticity = 'Authentic';
  if (score < 40) authenticity = 'Fraud Suspected';
  else if (score < 65) authenticity = 'Needs Review';
  return { ok: score >= 65, score, issues, authenticity, ocrSnippet: `DEMO-OCR:${u.slice(-24)}` };
}

function evaluateVendorKyc(vendor = {}) {
  const docs = [
    { key: 'aadhaar', label: 'Aadhaar', ...scoreDocumentUrl(vendor.aadhaarUrl) },
    { key: 'pan', label: 'PAN', ...scoreDocumentUrl(vendor.panUrl) },
    { key: 'license', label: 'Driving License', ...scoreDocumentUrl(vendor.licenseUrl) },
    { key: 'business', label: 'Business Registration', ...scoreDocumentUrl(vendor.businessCertUrl) },
    { key: 'gst', label: 'GST (optional)', ...scoreDocumentUrl(vendor.gstUrl), optional: true },
  ];

  const required = docs.filter((d) => !d.optional);
  const avg =
    required.reduce((s, d) => s + d.score, 0) / Math.max(1, required.length);
  const anyFraud = required.some((d) => d.authenticity === 'Fraud Suspected');
  const missing = required.filter((d) => !d.ok && d.authenticity === 'Missing').length;

  let kycStatus = 'Verified';
  if (anyFraud) kycStatus = 'Fraud Detected';
  else if (missing > 0) kycStatus = 'Pending Review';
  else if (avg < 65) kycStatus = 'Suspicious';
  else if (avg < 80) kycStatus = 'Pending Review';

  const fraudScore = Math.round(
    Math.min(99, Math.max(5, 100 - avg + (anyFraud ? 35 : 0) + missing * 8))
  );

  return {
    kycStatus,
    fraudScore,
    averageAuthenticity: Math.round(avg),
    documents: docs,
    summary:
      kycStatus === 'Verified'
        ? 'Documents passed demo authenticity checks.'
        : kycStatus === 'Fraud Detected'
          ? 'AI demo flagged likely fraudulent documents.'
          : 'Manual review recommended before approval.',
  };
}

module.exports = { scoreDocumentUrl, evaluateVendorKyc };
