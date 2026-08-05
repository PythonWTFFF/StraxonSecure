from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import random
import time
import json

app = FastAPI(
    title="StraxonSecure Core Engine",
    version="5.0.0",
    description="ML-powered anomaly detection and lab orchestration service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Docker client (optional) ──────────────────────────────────────────────────

try:
    import docker
    docker_client = docker.from_env()
    DOCKER_AVAILABLE = True
    print("[StraxonEngine] Docker connected ✓")
except Exception as e:
    print(f"[StraxonEngine] Docker not available: {e}")
    docker_client = None
    DOCKER_AVAILABLE = False

# ── ML Anomaly Detection ──────────────────────────────────────────────────────

# Try to use scikit-learn Isolation Forest; fall back to heuristic
ML_AVAILABLE = False
isolation_forest = None

try:
    import numpy as np
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import LabelEncoder

    # Feature extractors
    SEVERITY_MAP = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    KNOWN_ATTACK_TYPES = [
        "SQL Injection", "XSS", "RCE", "SSRF", "Command Injection",
        "Brute Force", "DDoS", "CSRF", "LFI", "XXE", "IDOR",
        "JWT Bypass", "Path Traversal", "IP_BLOCK",
    ]

    # Seed the model with synthetic "normal" baseline traffic
    rng = np.random.default_rng(42)
    normal_baseline = np.column_stack([
        rng.integers(0, 2, 500),       # severity (0=low, 1=medium)
        rng.integers(0, 5, 500),       # attack type index (common ones)
        rng.integers(0, 24, 500),      # hour of day
    ]).astype(float)

    isolation_forest = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42,
    )
    isolation_forest.fit(normal_baseline)
    ML_AVAILABLE = True
    print("[StraxonEngine] Isolation Forest ML model loaded ✓")

except ImportError:
    print("[StraxonEngine] scikit-learn not installed — using heuristic detection")

def extract_features(event: dict) -> list:
    """Extract numerical features from a SOC event for ML inference."""
    severity = SEVERITY_MAP.get(event.get("severity", "low"), 0) if ML_AVAILABLE else 0
    attack_type = event.get("attack_type", "")
    attack_idx = next(
        (i for i, t in enumerate(KNOWN_ATTACK_TYPES) if t.lower() in attack_type.lower()),
        len(KNOWN_ATTACK_TYPES)
    )
    hour = 12
    try:
        from datetime import datetime
        created = event.get("created_at", "")
        if created:
            hour = datetime.fromisoformat(created.replace("Z", "+00:00")).hour
    except Exception:
        pass
    return [severity, attack_idx, hour]

# ── Endpoints ─────────────────────────────────────────────────────────────────

class LabRequest(BaseModel):
    image: str
    port: int

@app.post("/api/labs/launch")
def launch_lab(req: LabRequest):
    if not DOCKER_AVAILABLE:
        raise HTTPException(status_code=500, detail="Docker is not available on this host.")
    try:
        # Stop any existing containers on that port
        for container in docker_client.containers.list(all=True):
            ports = container.attrs.get("NetworkSettings", {}).get("Ports", {})
            if ports:
                for p_key, p_val in ports.items():
                    if p_val and any(str(req.port) == p.get("HostPort") for p in p_val):
                        try:
                            container.stop(timeout=1)
                            container.remove()
                        except Exception:
                            pass

        container = docker_client.containers.run(
            req.image,
            detach=True,
            ports={"80/tcp": req.port},
            name=f"straxon_lab_{req.port}_{int(time.time())}",
        )
        return {"status": "success", "container_id": container.id, "port": req.port}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TelemetryData(BaseModel):
    events: List[dict]


@app.post("/api/ml/anomaly-detect")
def detect_anomalies(data: TelemetryData):
    """
    Anomaly detection using Isolation Forest (or heuristic fallback).
    Returns events with high anomaly scores.
    """
    anomalies = []

    for event in data.events:
        severity = event.get("severity", "low")
        is_critical = severity == "critical"
        anomaly_score = 0.0
        reason = ""

        if ML_AVAILABLE and isolation_forest is not None:
            try:
                features = np.array([extract_features(event)], dtype=float)
                # score_samples returns negative values; more negative = more anomalous
                raw_score = isolation_forest.score_samples(features)[0]
                # Normalize to 0-1 range (typical range is -0.5 to 0)
                anomaly_score = float(min(1.0, max(0.0, (-raw_score - 0.1) * 4)))
                reason = f"Isolation Forest score: {raw_score:.3f}"
            except Exception as ex:
                anomaly_score = 0.9 if is_critical else random.uniform(0.3, 0.7)
                reason = f"ML inference error: {ex}"
        else:
            # Heuristic fallback
            anomaly_score = 0.95 if is_critical else random.uniform(0.1, 0.6)
            if event.get("attack_type", "") in ["RCE", "Command Injection", "SSRF", "XXE"]:
                anomaly_score = min(1.0, anomaly_score + 0.3)
            reason = "Heuristic severity & attack-type scoring"

        # Threshold: flag if anomaly score > 0.7 or critical
        if anomaly_score > 0.70 or is_critical:
            anomalies.append({
                "event_id": event.get("id"),
                "anomaly_score": round(anomaly_score, 3),
                "severity": severity,
                "attack_type": event.get("attack_type"),
                "reason": reason,
                "ml_powered": ML_AVAILABLE,
            })

    # Sort by score descending
    anomalies.sort(key=lambda x: x["anomaly_score"], reverse=True)
    return {"anomalies": anomalies, "ml_model": "IsolationForest" if ML_AVAILABLE else "heuristic"}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "5.0.0",
        "ml_available": ML_AVAILABLE,
        "docker_available": DOCKER_AVAILABLE,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082, log_level="info")
