import urllib.request
import json

def test_ml_endpoint():
    print("[TEST] Testing ML Anomaly Engine...")
    url = "http://localhost:8082/api/ml/anomaly-detect"
    data = json.dumps({"events": [{"id": "evt-test", "severity": "critical"}]}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req, timeout=5)
        res_data = json.loads(response.read().decode())
        print("[SUCCESS] ML Engine responded:", res_data)
    except Exception as e:
        print("[FAIL] ML Engine test failed:", str(e))

def test_docker_orchestrator():
    print("\n[TEST] Testing Docker Orchestrator (Launching Lab)...")
    url = "http://localhost:8082/api/labs/launch"
    data = json.dumps({"image": "nginxdemos/hello", "port": 8123}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req, timeout=15)
        res_data = json.loads(response.read().decode())
        print("[SUCCESS] Orchestrator responded:", res_data)
    except Exception as e:
        print("[FAIL] Orchestrator test failed:", str(e))

if __name__ == "__main__":
    test_ml_endpoint()
    test_docker_orchestrator()
    print("\n[DONE] Integration test complete.")
