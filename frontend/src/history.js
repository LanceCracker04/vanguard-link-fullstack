const HISTORY_KEY = "vanguard_scan_history";
let scanHistory = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

// 1. ADD ITEM TO HISTORY
export function addToHistory(url, riskData) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let verdict = "SAFE";
    if (riskData.score > 80) verdict = "DANGEROUS";
    else if (riskData.score > 60) verdict = "HIGH RISK";
    else if (riskData.score > 40) verdict = "SUSPICIOUS";
    else if (riskData.score > 20) verdict = "LOW RISK";

    const newItem = {
        url: url,
        score: riskData.score,
        verdict: verdict,
        time: timeString,
        timestamp: now.getTime()
    };

    scanHistory.unshift(newItem);
    if (scanHistory.length > 50) scanHistory.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(scanHistory));
    
    updateHistoryUI();
}

// 2. RENDER THE UI & USE TOAST
export function updateHistoryUI() {
    const listContainer = document.getElementById("history-list");
    const emptyState = document.getElementById("history-empty");
    const clearBtn = document.getElementById("clearHistoryBtn");
    const badge = document.getElementById("history-badge");

    // Update Sidebar Badge
    if (badge) {
        badge.textContent = scanHistory.length;
        badge.classList.toggle('hidden', scanHistory.length === 0);
        badge.classList.toggle('opacity-0', scanHistory.length === 0);
    }

    if (!listContainer) return;

    // --- CLEAR BUTTON LOGIC (USING TOAST) ---
    if (clearBtn && !clearBtn.hasAttribute("data-listening")) {
        clearBtn.addEventListener("click", () => {
            if(scanHistory.length === 0) return;

            // 🔥 CALL THE NEW TOAST FUNCTION HERE
            window.showToast(
                "Are you sure you want to delete all scan logs? This action cannot be undone.", 
                "confirm", 
                () => {
                    // This runs only if user clicks "CONFIRM"
                    scanHistory = [];
                    localStorage.removeItem(HISTORY_KEY);
                    updateHistoryUI();
                    window.showToast("History cleared successfully.", "success");
                }
            );
        });
        clearBtn.setAttribute("data-listening", "true");
    }

    // Toggle Empty State
    if (scanHistory.length === 0) {
        listContainer.innerHTML = "";
        if(emptyState) emptyState.classList.remove("hidden");
        // Fade out clear button if empty
        if(clearBtn) {
            clearBtn.style.opacity = "0.3"; 
            clearBtn.style.pointerEvents = "none";
        }
        return;
    }

    // Show Content
    if(emptyState) emptyState.classList.add("hidden");
    if(clearBtn) {
        clearBtn.style.opacity = "1";
        clearBtn.style.pointerEvents = "auto";
    }

    // Generate List HTML
    listContainer.innerHTML = scanHistory.map(item => {
        let badgeStyle = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
        if (item.verdict === "DANGEROUS") badgeStyle = "text-red-400 border-red-500/20 bg-red-500/5";
        else if (item.verdict === "HIGH RISK") badgeStyle = "text-orange-400 border-orange-500/20 bg-orange-500/5";
        else if (item.verdict === "SUSPICIOUS") badgeStyle = "text-yellow-400 border-yellow-500/20 bg-yellow-500/5";
        else if (item.verdict === "LOW RISK") badgeStyle = "text-lime-400 border-lime-500/20 bg-lime-500/5";

        let displayUrl = item.url;
        try { displayUrl = new URL(item.url).hostname; } catch(e){}

        return `
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group mb-2">
            <div class="flex flex-col gap-0.5 min-w-0 mr-3">
                <span class="text-sm text-slate-300 font-mono truncate text-left w-full max-w-[140px]" title="${item.url}">
                    ${displayUrl}
                </span>
                <span class="text-[10px] text-slate-600 font-bold uppercase text-left">
                    ${item.time}
                </span>
            </div>
            <span class="text-[9px] font-bold px-2 py-1 rounded border ${badgeStyle} whitespace-nowrap shadow-sm">
                ${item.verdict}
            </span>
        </div>
        `;
    }).join('');
}