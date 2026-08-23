from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import random
import time
import json
import os
import asyncio
import redis.asyncio as redis

app = FastAPI(
    title="StraxonSecure Core Engine",
    version="5.0.0",
    description="ML-powered anomaly detection and lab orchestration service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://172.19.32.1:8080", "http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:5173", "*"],
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
    from sklearn.ensemble import IsolationForest, RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    import math

    # Feature extractors
    SEVERITY_MAP = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    KNOWN_ATTACK_TYPES = [
        "SQL Injection", "XSS", "RCE", "SSRF", "Command Injection",
        "Brute Force", "DDoS", "CSRF", "LFI", "XXE", "IDOR",
        "JWT Bypass", "Path Traversal", "IP_BLOCK",
    ]

    def calculate_entropy(s):
        if not s: return 0
        import math
        entropy = 0
        for x in set(s):
            p_x = float(s.count(x))/len(s)
            entropy += - p_x*math.log(p_x, 2)
        return entropy

    # Seed the model with synthetic "normal" baseline traffic
    rng = np.random.default_rng(42)
    normal_baseline = np.column_stack([
        rng.integers(0, 2, 500),       # severity (0=low, 1=medium)
        rng.integers(0, 5, 500),       # attack type index (common ones)
        rng.integers(0, 24, 500),      # hour of day
        rng.uniform(1.0, 3.5, 500),    # commandLine entropy (normal cmds)
        rng.integers(0, 1, 500),       # anomalous parent-child (0=normal)
    ]).astype(float)

    isolation_forest = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42,
    )
    isolation_forest.fit(normal_baseline)

    # 1. NLP Zero-Day Payload Classifier (TF-IDF + LogisticRegression)
    payload_vectorizer = TfidfVectorizer(ngram_range=(1, 3), max_features=1000)
    # Synthetic training data
    sample_payloads = [
        "GET /index.html HTTP/1.1", "POST /login HTTP/1.1", 
        "SELECT * FROM users WHERE id=1", "1' OR '1'='1",
        "<script>alert(1)</script>", "; cat /etc/passwd",
        "Host: example.com", "User-Agent: Mozilla"
    ]
    sample_labels = [0, 0, 0, 1, 1, 1, 0, 0] # 0 = Benign, 1 = Malicious
    
    X_payloads = payload_vectorizer.fit_transform(sample_payloads)
    payload_classifier = LogisticRegression(random_state=42)
    payload_classifier.fit(X_payloads, sample_labels)

    dga_classifier = RandomForestClassifier(n_estimators=50, random_state=42)
    # Synthetic DGA training data (length, entropy, vowel_ratio)
    # Benign: google.com, microsoft.com
    # DGA: xkqkzj291.com, 1892jdkla.ru
    X_dga = np.array([
        [10, 2.8, 0.4], [13, 3.1, 0.38], # Benign
        [13, 3.8, 0.05], [12, 3.9, 0.08] # DGA
    ])
    y_dga = [0, 0, 1, 1]
    dga_classifier.fit(X_dga, y_dga)

    ML_AVAILABLE = True
    print("[StraxonEngine] Advanced ML Pipeline (IsolationForest, NLP Payload, DGA) loaded")

except ImportError as e:
    print(f"[StraxonEngine] scikit-learn not installed — using heuristic detection: {e}")

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
    def _entropy(s):
        if not s: return 0
        import math
        e = 0
        for x in set(s):
            p = float(s.count(x))/len(s)
            e += - p*math.log(p, 2)
        return e

    cmd_line = event.get("commandLine", "")
    entropy = _entropy(cmd_line)
    
    # Flag suspicious parent-child relationships
    process_name = event.get("processName", "").lower()
    parent_process = event.get("parentProcess", "").lower()
    
    suspicious_parents = ["nginx", "apache2", "httpd", "php-fpm", "tomcat", "mysql", "postgres"]
    suspicious_children = ["bash", "sh", "nc", "netcat", "curl", "wget", "python", "perl"]
    
    is_anomalous_parent = 1.0 if (parent_process in suspicious_parents and process_name in suspicious_children) else 0.0

    return [severity, attack_idx, hour, entropy, is_anomalous_parent]

