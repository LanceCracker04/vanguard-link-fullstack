// ==========================================
// 6. UI FUNCTIONS (Visuals & Animations)
// ==========================================
import { riskLevels } from "./config.js";
import { addToHistory, updateHistoryUI } from "./history.js";
import { calculateRiskScore } from "./riskEngine.js";
import { saveScanToHistory, loadConfig, saveConfig } from "./storage.js";
import { renderGaugeResult } from "./result.js";

let lastScanResult = null;
let lastScannedUrl = "";

/* --- ENGINE PERFORMANCE LOGIC --- */

// Default Settings
let engineSettings = {
  scanMode: 1, // 0: Stealth, 1: Balanced, 2: Turbo
  resourceLimit: 1, // 0: Low, 1: Medium, 2: High
  realTime: true,
};

// Data for the cycles
const scanModes = [
  {
    label: "Stealth",
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/20",
    borderClass: "border-emerald-500/30",
  },
  {
    label: "Balanced",
    colorClass: "text-blue-400",
    bgClass: "bg-blue-500/20",
    borderClass: "border-blue-500/30",
  },
  {
    label: "Turbo",
    colorClass: "text-red-400",
    bgClass: "bg-red-500/20",
    borderClass: "border-red-500/30",
  },
];

const resourceLimits = ["Low", "Medium", "High"];

let currentSensitivity = "standard";

window.setSensitivity = setSensitivity;

// Elements
const mainContainer = document.getElementById("mainContainer");
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("sidebar-toggle");
const toggleIcon = document.getElementById("toggle-icon");
const controlPanel = document.getElementById("control-panel");

const scanningView = `
    <div class="flex flex-col items-center justify-center h-full animate-fade-in py-12">
        <div class="relative w-32 h-32 mb-8">
            <div class="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
            <div class="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center text-blue-500 font-mono text-sm">SCANNING</div>
        </div>
        <h2 class="text-2xl font-bold text-white tracking-widest mb-2">ANALYZING TARGET</h2>
        <p class="text-blue-400/60 text-sm font-mono animate-pulse">Checking Blacklists & Heuristics...</p>
    </div>
`;

export function updatePerformanceUI() {
  // 1. Update Scan Mode Display
  const currentMode = scanModes[engineSettings.scanMode];
  const modeLabel = document.getElementById("lbl-scan-mode");

  if (modeLabel) {
    modeLabel.textContent = currentMode.label;
    modeLabel.className = `text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${currentMode.colorClass} ${currentMode.bgClass} ${currentMode.borderClass}`;
  }

  // 2. Update Resource Limit Display
  const resourceLabel = document.getElementById("lbl-resource-limit");
  if (resourceLabel) {
    resourceLabel.textContent = resourceLimits[engineSettings.resourceLimit];
  }

  // 3. Update Real-Time Toggle Visuals
  const track = document.getElementById("toggle-track");
  const knob = document.getElementById("toggle-knob");

  if (track && knob) {
    if (engineSettings.realTime) {
      track.className =
        "w-8 h-4 bg-green-500/20 rounded-full border border-green-500 relative transition-colors duration-300";
      knob.className =
        "absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-green-400 rounded-full shadow transition-all duration-300";
    } else {
      track.className =
        "w-8 h-4 bg-slate-700 rounded-full border border-slate-600 relative transition-colors duration-300";
      knob.className =
        "absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-slate-500 rounded-full shadow transition-all duration-300";
    }
  }
}

// Ensure these are globally accessible for HTML onclick events
window.cycleScanMode = cycleScanMode;
window.cycleResourceLimit = cycleResourceLimit;
window.toggleRealTime = toggleRealTime;
window.updatePerformanceUI = updatePerformanceUI;

// --- AMBIENT BACKGROUND CONTROLLER ---
function setAmbientBackground(score) {
  const body = document.body;
  body.classList.remove(
    "mode-safe",
    "mode-low",
    "mode-suspicious",
    "mode-high",
    "mode-dangerous",
  );

  if (score <= 20) body.classList.add("mode-safe");
  else if (score <= 40) body.classList.add("mode-low");
  else if (score <= 60) body.classList.add("mode-suspicious");
  else if (score <= 80) body.classList.add("mode-high");
  else body.classList.add("mode-dangerous");
}

