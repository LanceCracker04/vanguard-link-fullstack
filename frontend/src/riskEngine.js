// ==========================================
// RISK ANALYSIS ENGINE
// ==========================================

/**
 * Calculate risk score based on various heuristics
 * @param {string} url - The URL to analyze
 * @param {string} sensitivity - Sensitivity level (relaxed, standard, strict)
 * @returns {object} Risk analysis result
 */
export function calculateRiskScore(
  url,
  sensitivity = "standard",
  scanMode = "Balanced",
) {
  let score = 0;
  const signals = [];

  // 1. Base Suspicious Keywords
  let suspiciousKeywords = ["phish", "malware", "login", "verify"];

  // 🚀 TURBO MODE: Add more aggressive/strict keyword checking
  if (scanMode === "Turbo") {
    suspiciousKeywords = [
      ...suspiciousKeywords,
      "urgent",
      "account",
      "banking",
      "secure",
      "update",
      "signin",
    ];
  }

  suspiciousKeywords.forEach((keyword) => {
    if (url.toLowerCase().includes(keyword)) {
      const weight = scanMode === "Stealth" ? 10 : 15; // Stealth is more "forgiving"
      score += weight;
      signals.push(`Pattern detected: ${keyword}`);
    }
  });

  // 2. Entropy/Character Check (Only if not in Stealth)
  // Stealth skips complex analysis to remain "quiet"
  if (scanMode !== "Stealth") {
    const specialChars = (url.match(/[%!\$\^&\*]/g) || []).length;
    if (specialChars > 3) {
      score += 15;
      signals.push("High character entropy detected");
    }
  }

  // 3. Sensitivity modifier
  const sensitivityModifier = { relaxed: -10, standard: 0, strict: 10 };
  score += sensitivityModifier[sensitivity] || 0;

  return {
    score: Math.max(0, Math.min(100, score)),
    signals,
    // 🚀 Add a calculated scanTime based on mode
    executionTime:
      scanMode === "Turbo" ? 400 : scanMode === "Stealth" ? 2500 : 1200,
  };
}

/**
 * Determine risk category from score
 */
export function getRiskCategory(score) {
  if (score <= 20) return "SAFE";
  if (score <= 40) return "LOW_RISK";
  if (score <= 60) return "SUSPICIOUS";
  if (score <= 80) return "HIGH_RISK";
  return "DANGEROUS";
}