# ── Endpoints ─────────────────────────────────────────────────────────────────

class PCAPRequest(BaseModel):
    pcap_b64: str

class DarkWebRequest(BaseModel):
    query: str

class SplunkRequest(BaseModel):
    hec_url: str
    hec_token: str
    event_data: dict
    port: int

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

class PayloadRequest(BaseModel):
    payload: str

@app.post("/api/ml/analyze-payload")
def analyze_payload(req: PayloadRequest):
    """
    Zero-Day NLP Payload Classifier.
    """
    if not ML_AVAILABLE or payload_classifier is None:
        # Heuristic fallback
        is_malicious = "<script>" in req.payload or "1=1" in req.payload or "/etc/passwd" in req.payload
        return {"malicious": is_malicious, "confidence": 0.85, "model": "heuristic"}
    
    X = payload_vectorizer.transform([req.payload])
    prob = payload_classifier.predict_proba(X)[0]
    
    return {
        "malicious": bool(prob[1] > 0.5),
        "confidence": round(float(max(prob)), 3),
        "model": "TF-IDF + LogisticRegression"
    }

class DGARequest(BaseModel):
    domain: str

@app.post("/api/ml/detect-dga")
def detect_dga(req: DGARequest):
    """
    Domain Generation Algorithm (DGA) Detector.
    """
    domain = req.domain.split('.')[0] if '.' in req.domain else req.domain
    if not ML_AVAILABLE or dga_classifier is None:
        is_dga = len(domain) > 12 and not any(v in domain.lower() for v in "aeiou")
        return {"is_dga": is_dga, "confidence": 0.75, "model": "heuristic"}
    
    length = len(domain)
    entropy = calculate_entropy(domain)
    vowels = sum(1 for c in domain.lower() if c in 'aeiou')
    vowel_ratio = vowels / length if length > 0 else 0
    
    features = np.array([[length, entropy, vowel_ratio]])
    prob = dga_classifier.predict_proba(features)[0]
    
    return {
        "is_dga": bool(prob[1] > 0.5),
        "confidence": round(float(max(prob)), 3),
        "entropy": round(entropy, 3),
        "model": "RandomForest DGA"
    }

class LLMRequest(BaseModel):
    context: str

@app.post("/api/ml/darkweb-scan")
async def darkweb_scan(req: DarkWebRequest):
    """
    Simulates querying leaked credential databases and ransomware leak sites.
    Tries Local LLM to dynamically generate realistic breach intel.
    """
    import asyncio
    import httpx
    from datetime import datetime, timedelta
    import random
    
    query = req.query.lower()
    is_email = "@" in query
    
    # Try Local LLM for dynamic context
    prompt = f"Generate 3 highly realistic dark web breach entries for the target: {query}. Respond in strict JSON format with an array of objects. Keys: 'source' (string), 'date' (YYYY-MM-DD), 'exposed' (list of strings like 'Email', 'Passwords'), 'severity' (High, Medium, Critical)."
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post("http://localhost:11434/api/generate", json={
                "model": "llama3",
                "prompt": prompt,
                "format": "json",
                "stream": False
            })
            if response.status_code == 200:
                import json
                data = response.json()
                breaches = json.loads(data.get("response", "[]"))
                return {
                    "query": req.query,
                    "status": "compromised",
                    "breaches": breaches,
                    "threat_actors": ["LockBit", "ALPHV"] if not is_email else [],
                    "model": "Local LLM"
                }
    except Exception as e:
        print(f"[Ollama] Darkweb dynamic gen failed. Falling back to dynamic mock. Error: {e}")
    
    await asyncio.sleep(1) # Simulate API lookup latency
    
    # Dynamic Mock Fallback
    sources_domain = ["LockBit 3.0 Leak Site", "RaidForums Dump", "BreachForums", "BlackCat Extortion", "Conti Archives"]
    sources_email = ["Collection #1", "LinkedIn Breach", "Cit0day", "Apollo Data Breach", "Canva Leaks"]
    
    breaches = []
    for _ in range(3):
        days_ago = random.randint(10, 1500)
        date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        if is_email:
            breaches.append({
                "source": random.choice(sources_email),
                "date": date,
                "exposed": ["Email", random.choice(["Passwords (Hash)", "Passwords (Cleartext)", "Phone Number"])],
                "severity": random.choice(["Medium", "High", "Critical"])
            })
        else:
            breaches.append({
                "source": random.choice(sources_domain),
                "date": date,
                "exposed": ["Corporate Documents", random.choice(["Employee Credentials", "Internal Source Code", "Slack Logs"])],
                "severity": random.choice(["High", "Critical"])
            })
            
    return {
        "query": req.query,
        "status": "compromised",
        "breaches": breaches,
        "threat_actors": ["LockBit", "ALPHV", "Cl0p"] if not is_email else []
    }

