// ==========================================
// 4. DATA PERSISTENCE (Local Storage)
// ==========================================
import { defaultConfig } from "./config.js";
import { riskLevels } from "./config.js";

const CONFIG_KEY = "vanguard_config";

const HISTORY_KEY = "vanguard_scan_history";
const MAX_HISTORY_ITEMS = 10;

export function saveScanToHistory(scanResult, url) {
    const historyItem = {
        url: url,
        score: scanResult.score,
        verdict: getVerdictLabel(scanResult.score),
        date: new Date().toLocaleString(),
        scanTime: scanResult.scanTime
    };

    // 1. Get existing history
    let history = getScanHistory();

    // 2. Add new item to the TOP of the list
    history.unshift(historyItem);

    // 3. Keep only the last 10 items (Prevent memory bloat)
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }

    // 4. Save back to browser
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getScanHistory() {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
}

// Helper to get the text label (Safe/Dangerous) for the history object
function getVerdictLabel(score) {
    const level = riskLevels.find(l => score >= l.min && score <= l.max) || riskLevels[4];
    return level.label;
}

export function loadConfig() {
  const saved = localStorage.getItem(CONFIG_KEY);
  return saved ? { ...defaultConfig, ...JSON.parse(saved) } : { ...defaultConfig };
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