// --- VISUAL EFFECTS SETUP FUNCTION ---
export function setupVisualEffects() {
  console.log("🎨 UI: Visual Effects Ready");

  // setupSettingsToggles();      // <--- 1. Makes the menu open
  // setupSystemActions();        // <--- 2. Makes Reset/Export work
  // setupSensitivityControl();   // <--- 3. Makes the new buttons work

  // 1. Scan button glow effect
  const input = document.getElementById("urlInput");
  const scanButton = document.getElementById("scanButton");

  if (input && scanButton) {
    input.addEventListener("input", () => {
      if (input.value.trim().length > 0) {
        scanButton.classList.add("ring-2", "ring-blue-400", "shadow-lg");
      } else {
        scanButton.classList.remove("ring-2", "ring-blue-400", "shadow-lg");
      }
    });
  }

  // 2. COPY REPORT BUTTON LOGIC (Keep this inside!)
  document.addEventListener("click", async (e) => {
    const copyBtn = e.target.closest("#copyReportBtn");
    if (!copyBtn) return;
    if (!lastScanResult) return;

    // Assuming formatReportText is available in scope
    const text =
      typeof formatReportText === "function"
        ? formatReportText(lastScannedUrl, lastScanResult)
        : JSON.stringify(lastScanResult, null, 2);

    try {
      await navigator.clipboard.writeText(text);
      showToast("✅ Copied!");
    } catch (err) {
      console.error("Copy failed:", err);
      alert("❌ Copy failed. Try again.");
    }
  });
}

// --- SCANNER SETUP & RESET LOGIC ---

// 1. Capture the initial HTML of the scanner (The "Home Screen")
const initialMainContent = mainContainer.innerHTML;

// 2. Define the Setup Function (Attaches listeners & restores state)
function setupScannerEvents() {
  const scanButton = document.getElementById("scanButton"); // Make sure ID matches HTML
  const urlInput = document.getElementById("urlInput");

  if (scanButton && urlInput) {
    scanButton.addEventListener("click", async () => {
      const url = urlInput.value.trim();
      if (!url) return;

      // 1. LINK PERFORMANCE MODES TO TIMING
      const modeTimings = { 0: 3500, 1: 1500, 2: 500 };
      const selectedTiming = modeTimings[engineSettings.scanMode] || 1500;

      // 2. Start animation with dynamic speed
      runScanSequence(selectedTiming);

      try {
        const response = await fetch("http://127.0.0.1:5000/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url }),
        });
        const pythonResult = await response.json();

        // 3. WAIT FOR ENGINE MODE COMPLETION
        setTimeout(() => {
          const finalScore = pythonResult.status === "Danger" ? 95 : 10;

          renderGaugeResult({
            score: finalScore,
            scanTime: selectedTiming,
            reasons: [
              { text: pythonResult.reason, weight: "HIGH", signal: "PYTHON" },
            ],
            detectedCategory: pythonResult.status,
          });

          setTimeout(() => {
            const marker = document.getElementById("gauge-marker");
            if (marker) marker.style.left = `${finalScore}%`;
          }, 100);
        }, selectedTiming);
      } catch (err) {
        console.error("Backend Error:", err);
        resetScanner();
      }
    });
  }

  // RESTORE SENSITIVITY BUTTON STATE
  // This makes sure the button stays colored based on your selection
  document.querySelectorAll(".sensitivity-btn").forEach((btn) => {
    btn.classList.remove("active-relaxed", "active-standard", "active-strict");
  });

  // Find the button that matches the current mode and light it up
  const activeBtn = document.querySelector(
    `.sensitivity-btn[onclick*='${currentSensitivity}']`,
  );
  if (activeBtn) {
    activeBtn.classList.add("active-" + currentSensitivity);
  }
}

// 3. Initialize on Load
setupScannerEvents();

// Function to go back to home WITHOUT reloading
function resetScanner() {
  // 1. Remove all "result mode" background classes
  document.body.classList.remove(
    "mode-safe",
    "mode-low",
    "mode-suspicious",
    "mode-high",
    "mode-dangerous",
  );

  // 2. Restore the HTML (Inputs, Title, Buttons)
  mainContainer.innerHTML = initialMainContent;

  // 3. Re-attach the events (Click listeners, visual states)
  setupScannerEvents();
}