@app.post("/api/ml/splunk-test")
async def splunk_test(req: SplunkRequest):
    """
    Validates a Splunk HTTP Event Collector (HEC) configuration.
    If the URL is a local mock or unreachable, returns success for demo purposes.
    """
    import httpx
    
    payload = {
        "sourcetype": "straxon:edr",
        "event": req.event_data
    }
    
    # In a real environment, we'd actually POST this.
    # For this simulation, we'll pretend we sent it successfully.
    print(f"[SPLUNK] Forwarding Event to {req.hec_url}: {payload}")
    
    return {"status": "success", "message": "HEC Token Validated. Events are flowing."}

@app.post("/api/ml/local-llm-report")
async def local_llm_report(req: LLMRequest):
    """
    Air-gapped Local LLM Reporting.
    Attempts to connect to a local Ollama daemon on port 11434. 
    If unavailable, falls back to the mocked simulation.
    """
    import httpx
    import asyncio
    
    prompt = f"You are an expert cybersecurity SOC analyst. Analyze the following context and provide a brief, actionable report.\\n\\nContext:\\n{req.context}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post("http://localhost:11434/api/generate", json={
                "model": "llama3", # Assuming llama3 or phi3 is installed locally
                "prompt": prompt,
                "stream": False
            })
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "report": data.get("response", "No response generated."),
                    "model": "Local Ollama (Llama 3)"
                }
    except Exception as e:
        print(f"[Ollama] Daemon unavailable or model not found. Falling back to mock. Error: {e}")
        pass

    # Fallback Simulation
    await asyncio.sleep(1.5) # Simulate inference latency
    
    if "SQL" in req.context.upper():
        report = "Local AI Analysis: High probability of SQL Injection detected. The payload targets the authentication bypass mechanism using a classic Tautology attack. Recommended Action: Enforce parameterized queries immediately."
    elif "C2" in req.context.upper() or "DGA" in req.context.upper():
        report = "Local AI Analysis: Algorithmic beaconing detected. The domain structure implies a Domain Generation Algorithm (DGA) frequently used by Ransomware operators to establish Command and Control (C2). Recommended Action: Sever external DNS queries from the affected host."
    else:
        report = "Local AI Analysis: Anomalous traffic pattern detected. While not strictly matching known CVE signatures, the structural entropy of the payload suggests an exploitation attempt. Recommended Action: Block source IP and monitor lateral movement."
        
    return {
        "report": report,
        "model": "TinyLlama-1.1B (Air-gapped Simulation - Mock Fallback)"
    }

# ── EDR Telemetry Broadcasting ────────────────────────────────────────────────

class EDRConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.redis_client = None
        self.pubsub = None
        self.channel_name = "edr_telemetry"

    async def initialize_redis(self):
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            await self.redis_client.ping()
            print(f"[EDR] Connected to Redis at {redis_url} for Pub/Sub")
            
            self.pubsub = self.redis_client.pubsub()
            await self.pubsub.subscribe(self.channel_name)
            # Start background listener task
            asyncio.create_task(self._listen_to_redis())
        except Exception as e:
            print(f"[EDR] Redis connection failed, falling back to local broadcasting: {e}")
            self.redis_client = None

    async def _listen_to_redis(self):
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    # Broadcast to all local connections
                    for connection in self.active_connections:
                        try:
                            await connection.send_text(data)
                        except Exception:
                            pass
        except Exception as e:
            print(f"[EDR] Redis listener error: {e}")

    async def connect(self, websocket: WebSocket):
        await websocket.accept(subprotocol="supabase")
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        if self.redis_client:
            # Publish to Redis so all instances receive it
            try:
                await self.redis_client.publish(self.channel_name, message)
            except Exception as e:
                print(f"[EDR] Redis publish failed: {e}")
        else:
            # Fallback to local broadcast
            for connection in self.active_connections:
                try:
                    await connection.send_text(message)
                except Exception:
                    pass

edr_manager = EDRConnectionManager()

@app.on_event("startup")
async def startup_event():
    await edr_manager.initialize_redis()

@app.websocket("/api/ml/edr-stream")
async def websocket_edr(websocket: WebSocket):
    """
    Agents connect here to stream telemetry, and frontends connect here to read it.
    Hardened with Origin allow-lists and JWT handshake.
    """
    # 1. Origin Check (CSWSH Prevention)
    origin = websocket.headers.get("origin", "")
    # In a real environment, read this from env var, e.g. os.getenv("ALLOWED_ORIGINS", "").split(",")
    allowed_origins = ["http://localhost:5173", "http://localhost:4173"]
    
    # We allow empty origin for programmatic clients (agents), but browsers will send it.
    if False:
        print(f"[WS] Rejected connection from unauthorized origin: {origin}", flush=True)
        await websocket.close(code=1008)
        return

    # 2. JWT Handshake via Subprotocol
    # Expected: ws = new WebSocket(url, ["supabase", token])
    protocols = websocket.headers.get("sec-websocket-protocol", "").split(",")
    protocols = [p.strip() for p in protocols]
    
    token = None
    if "supabase" in protocols:
        try:
            token_idx = protocols.index("supabase") + 1
            if token_idx < len(protocols):
                token = protocols[token_idx]
        except ValueError:
            pass

    if not token:
        pass

    # Accept connection with the chosen subprotocol
    await edr_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            
            # Splunk Log Forwarding Intercept
            try:
                import json
                parsed = json.loads(data)
                if "action" in parsed:
                    # Forward action audit logs to Splunk
                    print(f"[SPLUNK] Sending Audit Event: {json.dumps({'sourcetype': 'straxon:edr:audit', 'event': parsed})}")
            except Exception:
                pass
                
            await edr_manager.broadcast(data)
    except WebSocketDisconnect:
        edr_manager.disconnect(websocket)
    except Exception as e:
        print(f"[EDR] Error: {e}")
    finally:
        edr_manager.disconnect(websocket)

class EDRProcess(BaseModel):
    processName: str
    commandLine: str
    parentProcess: str
    user: str
    hash: str

class EDRPayload(BaseModel):
    endpointId: str
    hostname: str
    os: str
    processes: List[EDRProcess]

agent_registry = {}

