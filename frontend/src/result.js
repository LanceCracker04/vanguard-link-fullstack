import { riskLevels } from './config.js';
import { loadConfig } from "./storage.js";

// This stays here because renderGaugeResult calls it at the very top
function setAmbientBackground(score) {
    const body = document.body;
    body.classList.remove('mode-safe', 'mode-low', 'mode-suspicious', 'mode-high', 'mode-dangerous');

    if (score <= 20) body.classList.add('mode-safe');
    else if (score <= 40) body.classList.add('mode-low');
    else if (score <= 60) body.classList.add('mode-suspicious');
    else if (score <= 80) body.classList.add('mode-high');
    else body.classList.add('mode-dangerous');
}

export function renderGaugeResult(data) {
  // ✅ 1. TRIGGER AMBIENT BACKGROUND
  setAmbientBackground(data.score);

  // 2. Determine Risk Level
  const level = riskLevels.find(l => data.score >= l.min && data.score <= l.max) || riskLevels[4];
  
  // ✅ LOAD CONFIG
  const config = loadConfig();
  const showReasons = config.showRiskReasons !== false; // Default to true if undefined

  // 3. The Gauge HTML
  const gaugeHTML = `
    <div class="w-full flex flex-col items-center mb-5"> 
      <div class="text-center mb-6">
        <h1 class="text-6xl font-black ${level.color} drop-shadow-2xl">
          ${data.score}<span class="text-2xl text-gray-500 font-bold">/100</span>
        </h1>
       <div class="mt-2 inline-block px-6 py-2 rounded-full border border-gray-800 bg-gray-900/80 backdrop-blur-md">
           <span class="text-xl font-bold tracking-widest ${level.color} animate-status-breath block">
             ${level.label}
           </span>
        </div>
        <p class="text-gray-400 text-[10px] font-mono tracking-wider mt-2">
          SCANNED IN ${data.scanTime}ms
        </p>
      </div>

      <div class="w-full max-w-xl px-4 relative">
        <div class="h-4 w-full bg-gray-800 rounded-full relative overflow-hidden ring-1 ring-gray-700">
           <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-600 opacity-40"></div>
           
           <div class="absolute left-[20%] top-0 bottom-0 w-0.5 bg-gray-900/60"></div>
           <div class="absolute left-[40%] top-0 bottom-0 w-0.5 bg-gray-900/60"></div>
           <div class="absolute left-[60%] top-0 bottom-0 w-0.5 bg-gray-900/60"></div>
           <div class="absolute left-[80%] top-0 bottom-0 w-0.5 bg-gray-900/60"></div>
        </div>

        <div class="flex justify-between w-full mt-2 text-[10px] font-mono uppercase tracking-wider px-1">
           <span class="text-emerald-500">Safe</span>
           <span class="text-lime-400">Low</span>
           <span class="text-yellow-400">Suspicious</span>
           <span class="text-orange-500">High</span>
           <span class="text-red-500">Dangerous</span>
        </div>

        <div id="gauge-marker" 
             class="absolute top-[-8px] -ml-3 w-6 h-9 transition-all duration-[1500ms] ease-out drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
             style="left: 0%;">
             <svg viewBox="0 0 24 24" fill="currentColor" class="text-gray-100 w-full h-full">
               <path d="M12 22L3 4h18l-9 18z" stroke="none" />
             </svg>
        </div>
      </div>
    </div>
  `;

  // --- REASONS LIST (CONDITIONAL) ---
  // ✅ Only generate this HTML if showReasons is TRUE
  const reasonsHTML = showReasons ? `
      <div class="w-full bg-[#0f172a]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(37,99,235,0.15)] mt-4 relative overflow-hidden group">
        
        <div class="absolute inset-0 bg-[linear-gradient(rgba(18,16,11,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 opacity-20 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>

        <div class="relative z-10 flex justify-between items-center border-b border-blue-500/30 pb-4 mb-5">
            <h3 class="text-white text-sm font-bold uppercase tracking-widest font-mono flex items-center gap-3">
               <svg class="w-5 h-5 text-blue-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               Analysis Report
            </h3>
            <span class="${level.color} text-xs font-bold uppercase tracking-wider">${level.msg}</span>
        </div>

        <div class="relative z-10 max-h-[280px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
          ${(data.reasons || []).map(r => `
            <div class="p-3 bg-blue-900/10 rounded-xl border border-blue-500/20 hover:bg-blue-900/20 transition-all hover:border-blue-500/40 group/item">
              <div class="flex items-start gap-3">
                
                <div class="mt-1.5 relative flex items-center justify-center w-2.5 h-2.5 flex-shrink-0">
                   <span class="absolute inline-flex h-full w-full rounded-full ${level.bg} opacity-75 animate-ping"></span>
                   <span class="relative inline-flex rounded-full h-2 w-2 ${level.bg} shadow-[0_0_10px_currentColor]"></span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="text-slate-200 font-medium text-xs leading-relaxed group-hover/item:text-white transition-colors">
                    ${r.text}
                  </div>
                  
                  <div class="flex items-center gap-4 mt-2 border-t border-white/5 pt-2">
                    <div class="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        <span class="text-blue-500/70 font-bold">WT:</span> 
                        <span class="text-slate-300 bg-slate-800/50 px-1 rounded">${r.weight}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        <span class="text-blue-500/70 font-bold">SIG:</span> 
                        <span class="text-slate-300 bg-slate-800/50 px-1 rounded truncate max-w-[100px]">${r.signal}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          `).join("")}
        </div>
      </div>
  ` : ''; // If showReasons is false, return empty string

  // --- TECH DETAILS (optional) ---
  const techDetailsHTML = config.showTechDetails ? `
    <div class="mt-4 p-3 bg-[#071124]/60 border border-blue-500/20 rounded-lg text-xs font-mono text-slate-300 space-y-1">
      <div><span class="opacity-60">Scan Mode:</span> Heuristic</div>
      <div><span class="opacity-60">Checks Executed:</span> ${data.reasons?.length ?? 0}</div>
      <div><span class="opacity-60">Scan Time:</span> ${data.scanTime}ms</div>
      <div><span class="opacity-60">Sensitivity:</span> Standard</div>
    </div>
  ` : '';

 // 4. Assemble Full Result (Cyberpunk UI Upgrade)
 const resultHTML = `
   <div class="flex flex-col items-center justify-center animate-fade-in w-full max-w-3xl px-4 py-6">
     
     ${gaugeHTML}

     ${data.detectedCategory ? `
     <div class="mb-6 animate-fade-in-down" style="animation-delay: 100ms">
       <div class="relative group">
           <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
           <span class="relative px-6 py-2 rounded-full border border-blue-500/30 bg-[#0f172a] text-blue-400 text-xs font-bold uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Target: ${data.detectedCategory}
           </span>
       </div>
     </div>` : ''}

     ${reasonsHTML}  <div class="flex flex-wrap justify-center gap-3 mt-8 w-full">
       
       <button onclick="resetScanner()" class="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg hover:shadow-blue-500/20">
         Scan Another
       </button>

       <button id="copyReportBtn" class="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-200 text-sm font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition-all">
         Copy Report
       </button>

       
       <button onclick="runDeepSearch()" class="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-sm font-semibold rounded-lg border border-slate-700 hover:border-blue-500/30 transition-all flex items-center gap-2">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
          Verify
       </button>
     </div>

       <p class="text-[10px] text-gray-500 mt-6 text-center opacity-60 max-w-md mx-auto leading-relaxed">
         DISCLAIMER: VanGuard Link uses heuristic analysis to estimate risk. 
         A "Safe" or "Low Risk" result does not guarantee safety. 
         Always verify the URL source before entering sensitive information.
       </p>
       ${techDetailsHTML}
     </div>
   </div>
 `;

  mainContainer.innerHTML = resultHTML;

  // 5. TRIGGER ANIMATION
  setTimeout(() => {
    const marker = document.getElementById('gauge-marker');
    if(marker) {
      marker.style.left = `${data.score}%`;
    }
  }, 100);

}