// Make it global so the HTML button can see it
window.resetScanner = resetScanner;

// --- 1. VISIBILITY LOGIC ---
function updateToggleVisibility() {
  // Toggle button is now always visible and clickable
  return;
}

// 2. SIDEBAR STATE ---
function setSidebarExpanded(expanded) {
  if (!sidebar) return;
  sidebar.setAttribute("data-expanded", expanded ? "true" : "false");

  if (expanded) {
    sidebar.classList.remove("w-20");
    sidebar.classList.add("w-64");
    if (toggleIcon) toggleIcon.style.transform = "rotate(0deg)";
  } else {
    sidebar.classList.remove("w-64");
    sidebar.classList.add("w-20");
    if (toggleIcon) toggleIcon.style.transform = "rotate(180deg)";
  }
  updateToggleVisibility();
}

function toggleSidebar() {
  if (!sidebar) return;
  const isExpanded = sidebar.getAttribute("data-expanded") === "true";

  // Simply toggle the state.
  // We REMOVED the logic that forced the panel to close here.
  setSidebarExpanded(!isExpanded);
}
window.toggleSidebar = toggleSidebar;

if (toggleBtn) toggleBtn.addEventListener("click", toggleSidebar);

// --- 3. PANEL CONTROL ---

function openPanel() {
  const controlPanel = document.getElementById("control-panel");
  if (!controlPanel) return;

  // Open Animation
  controlPanel.classList.remove(
    "w-0",
    "ml-0",
    "opacity-0",
    "border-none",
    "overflow-hidden",
  );
  controlPanel.classList.add("w-[340px]", "ml-4", "opacity-100", "border");

  if (typeof updateToggleVisibility === "function") updateToggleVisibility();
}

function closePanel() {
  const controlPanel = document.getElementById("control-panel");
  const sidebar = document.getElementById("sidebar");

  if (!controlPanel) return;

  // 1. Close Animation
  controlPanel.classList.remove(
    "w-[340px]",
    "ml-4",
    "border",
    "px-6",
    "opacity-100",
  );
  controlPanel.classList.add(
    "w-0",
    "ml-0",
    "opacity-0",
    "border-none",
    "overflow-hidden",
  );

  // 2. Reset Sidebar Buttons (Remove blue glow)
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.remove("bg-white/10", "text-white");
    btn.classList.add("text-slate-400");
  });

  // 3. Hide all panel contents (Reset for next open)
  document.querySelectorAll(".panel-content").forEach((content) => {
    content.classList.add("hidden");
  });

  // 4. Shrink Sidebar
  if (sidebar) sidebar.setAttribute("data-expanded", "false");

  if (typeof updateToggleVisibility === "function") updateToggleVisibility();
}

// ==========================================
// 🛡️ UNIFIED NOTIFICATION SYSTEM
// ==========================================