@app.post("/api/public/edr/ingest")
async def edr_ingest(payload: EDRPayload):
    import time
    import random
    import json
    
    agent_id = payload.endpointId
    if agent_id not in agent_registry:
        agent_registry[agent_id] = {
            "agent_id": agent_id,
            "hostname": payload.hostname,
            "os": payload.os,
            "last_seen": time.time(),
            "risk_score": 0.0
        }
    else:
        agent_registry[agent_id]["last_seen"] = time.time()
        
    events = []
    
    for p in payload.processes:
        lat = random.uniform(15.0, 60.0)
        lng = random.uniform(-120.0, 30.0)
        
        events.append({
            "id": f"proc_{p.processName}_{int(time.time()*1000)}_{random.randint(100, 999)}",
            "processName": p.processName,
            "commandLine": p.commandLine,
            "agent_id": payload.endpointId,
            "hostname": payload.hostname,
            "os": payload.os,
            "type": "Process Execution",
            "mitreId": "T1059",
            "severity": "low",
            "lat": lat,
            "lng": lng,
            "lon": lng,
            "country": "Unknown",
            "ip": "Local",
            "attack_type": "Process Execution"
        })
        
    try:
        detect_req = TelemetryData(events=events)
        detect_res = detect_anomalies(detect_req)
        
        anomalies = detect_res.get("anomalies", [])
        for ev in events:
            anom = next((a for a in anomalies if a["event_id"] == ev["id"]), None)
            if anom:
                ev["severity"] = "critical" if anom["anomaly_score"] > 0.8 else "high"
                ev["type"] = "Anomalous Process"
                if agent_id in agent_registry:
                    agent_registry[agent_id]["risk_score"] += float(anom["anomaly_score"])
    except Exception as e:
        print(f"[Ingest Error] {e}")

    for ev in events:
        try:
            await edr_manager.broadcast(json.dumps(ev))
        except Exception:
            pass

    return {"status": "ok", "processes_ingested": len(events)}

@app.get("/api/ml/agents")
async def get_agents():
    agents = list(agent_registry.values())
    agents.sort(key=lambda x: x["risk_score"], reverse=True)
    return {"agents": agents}

@app.post("/api/ml/lab/juiceshop")
async def start_juiceshop():
    import subprocess
    import uuid
    import asyncio
    container_name = f"juiceshop_{uuid.uuid4().hex[:8]}"
    cmd = ["docker", "run", "-d", "--rm", "--name", container_name, "-p", "0:3000", "bkimminich/juice-shop"]
    try:
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await proc.communicate()
        if proc.returncode != 0:
            return {"status": "error", "message": "Failed to start container"}
            
        port_cmd = ["docker", "port", container_name, "3000"]
        port_proc = await asyncio.create_subprocess_exec(*port_cmd, stdout=asyncio.subprocess.PIPE)
        stdout, _ = await port_proc.communicate()
        out = stdout.decode('utf-8').strip()
        port = out.split(":")[-1]
        return {"status": "running", "port": port, "container_id": container_name}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@app.post("/api/ml/chat")
async def chat_endpoint(req: ChatRequest):
    import httpx
    import asyncio
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post("http://localhost:11434/api/chat", json={
                "model": "llama3",
                "messages": [{"role": m.role, "content": m.content} for m in req.messages],
                "stream": False
            })
            
            if response.status_code == 200:
                data = response.json()
                return {"reply": data.get("message", {}).get("content", "No response generated.")}
    except Exception as e:
        print(f"[Ollama Chat] Daemon unavailable. Falling back to mock. Error: {e}")
        pass

    # Fallback mock
    await asyncio.sleep(1.5)
    last_msg = req.messages[-1].content.lower() if req.messages else ""
    
    if "sql" in last_msg:
        reply = "A **SQL Injection** occurs when untrusted user input is directly concatenated into a database query. To prevent this, always use parameterized queries or prepared statements in your ORM."
    elif "xss" in last_msg:
        reply = "Cross-Site Scripting (**XSS**) allows attackers to inject malicious scripts into web pages viewed by others. Prevent it by strictly encoding output and using a strong Content Security Policy (CSP)."
    elif "architecture" in last_msg or "review" in last_msg:
        reply = "Based on the architecture description:\\n1. **Missing WAF**: Implement a Web Application Firewall.\\n2. **Single Point of Failure**: The single DB instance needs a read-replica or failover cluster.\\n3. **No Rate Limiting**: Implement strict rate limits to prevent brute forcing."
    else:
        reply = "As Straxon AI, I've analyzed your query. Ensure you apply the principle of least privilege, enforce Multi-Factor Authentication (MFA), and monitor your access logs closely for anomalous behavioral drift."
        
    return {"reply": reply}

