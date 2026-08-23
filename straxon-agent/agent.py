import psutil
import requests
import time
import hashlib
import platform
import socket
import uuid
import os

# ==========================================
# CONFIGURATION
# ==========================================
# Replace this with the Developer API Key generated from Straxon Secure
API_KEY = os.getenv("STRAXON_API_KEY", "strx_live_...")

# Straxon Secure backend URL
STRAXON_URL = os.getenv("STRAXON_URL", "http://localhost:5173/api/public/edr/ingest")

# Polling interval in seconds
POLL_INTERVAL = 10
# ==========================================

# Generate a persistent Endpoint ID based on MAC address to avoid duplicates
def get_endpoint_id():
    mac = uuid.getnode()
    return str(uuid.UUID(int=mac))

ENDPOINT_ID = get_endpoint_id()
HOSTNAME = socket.gethostname()
OS_INFO = platform.system() + " " + platform.release()

# Track already reported processes (PID + Create Time) to prevent spamming the backend
seen_processes = set()

def hash_file(filepath):
    """Calculates SHA256 hash of a file."""
    try:
        h = hashlib.sha256()
        with open(filepath, 'rb') as f:
            # Read in chunks to avoid memory issues with large files
            for chunk in iter(lambda: f.read(4096), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        # File might be locked, deleted, or permission denied
        return "unknown"

def get_new_processes():
    new_procs = []
    
    for proc in psutil.process_iter(['pid', 'name', 'username', 'cmdline', 'exe', 'create_time']):
        try:
            pinfo = proc.info
            pid = pinfo['pid']
            create_time = pinfo['create_time']
            unique_id = f"{pid}-{create_time}"
            
            if unique_id in seen_processes:
                continue
                
            seen_processes.add(unique_id)
            
            # Skip system processes with no executable path
            if not pinfo.get('exe'):
                continue
                
            # Get parent process
            try:
                parent = proc.parent()
                parent_name = parent.name() if parent else "unknown"
            except Exception:
                parent_name = "unknown"
                
            cmdline = pinfo.get('cmdline')
            cmd_str = " ".join(cmdline) if cmdline else ""
            
            proc_hash = hash_file(pinfo['exe'])
            
            new_procs.append({
                "processName": pinfo.get('name', 'unknown'),
                "commandLine": cmd_str,
                "user": pinfo.get('username', 'unknown'),
                "parentProcess": parent_name,
                "hash": proc_hash
            })
            
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    return new_procs

def send_telemetry():
    print(f"[*] Starting Straxon EDR Agent...")
    print(f"[*] Endpoint ID: {ENDPOINT_ID}")
    print(f"[*] Hostname: {HOSTNAME} ({OS_INFO})")
    print(f"[*] Backend: {STRAXON_URL}")
    print(f"[*] API Key config loaded.")
    print(f"[*] Polling every {POLL_INTERVAL} seconds. Press Ctrl+C to stop.\n")
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    while True:
        try:
            procs = get_new_processes()
            
            # Send heartbeat even if no new processes to keep endpoint 'online'
            payload = {
                "endpointId": ENDPOINT_ID,
                "hostname": HOSTNAME,
                "os": OS_INFO,
                "processes": procs
            }
            
            res = requests.post(STRAXON_URL, json=payload, headers=headers)
            
            if res.status_code == 200:
                print(f"[+] Sent heartbeat. {len(procs)} new processes ingested.")
            else:
                print(f"[-] API Error {res.status_code}: {res.text}")
                
        except Exception as e:
            print(f"[!] Connection failed: {e}")
            
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    try:
        send_telemetry()
    except KeyboardInterrupt:
        print("\n[*] Agent stopped.")