function showToast(message, type = "standard", onConfirm = null) {
  // 1. Check for existing toast
  const existingToast = document.getElementById("vanguard-toast");
  if (existingToast) existingToast.remove();

  // 2. Define Styles
  const styles = {
    relaxed: {
      border: "border-emerald-500/50",
      shadow: "shadow-[0_0_30px_rgba(16,185,129,0.4)]",
      dot: "bg-emerald-500",
      ping: "bg-emerald-400",
    },
    success: {
      border: "border-emerald-500/50",
      shadow: "shadow-[0_0_30px_rgba(16,185,129,0.4)]",
      dot: "bg-emerald-500",
      ping: "bg-emerald-400",
    },
    standard: {
      border: "border-blue-500/50",
      shadow: "shadow-[0_0_30px_rgba(59,130,246,0.4)]",
      dot: "bg-blue-500",
      ping: "bg-blue-400",
    },
    strict: {
      border: "border-orange-500/50",
      shadow: "shadow-[0_0_30px_rgba(249,115,22,0.4)]",
      dot: "bg-orange-500",
      ping: "bg-orange-400",
    },
    confirm: {
      border: "border-red-500/50",
      shadow: "shadow-[0_0_30px_rgba(239,68,68,0.4)]",
      dot: "bg-red-500",
      ping: "bg-red-400",
    },
  };

  const theme = styles[type] || styles.standard;

  // 3. Create Container
  const toast = document.createElement("div");
  toast.id = "vanguard-toast";

  // 4. Apply Layout based on Type
  if (type === "confirm") {
    // --- CARD LAYOUT (History Clear) ---
    toast.className = `
            fixed bottom-10 right-10 z-[100]
            bg-[#0f172a] text-white p-5 rounded-2xl
            border ${theme.border} ${theme.shadow}
            flex flex-col gap-3 min-w-[300px]
            transition-all duration-300 ease-out 
            opacity-0 translate-y-4 backdrop-blur-md shadow-2xl
        `;
    toast.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${theme.ping} opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 ${theme.dot}"></span>
                </span>
                <span class="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">Confirm Action</span>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed">${message}</p>
            <div class="flex gap-2 mt-2">
                <button id="toast-yes" class="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-2 rounded transition-colors shadow-lg shadow-red-900/50">YES, CLEAR</button>
                <button id="toast-no" class="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-bold py-2 rounded transition-colors border border-white/10">CANCEL</button>
            </div>
        `;
  } else {
    // --- PILL LAYOUT (Sensitivity) ---
    toast.className = `
            fixed bottom-10 left-1/2 -translate-x-1/2 
            bg-[#0f172a] text-white px-6 py-3 rounded-full 
            border ${theme.border} ${theme.shadow}
            flex items-center gap-3 z-[9999] 
            transition-all duration-300 ease-out 
            opacity-0 translate-y-4 backdrop-blur-md
        `;
    toast.innerHTML = `
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${theme.ping} opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 ${theme.dot}"></span>
            </span>
            <span class="text-xs font-bold tracking-widest uppercase font-mono text-slate-200">${message}</span>
        `;
  }

  document.body.appendChild(toast);

  // 5. Animate In
  requestAnimationFrame(() =>
    toast.classList.remove("opacity-0", "translate-y-4"),
  );

  // 6. Interaction Logic
  if (type === "confirm") {
    document.getElementById("toast-yes").onclick = () => {
      if (onConfirm) onConfirm();
      removeToast(toast);
    };
    document.getElementById("toast-no").onclick = () => {
      removeToast(toast);
    };
  } else {
    // Auto-dismiss pill toasts after 3 seconds
    setTimeout(() => removeToast(toast), 3000);
  }
}

function removeToast(el) {
  if (!el) return;
  el.classList.add("opacity-0", "translate-y-4");
  setTimeout(() => el.remove(), 300);
}

// 2. The Sensitivity Function
export function setSensitivity(level, activeBtn) {
  if (typeof currentSensitivity !== "undefined") currentSensitivity = level;

  document.querySelectorAll(".sensitivity-btn").forEach((btn) => {
    btn.classList.remove("active-relaxed", "active-standard", "active-strict");
  });
  activeBtn.classList.add("active-" + level);

  showToast(`${level} MODE ACTIVATED`, level);
}

// ✅ EXPORT GLOBALS (Clean list, no duplicates)
window.openPanel = openPanel;
window.closePanel = closePanel;
window.showToast = showToast;
window.setSensitivity = setSensitivity;

// Init
(function init() {
  if (typeof setSidebarExpanded === "function") setSidebarExpanded(false);
  if (typeof updateToggleVisibility === "function") updateToggleVisibility();

  document
    .querySelector(".sensitivity-btn[onclick*='standard']")
    ?.classList.add("active-standard");
})();

// --- 4. NAVIGATION (FINAL INTEGRATED VERSION) ---
let currentOpenPanel = null;

function switchPanel(panelName, button) {
  console.log("🔄 Switching panel to:", panelName);

  const controlPanel = document.getElementById("control-panel");
  if (!controlPanel) {
    console.error("❌ Control panel not found");
    return;
  }

  // ============================================
  // 1. RESET ALL SIDEBAR BUTTONS
  // ============================================
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.remove(
      "bg-gradient-to-r",
      "from-blue-600",
      "to-blue-700",
      "text-white",
      "shadow-lg",
      "shadow-blue-900/40",
    );
    btn.classList.add("text-slate-400");
  });

  if (!button) button = document.getElementById("nav-" + panelName);
  if (button) {
    button.classList.remove("text-slate-400");
    button.classList.add(
      "bg-gradient-to-r",
      "from-blue-600",
      "to-blue-700",
      "text-white",
      "shadow-lg",
      "shadow-blue-900/40",
    );
  }

  // ============================================
  // 2. HANDLE SCANNER (CLOSES PANEL)
  // ============================================
  if (panelName === "scanner") {
    controlPanel.classList.add("w-0", "opacity-0");
    controlPanel.classList.remove("w-[340px]", "opacity-100", "p-4", "border");

    if (
      currentOpenPanel === "threats" &&
      typeof stopThreatFeed === "function"
    ) {
      stopThreatFeed();
    }
    currentOpenPanel = null;
    return;
  }

  // ============================================
  // 3. OPEN THE CONTROL PANEL
  // ============================================
  controlPanel.classList.remove("w-0", "opacity-0");
  controlPanel.classList.add("w-[340px]", "opacity-100", "p-0", "border");

  // ============================================
  // 4. MANAGE TITLES & VISIBILITY
  // ============================================
  const panelTitles = {
    vault: "Security Vault",
    history: "Scan History",
    threats: "Live Threat Map",
    performance: "Engine Performance",
    settings: "System Settings",
    activity: "Activity Monitor",
  };

  const titleEl = document.getElementById("panel-header-title");
  if (titleEl && panelTitles[panelName]) {
    titleEl.textContent = panelTitles[panelName];
  }

  document.querySelectorAll(".panel-content").forEach((el) => {
    el.classList.add("hidden");
    el.classList.remove("flex");
  });

  // ============================================
  // SECURITY VAULT TAB SYSTEM
  // ============================================
  function toggleVaultTab(tabName) {
    console.log("🛠️ Vault switching to:", tabName);

    const whitelistBtn = document.getElementById("tab-whitelist");
    const blacklistBtn = document.getElementById("tab-blacklist");
    const whitelistList = document.getElementById("list-whitelist");
    const blacklistList = document.getElementById("list-blacklist");

    // Prevent crashing if elements are missing
    if (!whitelistBtn || !blacklistBtn || !whitelistList || !blacklistList) {
      console.error("❌ Vault elements missing from HTML");
      return;
    }

    const activeClasses = [
      "text-white",
      "bg-blue-600",
      "shadow-lg",
      "shadow-blue-900/20",
      "rounded-lg",
    ];
    const inactiveClasses = ["text-slate-400"];

    if (tabName === "whitelist") {
      // Show Whitelist
      whitelistList.classList.remove("hidden");
      blacklistList.classList.add("hidden");

      // Toggle Button Styles
      whitelistBtn.classList.add(...activeClasses);
      whitelistBtn.classList.remove(...inactiveClasses);
      blacklistBtn.classList.remove(...activeClasses);
      blacklistBtn.classList.add(...inactiveClasses);
    } else {
      // Show Blacklist
      blacklistList.classList.remove("hidden");
      whitelistList.classList.add("hidden");

      // Toggle Button Styles
      blacklistBtn.classList.add(...activeClasses);
      blacklistBtn.classList.remove(...inactiveClasses);
      whitelistBtn.classList.remove(...activeClasses);
      whitelistBtn.classList.add(...inactiveClasses);
    }
  }

  // CRITICAL: Attach to window so the HTML 'onclick' can find it!
  window.toggleVaultTab = toggleVaultTab;

  // ============================================
  // 5. SMART ID SELECTION
  // ============================================
  // Look for panel with standard panel- prefix only
  let target = document.getElementById(`panel-${panelName}`);

  if (!target) {
    console.error(`❌ Panel not found in HTML: panel-${panelName}`);
    return;
  }

  // ============================================
  // 6. SHOW TARGET PANEL WITH PROPER LAYOUT
  // ============================================
  target.classList.remove("hidden");
  target.classList.add("flex");
  console.log("✅ Panel displayed:", target.id);

  // ============================================
  // 7. HANDLE FEED TRANSITIONS
  // ============================================
  if (
    currentOpenPanel === "threats" &&
    panelName !== "threats" &&
    typeof stopThreatFeed === "function"
  ) {
    stopThreatFeed();
  }

  if (panelName === "threats" && typeof startThreatFeed === "function") {
    startThreatFeed();
  }

  if (panelName === "history" && typeof updateHistoryUI === "function") {
    updateHistoryUI();
  }

  if (panelName === "performance") {
    console.log("⚡ Performance Engine active");
  }

  currentOpenPanel = panelName;
}
window.switchPanel = switchPanel;

// --- 5. CLICK OUTSIDE (THE MASTER CLOSER) ---
document.addEventListener("click", function (event) {
  const isClickInsideSidebar = sidebar ? sidebar.contains(event.target) : false;
  const isClickInsidePanel = controlPanel
    ? controlPanel.contains(event.target)
    : false;

  // If you click anywhere that is NOT the sidebar and NOT the panel
  if (!isClickInsideSidebar && !isClickInsidePanel) {
    closePanel(); // 1. Close the sub-menu
    setSidebarExpanded(false); // 2. Shrink the sidebar
  }
});

// --- 6. SMART TOOLTIPS (Keep this as requested previously) ---
const navItems = document.querySelectorAll(".nav-item");
navItems.forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    if (!sidebar) return;
    const isExpanded = sidebar.getAttribute("data-expanded") === "true";

    const textSpan = btn.querySelector("span");
    if (!textSpan) return;
    const text = textSpan.innerText.trim();

    const tooltip = document.createElement("div");
    tooltip.id = "active-tooltip";
    tooltip.className =
      "fixed z-[100] bg-[#0f172a] text-slate-200 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-white/10 shadow-2xl pointer-events-none tracking-wide";
    tooltip.innerText = text;
    document.body.appendChild(tooltip);

    const rect = btn.getBoundingClientRect();
    const top = rect.top + rect.height / 2 - tooltip.offsetHeight / 2;
    const left = rect.right + 15;
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    tooltip.animate(
      [
        { opacity: 0, transform: "translateX(-5px)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: 200, fill: "forwards", easing: "ease-out" },
    );
  });
  btn.addEventListener("mouseleave", () => {
    const tooltip = document.getElementById("active-tooltip");
    if (tooltip) tooltip.remove();
  });
  btn.addEventListener("click", () => {
    const tooltip = document.getElementById("active-tooltip");
    if (tooltip) tooltip.remove();
  });
});

// Init
(function init() {
  setSidebarExpanded(false);
  updateToggleVisibility();

  document
    .querySelector(".sensitivity-btn[onclick*='standard']")
    ?.classList.add("active-standard");
})();

/* =========================================
   THREAT FEED SIMULATION LOGIC
   ========================================= */

let threatInterval = null;
const threatList = document.getElementById("threat-list");
let criticalCount = 0;
let highCount = 0;

// Data for simulation
const threatTypes = [
  {
    name: "SQL Injection",
    type: "CRITICAL",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    name: "XSS Payload",
    type: "HIGH",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    name: "Botnet Traffic",
    type: "MEDIUM",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    name: "Brute Force",
    type: "HIGH",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    name: "Phishing Link",
    type: "CRITICAL",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    name: "Port Scan",
    type: "LOW",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
];

const countries = ["US", "CN", "RU", "BR", "DE", "IN", "FR", "KP", "IR"];

// Helper to generate random IP
const randomIP = () =>
  Array(4)
    .fill(0)
    .map(() => Math.floor(Math.random() * 255))
    .join(".");

// Function to create a single feed item
function addThreatItem() {
  if (!threatList) return;

  // Pick random data
  const threat = threatTypes[Math.floor(Math.random() * threatTypes.length)];
  const country = countries[Math.floor(Math.random() * countries.length)];
  const ip = randomIP();
  const time = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Update stats
  if (threat.type === "CRITICAL") {
    criticalCount++;
    document.getElementById("stat-critical").innerText = criticalCount;
  } else if (threat.type === "HIGH") {
    highCount++;
    document.getElementById("stat-high").innerText = highCount;
  }

  // Create HTML element
  const item = document.createElement("div");
  item.className =
    "flex items-center justify-between p-2 rounded border border-transparent hover:bg-white/5 hover:border-white/5 transition-all animate-in fade-in slide-in-from-top-2 duration-300";

  item.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
            <span class="text-[9px] font-bold ${threat.color} w-14 shrink-0">${threat.type}</span>
            <div class="flex flex-col min-w-0">
                <span class="text-xs text-slate-200 truncate font-medium">${threat.name}</span>
                <span class="text-[10px] text-slate-600 truncate font-mono">${ip}</span>
            </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
            <span class="text-[9px] text-slate-500 font-mono bg-slate-800 px-1 rounded">${country}</span>
            <span class="text-[9px] text-slate-600 font-mono">${time}</span>
        </div>
    `;

  // Insert at top
  threatList.prepend(item);

  // Keep list clean (max 20 items)
  if (threatList.children.length > 20) {
    threatList.lastElementChild.remove();
  }
}

// Function to start the simulation
function startThreatFeed() {
  if (threatInterval) return; // Already running

  // Clear initial "Initializing..." text if present
  if (threatList.innerText.includes("Initializing")) {
    threatList.innerHTML = "";
  }

  // Add a new threat every 800ms to 2000ms
  addThreatItem(); // Add one immediately
  threatInterval = setInterval(() => {
    addThreatItem();
  }, 1500);
}

// Function to stop/pause simulation (save resources)
function stopThreatFeed() {
  if (threatInterval) {
    clearInterval(threatInterval);
    threatInterval = null;
  }
}

// ============================================
// CUSTOM MODAL SYSTEM
// ============================================

function addNewDomain() {
  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("domain-modal");
  const input = document.getElementById("modal-input");
  const title = document.getElementById("modal-title");

  // Detect active tab to set title
  const isWhitelist = !document
    .getElementById("list-whitelist")
    .classList.contains("hidden");
  title.textContent = isWhitelist ? "Add to Whitelist" : "Add to Blacklist";

  // Show with animation
  overlay.classList.remove("hidden");
  overlay.classList.add("flex");
  setTimeout(() => {
    overlay.classList.add("opacity-100");
    modal.classList.remove("scale-95");
    modal.classList.add("scale-100");
    input.focus();
  }, 10);
}

function closeAddDomainModal() {
  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("domain-modal");

  overlay.classList.remove("opacity-100");
  modal.classList.add("scale-95");

  setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
    document.getElementById("modal-input").value = "";
  }, 300);
}