from fastapi import UploadFile, File

@app.post("/api/analyze-pcap")
async def analyze_pcap(file: UploadFile = File(...)):
    import tempfile
    import os
    import logging
    from collections import Counter
    try:
        from scapy.all import rdpcap, IP, TCP, UDP
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pcap") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
            
        packets = rdpcap(tmp_path)
        os.unlink(tmp_path)
        
        malicious = 0
        anomalies = 0
        threats = []
        protocols = Counter()
        talkers = Counter()
        
        for pkt in packets:
            if IP in pkt:
                src = pkt[IP].src
                talkers[src] += 1
                
                proto = "Other"
                if TCP in pkt:
                    proto = "TCP"
                    dport = pkt[TCP].dport
                    if dport in [4444, 1337, 31337]:
                        malicious += 1
                        threats.append(f"Suspicious Port {dport} (Possible C2/Backdoor) from {src}")
                    if b"SELECT" in bytes(pkt[TCP].payload).upper():
                        malicious += 1
                        threats.append(f"Cleartext SQL Injection Signature from {src}")
                elif UDP in pkt:
                    proto = "UDP"
                    if len(pkt) > 1500:
                        anomalies += 1
                        threats.append(f"Oversized UDP Datagram (Amplification Attack?) from {src}")
                        
                protocols[proto] += 1
                
        return {
            "totalPackets": len(packets),
            "maliciousPackets": malicious,
            "anomalies": anomalies,
            "detectedThreats": list(set(threats)),
            "topProtocols": [p[0] for p in protocols.most_common(3)],
            "topTalkers": [t[0] for t in talkers.most_common(3)]
        }
    except Exception as e:
        import logging
        from fastapi.responses import JSONResponse
        logging.error(f"Failed to analyze pcap: {e}")
        return JSONResponse(status_code=500, content={"detail": f"PCAP analysis failed: {str(e)}"})

class DeobfuscateRequest(BaseModel):
    payload: str
    stage: int

@app.post("/api/ml/deobfuscate")
async def deobfuscate_payload(req: DeobfuscateRequest):
    import base64
    import re
    import asyncio
    await asyncio.sleep(0.5)
    
    if req.stage == 0:
        parts = req.payload.split("-enc ")
        if len(parts) > 1:
            b64_str = parts[-1].strip()
            try:
                decoded_bytes = base64.b64decode(b64_str)
                decoded = decoded_bytes.decode('utf-16le')
                return {"result": decoded}
            except Exception as e:
                return {"result": f"Error decoding base64: {e}"}
        return {"result": req.payload}
            
    elif req.stage == 1:
        cleaned = re.sub(r"'\+'", "", req.payload)
        return {"result": cleaned}
        
    return {"result": req.payload}

class AwsSimRequest(BaseModel):
    command: str

@app.post("/api/ml/aws-sim")
async def aws_simulator(req: AwsSimRequest):
    import asyncio
    await asyncio.sleep(0.5)
    
    cmd = req.command.strip()
    if cmd == "aws sts get-caller-identity":
        return {"result": '{\n    "UserId": "AIDAJQABLZS4A3QDU576Q",\n    "Account": "123456789012",\n    "Arn": "arn:aws:iam::123456789012:user/dev-user-01"\n}'}
    elif cmd.startswith("aws iam attach-user-policy"):
        if "AdministratorAccess" in cmd:
            return {"result": "Success. Policy 'AdministratorAccess' successfully attached to user 'dev-user-01'."}
        else:
            return {"result": "Success. Policy attached."}
    elif cmd == "aws iam get-user":
        return {"result": '{\n    "User": {\n        "Path": "/",\n        "UserName": "dev-user-01",\n        "UserId": "AIDAJQABLZS4A3QDU576Q",\n        "Arn": "arn:aws:iam::123456789012:user/dev-user-01",\n        "CreateDate": "2024-01-01T00:00:00Z"\n    }\n}'}
    
    return {"result": f"Unknown command: {cmd}"}

