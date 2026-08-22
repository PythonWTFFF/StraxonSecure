<#
.SYNOPSIS
Straxon EDR Agent for Windows

.DESCRIPTION
A lightweight endpoint agent that gathers process telemetry and streams it to the Straxon SaaS platform.

.PARAMETER ApiKey
Your Straxon live API Key (strx_live_xyz).

.PARAMETER ServerUrl
The Straxon ingestion endpoint. Default is localhost for development.
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [string]$ServerUrl = "http://localhost:8080/api/public/edr/ingest"
)

# 1. Generate or Retrieve Endpoint ID (Persistent across restarts)
$uuidFile = "$env:LOCALAPPDATA\Straxon\endpoint_id.txt"
if (-not (Test-Path -Path $uuidFile)) {
    New-Item -ItemType Directory -Force -Path "$env:LOCALAPPDATA\Straxon" | Out-Null
    $endpointId = [guid]::NewGuid().ToString()
    Set-Content -Path $uuidFile -Value $endpointId
} else {
    $endpointId = Get-Content -Path $uuidFile
}

$hostname = $env:COMPUTERNAME
$os = (Get-CimInstance Win32_OperatingSystem).Caption

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Straxon EDR Agent v1.0.0 (Windows) Started  " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Endpoint ID: $endpointId"
Write-Host "Hostname: $hostname"
Write-Host "OS: $os"
Write-Host "Server: $ServerUrl"
Write-Host "Streaming telemetry... (Press Ctrl+C to stop)"
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

# Keep track of already sent processes so we only send newly spawned ones
$seenProcessIds = @{}

# Initial poll
$procs = Get-Process
foreach ($p in $procs) {
    $seenProcessIds[$p.Id] = $true
}

while ($true) {
    Start-Sleep -Seconds 5
    
    $payloadProcesses = @()
    $currentProcs = Get-Process -ErrorAction SilentlyContinue

    foreach ($p in $currentProcs) {
        if (-not $seenProcessIds.ContainsKey($p.Id)) {
            $seenProcessIds[$p.Id] = $true
            
            # Basic telemetry
            $cmdLine = ""
            $user = ""
            $parent = ""
            
            try {
                $cimProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($p.Id)" -ErrorAction SilentlyContinue
                if ($cimProcess) {
                    $cmdLine = $cimProcess.CommandLine
                    $parent = $cimProcess.ParentProcessId
                    
                    # Too slow for a tight loop, skipping user resolution for mock
                    # $owner = Invoke-CimMethod -InputObject $cimProcess -MethodName GetOwner
                    # $user = "$($owner.Domain)\$($owner.User)"
                    $user = "SYSTEM"
                }
            } catch {}

            $payloadProcesses += @{
                processName = $p.ProcessName + ".exe"
                commandLine = if ($cmdLine) { $cmdLine } else { $p.ProcessName }
                parentProcess = $parent
                user = $user
                hash = "" # Expensive to calculate hashes for all processes in PS
            }
        }
    }

    $body = @{
        endpointId = $endpointId
        hostname = $hostname
        os = $os
        processes = $payloadProcesses
    } | ConvertTo-Json -Depth 5

    try {
        $response = Invoke-RestMethod -Uri $ServerUrl -Method Post -Headers $headers -Body $body -ErrorAction Stop
        if ($payloadProcesses.Count -gt 0) {
            Write-Host "[OK] Synced $($payloadProcesses.Count) new processes to SOC." -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Failed to send telemetry: $_" -ForegroundColor Red
    }
}
