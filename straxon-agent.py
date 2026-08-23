import asyncio
import websockets
import json
import psutil
import socket
import platform
import time

WS_URL = "ws://localhost:8082/api/ml/edr-stream"
AGENT_ID = socket.gethostname() + "-" + platform.system()

async def collect_telemetry():
    """Gathers system metrics like CPU, RAM, and top processes."""
    
    # Get basic stats
    cpu_percent = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    mem_percent = mem.percent
    
    # Get top 5 processes by memory
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'memory_percent', 'username']):
        try:
            pinfo = proc.info
            processes.append({
                "pid": pinfo['pid'],
                "name": pinfo['name'],
                "mem": round(pinfo['memory_percent'] or 0, 1),
                "user": pinfo['username'] or "system"
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    processes = sorted(processes, key=lambda p: p['mem'], reverse=True)[:5]
    
    return {
        "agent_id": AGENT_ID,
        "os": platform.system(),
        "cpu": cpu_percent,
        "memory": mem_percent,
        "processes": processes,
        "timestamp": time.time()
    }

async def handle_commands(websocket):
    """Listens for active response commands from the EDR dashboard."""
    try:
        async for message in websocket:
            try:
                cmd = json.loads(message)
                # Check if the command is meant for this agent
                if cmd.get("agent_id") == AGENT_ID:
                    action = cmd.get("action")
                    if action == "kill_process":
                        pid = cmd.get("pid")
                        print(f"[*] Received KILL command for PID: {pid}")
                        try:
                            p = psutil.Process(pid)
                            p.terminate()
                            print(f"[+] Successfully terminated PID: {pid}")
                        except Exception as e:
                            print(f"[-] Failed to terminate PID {pid}: {e}")
                    elif action == "isolate_host":
                        print("[!] CRITICAL: ISOLATE HOST command received.")
                        print("[!] In a real environment, this would disable all network interfaces except the EDR tunnel.")
            except Exception as e:
                pass
    except websockets.ConnectionClosed:
        pass

async def stream_telemetry(websocket):
    """Sends telemetry every 2 seconds."""
    try:
        while True:
            data = await collect_telemetry()
            await websocket.send(json.dumps(data))
            await asyncio.sleep(2)
    except websockets.ConnectionClosed:
        pass

async def run_agent():
    print(f"[*] Starting Straxon EDR Agent: {AGENT_ID}")
    print(f"[*] Connecting to {WS_URL} ...")
    
    while True:
        try:
            async with websockets.connect(WS_URL) as websocket:
                print("[+] Connected securely to Straxon Secure EDR.")
                # Run telemetry sender and command listener concurrently
                await asyncio.gather(
                    stream_telemetry(websocket),
                    handle_commands(websocket)
                )
        except (websockets.ConnectionClosed, ConnectionRefusedError):
            print("[-] Connection lost. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"[-] Error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(run_agent())
    except KeyboardInterrupt:
        print("\n[*] Shutting down agent.")
