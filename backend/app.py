from flask import Flask, request, jsonify
from flask_cors import CORS
import psutil
import time

app = Flask(__name__)
CORS(app)

start_time = time.time()


@app.route("/api/stats", methods=["GET"])
def get_stats():
    uptime_seconds = int(time.time() - start_time)
    uptime_str = time.strftime("%H:%M:%S", time.gmtime(uptime_seconds))
    return jsonify(
        {
            "cpu": psutil.cpu_percent(),
            "memory_mb": f"{int(psutil.virtual_memory().used / (1024 * 1024))}MB",
            "memory_percent": psutil.virtual_memory().percent,
            "threads": psutil.cpu_count(),
            "uptime": uptime_str,
        }
    )


@app.route("/scan", methods=["POST"])
def scan_url():
    data = request.json
    target_url = data.get("url", "").lower()

    # Define a list of suspicious patterns
    suspicious_patterns = ["danger", "malicious", "verify", "login", "secure", ".xyz", "update-account"]
    
    # Check if any pattern exists in the URL
    is_suspicious = any(pattern in target_url for pattern in suspicious_patterns)

    if is_suspicious:
        result = {
            "status": "Danger",
            "reason": "Suspicious keywords or untrusted top-level domain (.xyz) detected.",
        }
    else:
        result = {
            "status": "Safe",
            "reason": "No suspicious patterns detected. The link appears clean.",
        }

    return jsonify(result)


# 🚀 This must always be at the very bottom
if __name__ == "__main__":
    app.run(port=5000, debug=True)
