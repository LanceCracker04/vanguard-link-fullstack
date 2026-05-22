import "./style.css";

import { setupEventListeners } from "./events.js";
import { updateHistoryUI } from "./history.js";
import { setupVisualEffects } from "./ui.js";

console.log("🚀 System Booting...");

document.addEventListener("DOMContentLoaded", () => {
  setupVisualEffects();
  setupEventListeners();
  updateHistoryUI();
});

