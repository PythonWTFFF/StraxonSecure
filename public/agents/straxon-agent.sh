#!/bin/bash
# Straxon EDR Agent for Linux
# Gathers process telemetry and streams it to the Straxon SaaS platform.

if [ -z "$1" ]; then
    echo "Usage: ./straxon-agent.sh <API_KEY> [SERVER_URL]"
    echo "Example: ./straxon-agent.sh strx_live_xyz http://localhost:8082/api/public/edr/ingest"
    exit 1
fi

API_KEY=$1
SERVER_URL=${2:-"http://localhost:8082/api/public/edr/ingest"}

# 1. Generate or Retrieve Endpoint ID
UUID_DIR="$HOME/.straxon"
UUID_FILE="$UUID_DIR/endpoint_id.txt"

if [ ! -f "$UUID_FILE" ]; then
    mkdir -p "$UUID_DIR"
    ENDPOINT_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)
    echo "$ENDPOINT_ID" > "$UUID_FILE"
else
    ENDPOINT_ID=$(cat "$UUID_FILE")
fi

HOSTNAME=$(hostname)
OS=$(grep PRETTY_NAME /etc/os-release | cut -d '"' -f 2)
if [ -z "$OS" ]; then
    OS="Linux"
fi

echo -e "\e[36m==============================================\e[0m"
echo -e "\e[36m  Straxon EDR Agent v1.0.0 (Linux) Started    \e[0m"
echo -e "\e[36m==============================================\e[0m"
echo "Endpoint ID: $ENDPOINT_ID"
echo "Hostname: $HOSTNAME"
echo "OS: $OS"
echo "Server: $SERVER_URL"
echo "Streaming telemetry... (Press Ctrl+C to stop)"
echo ""

declare -A SEEN_PIDS

# Initial poll to seed existing PIDs
for pid in $(ps -eo pid --no-headers); do
    SEEN_PIDS[$pid]=1
done

while true; do
    sleep 5
    
    PAYLOAD_JSON="["
    PROCESS_COUNT=0
    
    # Read newly spawned processes using ps
    while read -r pid user ppid comm args; do
        if [ -z "${SEEN_PIDS[$pid]}" ]; then
            SEEN_PIDS[$pid]=1
            
            # Escape strings for JSON
            ARGS_ESC=$(echo "$args" | sed 's/"/\\"/g')
            COMM_ESC=$(echo "$comm" | sed 's/"/\\"/g')
            
            if [ $PROCESS_COUNT -gt 0 ]; then
                PAYLOAD_JSON+=","
            fi
            
            PAYLOAD_JSON+="{\"processName\":\"$COMM_ESC\",\"commandLine\":\"$ARGS_ESC\",\"parentProcess\":\"$ppid\",\"user\":\"$user\",\"hash\":\"\"}"
            PROCESS_COUNT=$((PROCESS_COUNT + 1))
        fi
    done < <(ps -eo pid,user,ppid,comm,args --no-headers)
    
    PAYLOAD_JSON+="]"

    # Send payload
    BODY="{\"endpointId\":\"$ENDPOINT_ID\",\"hostname\":\"$HOSTNAME\",\"os\":\"$OS\",\"processes\":$PAYLOAD_JSON}"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SERVER_URL" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$BODY")
        
    if [ "$RESPONSE" -eq 200 ] || [ "$RESPONSE" -eq 201 ]; then
        if [ $PROCESS_COUNT -gt 0 ]; then
            echo -e "\e[32m[OK] Synced $PROCESS_COUNT new processes to SOC.\e[0m"
        fi
    else
        echo -e "\e[31m[ERROR] Failed to send telemetry: HTTP $RESPONSE\e[0m"
    fi
done
