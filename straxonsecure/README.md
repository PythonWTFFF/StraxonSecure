# 🛡️ Straxon Secure Platform

Straxon is an advanced, AI-driven cybersecurity platform offering real-time End-Point Detection and Response (EDR) visualization, live Dark Web Intelligence, and Interactive Penetration Testing Labs.

## 🚀 Key Capabilities

- **3D Global Threat Matrix**: Visualize live cyber attacks, anomalous telemetry, and endpoint behaviors globally using React-Three-Fiber.
- **AI-Powered EDR**: A Python-based ML Engine that leverages Isolation Forests and Random Forests for DGA detection and structural entropy analysis of endpoint command executions.
- **Interactive Labs**: Spin up fully isolated, interactive Docker containers straight from your browser for hands-on penetration testing and vulnerability analysis.
- **Dark Web Monitor**: Dynamic generation of threat intelligence using Large Language Models to simulate real-world breach data for targeted emails and domains.

## 📂 Repository Structure
- **`/straxonsecure`**: The modern frontend built with React, Vite, TanStack Start, TailwindCSS, and Three.js.
- **`/straxon-ml-engine`**: The backend processing engine powered by FastAPI, Scikit-Learn, and WebSocket Pub/Sub.
- **`/straxon-agent`**: Telemetry scripts to deploy to monitored endpoints.
- **`/k8s`** *(inside straxonsecure)*: Kubernetes manifests for production deployment.

## ⚡ Getting Started

### Prerequisites
- Node.js (v20+)
- Python (3.11+)
- Docker & Docker Compose
- Redis (for Pub/Sub events)

### Running Locally

1. **Start the Frontend**
   ```bash
   cd straxonsecure
   npm install
   npm run dev
   ```

2. **Start the ML Engine**
   ```bash
   cd straxon-ml-engine
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python start.py
   ```

3. **Simulate EDR Traffic**
   Run the agent script to stream telemetry to your local dashboard:
   ```bash
   cd straxonsecure/public/agents
   ./straxon-agent.sh API_KEY_123 http://localhost:8082/api/public/edr/ingest
   ```

## 🧪 Testing
The platform utilizes Playwright for comprehensive End-to-End (E2E) tests.
```bash
cd straxonsecure
npx playwright test
```
