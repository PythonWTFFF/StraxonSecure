#!/usr/bin/env python3
"""
StraxonSecure ML Engine Startup Script
Run this to start the anomaly detection + lab orchestration service.

Usage:
  cd straxon-ml-engine
  pip install -r requirements.txt
  python start.py

Or with uvicorn directly:
  uvicorn main:app --host 0.0.0.0 --port 8082 --reload
"""

import subprocess
import sys
import os

def main():
    print("=" * 60)
    print("  StraxonSecure ML Engine v5.0.0")
    print("  Starting anomaly detection service on port 8082...")
    print("=" * 60)
    
    # Check if requirements are installed
    try:
        import fastapi
        import uvicorn
    except ImportError:
        print("[!] Missing dependencies. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    try:
        import sklearn
        print("[+] scikit-learn detected — Isolation Forest will be active")
    except ImportError:
        print("[!] scikit-learn not installed — falling back to heuristic detection")
        print("    To enable ML: pip install scikit-learn numpy")
    
    try:
        import docker
        client = docker.from_env()
        client.ping()
        print("[+] Docker socket connected — Lab containers will work")
    except Exception as e:
        print(f"[!] Docker not available: {e}")
        print("    Lab container spawning will be disabled")
    
    print()
    print("[*] Starting FastAPI on http://0.0.0.0:8082")
    print("[*] Endpoints:")
    print("      GET  /api/health")
    print("      POST /api/ml/anomaly-detect")
    print("      POST /api/labs/launch")
    print()
    
    # Start uvicorn
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8082,
        reload=True,
        log_level="info",
    )

if __name__ == "__main__":
    main()
