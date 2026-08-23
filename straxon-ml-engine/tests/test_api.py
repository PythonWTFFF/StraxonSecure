import pytest
from fastapi.testclient import TestClient
from main import app, agent_registry
import json

client = TestClient(app)

def test_edr_ingest():
    # Clear registry before test
    agent_registry.clear()
    
    payload = {
        "endpointId": "TEST_AGENT_001",
        "hostname": "TEST-HOST",
        "os": "Linux",
        "processes": [
            {
                "processName": "bash",
                "commandLine": "bash -c 'echo hello'",
                "parentProcess": "sshd",
                "user": "root",
                "hash": "xyz123"
            }
        ]
    }
    
    response = client.post("/api/public/edr/ingest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["processes_ingested"] == 1
    
    # Verify agent registry was updated
    assert "TEST_AGENT_001" in agent_registry
    assert agent_registry["TEST_AGENT_001"]["hostname"] == "TEST-HOST"

def test_get_agents():
    # Inject a mock agent
    agent_registry["TEST_AGENT_002"] = {
        "agent_id": "TEST_AGENT_002",
        "hostname": "WEB-SERVER-1",
        "os": "Ubuntu",
        "last_seen": 1600000000,
        "risk_score": 2.5
    }
    
    response = client.get("/api/ml/agents")
    assert response.status_code == 200
    data = response.json()
    
    assert "agents" in data
    assert len(data["agents"]) >= 1
    
    # Find our injected agent
    agent = next((a for a in data["agents"] if a["agent_id"] == "TEST_AGENT_002"), None)
    assert agent is not None
    assert agent["hostname"] == "WEB-SERVER-1"

def test_anomaly_detect():
    # Direct structural entropy test using the anomaly-detect ML route
    payload = {
        "events": [
            {
                "id": "evt-123",
                "commandLine": "powershell -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAEkATwAuAE0AZQBtAG8AcgB5AFMAdAByAGUAYQBtACgAWwBDAG8AbgB2AGUAcgB0AF0AOgA6AEYAcgBvAG0AQgBhAHMAZQA2ADQAUwB0AHIAaQBuAGcAKAAiAEgA..."
            }
        ]
    }
    
    response = client.post("/api/ml/anomaly-detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "anomalies" in data
    assert len(data["anomalies"]) == 1
    
    # Highly obfuscated payload should have a high score
    anomaly = data["anomalies"][0]
    assert anomaly["event_id"] == "evt-123"
    assert anomaly["anomaly_score"] > 0.7