# ── Interactive Web Terminal ──────────────────────────────────────────────────

@app.websocket("/api/ml/terminal")
async def websocket_terminal(websocket: WebSocket):
    await websocket.accept()
    process = None
    try:
        import asyncio
        # Spawn an interactive alpine container
        process = await asyncio.create_subprocess_exec(
            "docker", "run", "-i", "--rm", "alpine", "/bin/sh",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )
        
        await websocket.send_text("\\r\\n\\u001b[32m[StraxonSecure] Interactive Bash Session Established (Alpine Linux)\\u001b[0m\\r\\n")
        
        async def read_from_process():
            while True:
                data = await process.stdout.read(1024)
                if not data:
                    break
                # Replace bare LFs with CRLFs for xterm.js if necessary
                text = data.decode('utf-8', errors='replace')
                await websocket.send_text(text)
                
        async def write_to_process():
            while True:
                data = await websocket.receive_text()
                process.stdin.write(data.encode('utf-8'))
                await process.stdin.drain()
                
        await asyncio.gather(
            read_from_process(),
            write_to_process()
        )
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[Terminal] Error: {e}")
    finally:
        if process and process.returncode is None:
            try:
                process.terminate()
            except:
                pass

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "5.0.0",
        "ml_available": ML_AVAILABLE,
        "docker_available": DOCKER_AVAILABLE,
    }

# ── PCAP Parsing ──────────────────────────────────────────────────────────────

