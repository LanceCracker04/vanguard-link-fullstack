# VanGuard Link: Advanced Link Protection

A security tool designed to analyze suspicious URLs and surface link risk before users click.

## Tech Stack

- Vite + Vanilla JavaScript (Frontend)
- Flask (Backend)
- Python (Logic)

## Key Features

- Clean, high-contrast UI for fast URL scanning
- Heuristic URL analysis with instant risk feedback
- Live front-end interface connected to a Flask API
- Risk scoring and verdict display for safe vs. dangerous links
- Lightweight backend using Python and psutil-ready diagnostics

## How to Run

### Backend
1. Open a terminal in `backend`
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the API server:
   ```bash
   python app.py
   ```

### Frontend
1. Open a terminal in `frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the UI:
   ```bash
   npm run dev
   ```

### Use the App

- Open the local Vite URL shown in the terminal (usually `http://127.0.0.1:4173`)
- Enter a URL and click `SCAN LINK`
- The app will display a risk verdict and analysis

## Screenshots

![VanGuard Link UI](screenshot.png)

---

> Note: The scanner is heuristic and designed for demonstration. Always verify URLs manually before clicking.
