// ==========================================
// CONFIGURATION & RISK LEVEL DEFINITIONS
// ==========================================

export const riskLevels = [
    {
        min: 0,
        max: 20,
        label: "Safe",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        msg: "SAFE"
    },
    {
        min: 21,
        max: 40,
        label: "Low Risk",
        color: "text-lime-400",
        bg: "bg-lime-500/10",
        msg: "LOW RISK"
    },
    {
        min: 41,
        max: 60,
        label: "Suspicious",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        msg: "SUSPICIOUS"
    },
    {
        min: 61,
        max: 80,
        label: "High Risk",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        msg: "HIGH RISK"
    },
    {
        min: 81,
        max: 100,
        label: "Dangerous",
        color: "text-red-400",
        bg: "bg-red-500/10",
        msg: "DANGEROUS"
    }
];

export const defaultConfig = {
    showRiskReasons: true,
    showTechDetails: false,
    scanMode: 1,          // 0: Stealth, 1: Balanced, 2: Turbo
    resourceLimit: 1,     // 0: Low, 1: Medium, 2: High
    realTime: true,
    sensitivity: 'standard' // relaxed, standard, strict
};