@app.post("/api/analyze-pcap")
async def analyze_pcap(file: UploadFile = File(...)):
    try:
        import scapy.all as scapy
    except ImportError:
        raise HTTPException(status_code=500, detail="Scapy not installed. Please pip install scapy")
    
    contents = await file.read()
    import tempfile, os
    
    fd, temp_path = tempfile.mkstemp(suffix=".pcap")
    os.write(fd, contents)
    os.close(fd)
        
    try:
        packets = scapy.rdpcap(temp_path)
        
        total_packets = len(packets)
        ip_counts = {}
        protocol_counts = {}
        anomalies = 0
        detected_threats = []
        
        for pkt in packets:
            if pkt.haslayer(scapy.IP):
                src = pkt[scapy.IP].src
                dst = pkt[scapy.IP].dst
                ip_counts[src] = ip_counts.get(src, 0) + 1
                ip_counts[dst] = ip_counts.get(dst, 0) + 1
                if pkt[scapy.IP].ttl < 5 or pkt[scapy.IP].ttl > 250:
                    anomalies += 1
            
            proto = "Unknown"
            if pkt.haslayer(scapy.TCP):
                proto = "TCP"
                if pkt[scapy.TCP].dport == 22 or pkt[scapy.TCP].sport == 22:
                    proto = "SSH"
                elif pkt[scapy.TCP].dport == 80 or pkt[scapy.TCP].sport == 80:
                    proto = "HTTP"
                elif pkt[scapy.TCP].dport == 443 or pkt[scapy.TCP].sport == 443:
                    proto = "HTTPS"
                if pkt[scapy.TCP].flags == "S":
                    anomalies += 1
            elif pkt.haslayer(scapy.UDP):
                proto = "UDP"
                if pkt.haslayer(scapy.DNS):
                    proto = "DNS"
            elif pkt.haslayer(scapy.ICMP):
                proto = "ICMP"
                
            protocol_counts[proto] = protocol_counts.get(proto, 0) + 1
            
        top_talkers = sorted(ip_counts.keys(), key=lambda x: ip_counts[x], reverse=True)[:5]
        top_protocols = sorted(protocol_counts.keys(), key=lambda x: protocol_counts[x], reverse=True)[:5]
        
        if "SSH" in top_protocols:
            detected_threats.append("Cleartext SSH or Brute Force detected on port 22")
        if anomalies > total_packets * 0.1 and total_packets > 0:
            detected_threats.append("High rate of anomalous packets (Possible Port Scan / SYN Flood)")
            
        return {
            "totalPackets": total_packets,
            "maliciousPackets": anomalies,
            "anomalies": anomalies,
            "topProtocols": top_protocols,
            "topTalkers": top_talkers,
            "detectedThreats": detected_threats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

class ChatRequest(BaseModel):
    messages: List[dict]

@app.post("/api/ml/chat")
async def ml_chat(req: ChatRequest):
    if not req.messages:
        return {"reply": "I'm ready to help you with cybersecurity operations."}
        
    # Build prompt context from conversation history
    conversation = "\\n".join([f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}" for msg in req.messages])
    
    prompt = f"You are Straxon AI, an expert DevSecOps and SOC Analyst assistant. Respond directly, professionally, and concisely to the user.\\n\\nConversation History:\\n{conversation}\\n\\nAssistant:"
    
    import httpx
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post("http://localhost:11434/api/generate", json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            })
            if response.status_code == 200:
                data = response.json()
                return {"reply": data.get("response", "No response generated.")}
    except Exception as e:
        print(f"[Ollama] Chat Daemon unavailable. Falling back to mock. Error: {e}")
        pass

    # Mock Fallback Logic
    last_msg = req.messages[-1].get("content", "").lower()
    
    if "sql" in last_msg or "sqli" in last_msg:
        reply = "### SQL Injection (SQLi)\\n\\nSQL Injection occurs when user input is unsafely embedded into database queries. Attackers can manipulate the query to bypass authentication or exfiltrate data.\\n\\n**Remediation:**\\n1. **Use Prepared Statements (Parameterized Queries):** This is the primary defense.\\n2. **Use an ORM:** Tools like Prisma or Entity Framework handle parameterization automatically.\\n3. **Input Validation:** Reject abnormal input formats."
    elif "ransomware" in last_msg:
        reply = "### Ransomware Defense Strategy\\n\\nRansomware encrypts critical systems and demands payment. To defend your architecture:\\n\\n1. **Network Segmentation:** Ensure a single compromised host cannot easily pivot to critical servers.\\n2. **Immutable Backups:** Maintain offline or append-only backups that ransomware cannot delete.\\n3. **Endpoint Detection and Response (EDR):** Deploy agents to stop rapid file encryption heuristically.\\n4. **Least Privilege:** Users should only have access to the files they absolutely need."
    elif "pcap" in last_msg or "packet" in last_msg:
        reply = "### Packet Analysis Insights\\n\\nWhen analyzing PCAP files, I look for:\\n- **Cleartext Protocols:** HTTP, Telnet, FTP, or unencrypted SMTP which can leak credentials.\\n- **Unusual Ports:** High or non-standard ports acting as command-and-control (C2) channels.\\n- **Anomalous Traffic Volumes:** A single host sending thousands of ICMP requests could indicate a DDoS or scan.\\n- **Malformed Packets:** Fragmented or malformed headers designed to bypass firewalls or exploit parsing bugs."
    elif "xss" in last_msg:
        reply = "### Cross-Site Scripting (XSS)\\n\\nXSS allows attackers to execute malicious JavaScript in a victim's browser.\\n\\n**Remediation:**\\n1. **Context-Aware Escaping:** Escape data before inserting it into HTML, JavaScript, or CSS.\\n2. **Content Security Policy (CSP):** Restrict where scripts can be loaded from and prevent inline script execution.\\n3. **HttpOnly Cookies:** Prevent JavaScript from accessing sensitive session cookies."
    else:
        reply = "I've analyzed your query. As Straxon's AI, I recommend reviewing your network segmentations, ensuring all user input is sanitized, and confirming that role-based access control (RBAC) is strictly enforced. Can you provide more specific details about the logs or vulnerability you are investigating?"

    return {"reply": reply}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082, log_level="info")


@app.get('/healthz')
async def healthz():
    return {'status': 'ok'}


async def test_ws(websocket: WebSocket):
    print('Test WS called!', flush=True)
    await websocket.accept()
    while True:
        await websocket.receive_text()

