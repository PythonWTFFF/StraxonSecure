# 🏛️ Architecture Guide

This document outlines the system architecture of the Straxon Secure Platform.

## 1. High-Level System Overview
Straxon operates on a decoupled client-server architecture designed for high throughput telemetry and rich visualizations.

### Frontend (`straxonsecure`)
- **Framework**: React / TanStack Start
- **Visualization**: Three.js & React-Three-Fiber used extensively for the `AttackGlobe` and `LandingGlobes`.
- **State Management**: React Context, Hooks, and live WebSocket subscriptions.
- **Resilience**: Implements React `Suspense` and Error Boundaries to lazy-load heavy components (like 3D assets and `xterm.js`) without blocking the main UI thread.

### ML Engine (`straxon-ml-engine`)
- **API Framework**: FastAPI for high-performance async routing.
- **Real-Time Mesh**: Redis Pub/Sub drives WebSockets, broadcasting EDR telemetry globally.
- **Machine Learning**: 
  - **Isolation Forest**: Baselines normal telemetry.
  - **Random Forest**: Detects Domain Generation Algorithms (DGAs).
  - **NLP (TF-IDF)**: Logistic Regression to catch zero-day payload strings.
  - **Entropy Analysis**: Shannon entropy calculations on execution strings to flag obfuscation.

### Agent Telemetry (`straxon-agent.sh`)
- A lightweight bash/python agent pushes raw process execution data via HTTP POST (`/api/public/edr/ingest`).
- Data is instantly parsed, scored for anomalies, and broadcasted to the frontend SOC matrix.

## 2. Infrastructure & Deployment
The system is orchestrated using Kubernetes for production readiness:

- **Frontend Deployment**: Serves the UI. Connects to Supabase via injected ConfigMaps/Secrets.
- **ML Engine Deployment**: Mounts `/var/run/docker.sock` to dynamically spawn lab containers on-the-fly for users requesting interactive terminal environments.
- **Redis Deployment**: Acts as the high-availability message broker for EDR events.
- **Ingress**: Configured with Nginx. Features extended proxy read/write timeouts (1 hour) to ensure that live WebSocket connections for terminal labs do not prematurely disconnect.

## 3. Data Flow
1. **Endpoint -> ML Engine**: `straxon-agent` POSTs JSON payloads to `/api/public/edr/ingest`.
2. **ML Engine Analysis**: FastAPI evaluates the payload using Scikit-Learn models.
3. **Broadcast**: FastAPI publishes the scored telemetry to a Redis channel.
4. **WebSocket Push**: All connected UI clients receive the telemetry payload over `/api/ml/edr-stream`.
5. **Visualization**: The `AttackGlobe` immediately parses coordinates and renders the threat node on the 3D map.
