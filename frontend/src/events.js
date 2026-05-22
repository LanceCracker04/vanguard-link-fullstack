// ==========================================
// EVENT LISTENER SETUP
// ==========================================

/**
 * Setup all event listeners for the application
 */
export function setupEventListeners() {
    console.log("🔗 Event Listeners Initialized");

    // // Get DOM elements
    // const scanBtn = document.getElementById("scanButton");
    // const urlInput = document.getElementById("urlInput");

    // // Attach scan button listener
    // if (scanBtn && urlInput) {
    //     scanBtn.addEventListener("click", async () => {
    //         const url = urlInput.value.trim();
    //         if (!url) {
    //             alert("Please enter a URL first.");
    //             return;
    //         }

    //         try {
    //             // Import the necessary functions
    //             const { runScanSequence } = await import('./ui.js');
    //             const { renderGaugeResult } = await import('./result.js');
    //             const { addToHistory } = await import('./history.js');

    //             // Show scanning animation
    //             runScanSequence({ score: 50, scanTime: 0, reasons: [] });

    //             // Fetch result from Python backend
    //             const response = await fetch('http://127.0.0.1:5000/scan', {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({ url: url })
    //             });

    //             const pythonResult = await response.json();

    //             // Format result for UI
    //             const finalData = {
    //                 score: pythonResult.status === "Danger" ? 95 : 10,
    //                 scanTime: 850,
    //                 reasons: [{ 
    //                     text: pythonResult.reason || "Analysis complete", 
    //                     weight: "HIGH", 
    //                     signal: "PYTHON_CHECK" 
    //                 }],
    //                 detectedCategory: pythonResult.status
    //             };

    //             // 🔥 THE MAGIC TRICK: Wait 1.5 seconds so the animation plays
    //             setTimeout(() => {
    //                 renderGaugeResult(finalData);
    //                 addToHistory(url, finalData);
    //             }, 1500); 

    //         } catch (err) {
    //             console.error("❌ Scan failed:", err);
    //             alert("Is your Python server running at http://127.0.0.1:5000?");
    //         }
    //     });
    // }
}