function confirmAddDomain() {
  const domain = document.getElementById("modal-input").value.trim();
  if (!domain) return;

  const isWhitelist = !document
    .getElementById("list-whitelist")
    .classList.contains("hidden");
  const tabType = isWhitelist ? "whitelist" : "blacklist";

  const listContainer = document.getElementById(`items-${tabType}`);
  const emptyState = document.getElementById(`empty-${tabType}`);

  // Standard UI Logic: Hide empty, Show list
  emptyState.classList.add("hidden");
  listContainer.classList.remove("hidden");

  const itemHTML = `
        <div class="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg ${isWhitelist ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"} flex items-center justify-center">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${isWhitelist ? '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' : '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>'}
                    </svg>
                </div>
                <div>
                    <div class="text-sm font-medium text-white">${domain.toLowerCase()}</div>
                    <div class="text-xs text-slate-500">Manual Entry</div>
                </div>
            </div>
            <button onclick="this.parentElement.remove()" class="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
    `;

  listContainer.insertAdjacentHTML("afterbegin", itemHTML);
  closeAddDomainModal();
}

// Expose functions to window
window.addNewDomain = addNewDomain;
window.closeAddDomainModal = closeAddDomainModal;
window.confirmAddDomain = confirmAddDomain;

function cycleScanMode() {
  // Cycle through 0 -> 1 -> 2 -> 0
  engineSettings.scanMode = (engineSettings.scanMode + 1) % scanModes.length;
  updatePerformanceUI();
}

function cycleResourceLimit() {
  // Cycle through 0 -> 1 -> 2 -> 0
  engineSettings.resourceLimit =
    (engineSettings.resourceLimit + 1) % resourceLimits.length;
  updatePerformanceUI();
}

function toggleRealTime() {
  engineSettings.realTime = !engineSettings.realTime;
  updatePerformanceUI();
}
window.cycleScanMode = cycleScanMode;
window.cycleResourceLimit = cycleResourceLimit;
window.toggleRealTime = toggleRealTime;
