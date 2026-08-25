# PROJECT INTELLIGENCE REPORT

## 1. Executive Summary
StraxonSecure is a state-of-the-art, enterprise-grade cybersecurity platform developed by SwarajPanti and StraxonLabs. Currently in active development (Beta/V1), it is designed as a unified command center for Security Operations Centers (SOC). 
The application solves the problem of fragmented security tools by combining Threat Intelligence, Supply Chain Risk Management, Penetration Testing (PTaaS), and External Attack Surface Management (EASM) into a single, cohesive dashboard.
Its primary goal is to provide real-time, actionable security insights and automated remediation capabilities for enterprise environments. The target users range from SOC Analysts and Security Engineers to CISOs. The core value proposition is AI-driven automation (via a dedicated Python ML Engine) that correlates events across different vectors to reduce alert fatigue.
**One Sentence**: StraxonSecure is an AI-powered, unified cybersecurity platform integrating SOC monitoring, threat intelligence, and automated penetration testing.
**One Paragraph**: StraxonSecure provides a comprehensive suite of security tools wrapped in a modern, dark-mode focused UI. It leverages a React/TanStack frontend for real-time visualization, a Supabase PostgreSQL backend for robust data storage and authentication, and a dedicated Python ML engine for advanced threat detection and isolated Docker-based lab simulations.
**Detailed Technical Overview**: The platform utilizes a Modular Monolith architecture for the core application (React, TanStack Start, Tailwind, Supabase) paired with a microservice sidecar (Python ML Engine using FastAPI/WebSockets) for heavy compute and Docker orchestration. Real-time features are powered by Supabase Realtime channels and native WebSockets, enabling live EDR streaming and interactive WebTerminal sessions for penetration testing.

## 2. Application Purpose
**Problem Solved**: Fragmentation in cybersecurity tooling leading to context switching and alert fatigue.
**Primary Goals**: Centralize security monitoring, automate threat detection using AI, and provide a secure environment for continuous penetration testing.
**Secondary Goals**: Gamified training via Capture The Flag (CTF) labs and automated reporting for compliance.
**Differentiators**: Integrated AI Copilot, live Docker-based exploitation labs, and stunning glassmorphism 3D UI elements.

## 3. Target Users
**User Personas**:
- *SOC Analyst*: Monitors live dashboards, responds to EDR alerts.
- *Penetration Tester*: Uses the PTaaS module to launch scans and exploits.
- *CISO / Manager*: Reviews executive reports, compliance posture, and risk scores.
- *Developer*: Uses the supply-chain module to track dependencies.

## 4. User Roles & Permissions
**Roles**: 
- `user`: Standard user, can view basic dashboards.
- `analyst`: Can view SOC events and generate reports.
- `admin` (CONFIRMED): Full access to launch penetration tests, manage users, and view all war rooms.

*Permission Matrix (Inferred from standard RBAC setups in the codebase)*:
| Feature | Guest | User | Analyst | Admin |
|---------|-------|------|---------|-------|
| Login | Yes | Yes | Yes | Yes |
| Dashboard | No | Yes | Yes | Yes |
| SOC / EDR | No | No | Yes | Yes |
| PTaaS (Launch) | No | No | No | Yes |
| Reports | No | No | Yes | Yes |

## 5. Feature Inventory
| Feature | Description | Status | UI Location | Backend Location | Dependencies |
|---------|-------------|--------|-------------|------------------|--------------|
| SOC Dashboard | Live event monitoring | Functional | `soc-simulator.tsx` | `server/soc.ts` | Supabase Realtime |
| PTaaS | Automated penetration testing | Functional | `pentest.tsx` | `server/pentest.ts` | ML Engine, Docker |
| EASM | Attack surface management | Functional | `easm.tsx` | `server/easm.ts` | ML Engine |
| Supply Chain | Dependency scanning | Functional | `supply-chain.tsx`| `server/scanner.ts` | NVD / ML Engine |
| CTF Labs | Interactive hacking labs | Functional | `labs.*.tsx` | `server/labs.ts` | DockerLabLauncher |
| AI Copilot | AI analyst assistant | Partial | `AIAnalystPanel` | `server/ai.ts` | ML Engine (OpenAI/Local) |

## 6. Technology Stack
**Frontend**:
- **Framework**: React 19 / TanStack Start
- **Language**: TypeScript
- **UI/CSS**: Tailwind CSS, Framer Motion, Radix UI Primitives, Lucide Icons
- **State/Data**: TanStack Query, Zustand
- **3D Rendering**: Three.js, React Three Fiber, React Three Drei
- **Terminal**: Xterm.js

**Backend**:
- **Framework**: Node.js (via TanStack Start SSR/Server Functions)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (JWT)

**ML / Compute Sidecar**:
- **Framework**: Python, FastAPI
- **Features**: WebSockets, Docker SDK (for lab orchestration), AI processing
- **Cache**: Redis

## 7. Architecture
**Modular Monolith + Microservices (Hybrid)**
Frontend (TanStack Start) <-> Backend API (TanStack Server Functions) <-> Supabase (Postgres)
                               |
                               +-> ML Engine (FastAPI via WebSocket/HTTP) <-> Redis & Docker

The TanStack Start framework handles routing, SSR, and basic CRUD via server functions. Heavy, long-running, or privileged tasks (like spawning Docker containers for labs) are offloaded to the Python ML Engine.

## 8. Project Structure
```text
project/
├── straxonsecure/
│   ├── src/
│   │   ├── components/ (Reusable UI, Cyber themes, Layouts)
│   │   ├── routes/ (TanStack File-based routing)
│   │   ├── server/ (Backend server functions/logic)
│   │   ├── integrations/supabase/ (DB types and client)
│   │   └── hooks/ (Custom React hooks)
│   ├── supabase/ (Migrations and SQL setup)
│   ├── terraform/ (AWS Infrastructure as Code)
│   ├── k8s/ (Kubernetes manifests)
│   └── playwright-report/ (E2E testing)
├── straxon-ml-engine/ (Python AI and Docker orchestration sidecar)
└── docker-compose.yml (Local deployment orchestration)
```

## 9. Frontend Architecture
The frontend uses file-based routing via TanStack Router. State is managed locally using React hooks and globally using `zustand` (for UI state) and `@tanstack/react-query` (for server state caching). The UI relies heavily on a custom design system built with Tailwind and Radix UI.

## 10. Backend Architecture
The backend is primarily serverless functions within TanStack Start (`src/server/*.ts`) which act as an API Gateway to Supabase. Security middlewares (e.g., `authorization.ts`, `headers.ts`) enforce RBAC and CSP.

## 11. API Architecture
APIs are RPC-style server functions.
- `callAuthed(fn, args)` ensures JWT validation before execution.
- WebSockets (`ws://127.0.0.1:8082`) bypass standard HTTP for low-latency ML streams.

## 12. Database Architecture
Provider: Supabase (PostgreSQL)
Key Tables (CONFIRMED via `types.ts` & `script.cjs`):
- `pentest_jobs`: Tracks automated scanning jobs.
- `lab_sessions`: Tracks active Docker containers for users.
- `warroom_sessions`: Incident response collaborative rooms.
- `ctf_challenges`: Gamified training content.
*Relationships*: All operational tables link back to standard Supabase `auth.users` via `user_id` foreign keys.

## 13. Data Flow
**PTaaS Execution Flow**:
User -> `pentest.tsx` -> `launchPentest` (Server Function) -> Supabase (Job created) -> ML Engine (Triggered) -> ML Engine runs scan -> Updates DB -> Frontend React Query refetches/listens to Realtime -> UI updates.

## 14. Authentication
**Method**: Supabase Auth (JWT based).
Users log in via `auth.tsx` (`signInWithPassword`). The JWT is stored securely and sent with every server function request.

## 15. Authorization
**Method**: Middleware `authorization.ts`.
Roles are likely stored in a `user_roles` table or JWT claims. The `callAuthed` wrapper validates the session, preventing unauthenticated access to backend functions.

## 16. Cybersecurity
**OWASP Mitigation**:
- *XSS*: Prevented by React's DOM escaping and strict CSP headers.
- *Injection*: Prevented by Supabase's prepared statements and ORM-like client.
- *CSRF*: Mitigated by SameSite cookies and JWT bearer tokens.
**Known Weakness**: The ML engine exposes Docker socket (`/var/run/docker.sock`), which is extremely dangerous if the Python container is compromised (Privilege Escalation).

## 17. Environment Configuration
**Variables**:
- `VITE_SUPABASE_URL`: Required (Supabase API URL)
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Required (Supabase Anon Key)
- `GEMINI_API_KEY`: Required for AI Copilot (Secret)
*Missing*: The ML Engine requires `REDIS_URL`, which is handled by Docker Compose.

## 18. Docker & Infrastructure
- `Dockerfile.frontend`: Builds the Vite/TanStack app.
- `straxon-ml-engine/Dockerfile`: Builds the Python FastAPI sidecar.
- `docker-compose.yml`: Orchestrates Frontend, ML Engine, and Redis.
*Security Concern*: The ML engine mounts the host's Docker socket to spawn lab containers.

## 19. External Integrations
- **Supabase**: Primary Database and Auth provider.
- **Gemini / OpenAI**: (Inferred) AI providers for the Copilot.
- **Stripe**: (Mocked) Used in lab simulations, but structure exists for billing (`src/server/billing.ts`).

## 20. AI/ML Systems
The AI module (`src/server/ai.ts` and `straxon-ml-engine`) acts as a security analyst. It processes raw logs, network traffic, and scan results, outputting natural language summaries and risk scoring (Anomaly detection).

## 21. Performance
**Strengths**: TanStack query caches aggressively. Vite ensures fast HMR.
**Weaknesses**: Heavy 3D assets (Three.js Globes) can cause GPU spikes on low-end devices.

## 22. Scalability
Currently suitable for ~1,000 users.
*Bottleneck*: The Python ML engine spawning Docker containers per user (`DockerLabLauncher.tsx`) will hit physical host limits quickly.
*Solution*: Move lab spawning to a Kubernetes cluster using the provided `k8s/` manifests instead of local Docker socket.

## 23. Reliability
Error boundaries (`ErrorBoundary.tsx`, `CyberError.tsx`) catch frontend crashes gracefully. Server functions have `try/catch` blocks (recently fixed empty catch statements) that log to `console.error`.

## 24. Logging & Monitoring
- **Logs**: Console logging on frontend and backend.
- **Missing**: Centralized telemetry (ELK/Datadog) is recommended for production. `src/server/telemetry.ts` exists but needs full implementation.

## 25. Testing
- **E2E**: Playwright (`tests/e2e/auth.spec.ts`, `soc.spec.ts`).
- **Unit**: Vitest configured.
Test coverage appears moderate. Critical auth flows are tested.

## 26. CI/CD
GitHub Actions (`.github/workflows/deploy.yml`, `deploy-frontend.yml`) are configured. Push protection is enabled. Terraform is used for AWS deployment.

## 27. Development Workflow
1. Ensure Docker is running.
2. Clone repo.
3. Configure `.env` with Supabase keys.
4. Run `npm install` and `npm run dev`.
5. Ensure `docker-compose up ml-engine` is running for Python backend.

## 28. Dependency Analysis
**Frontend**: React 19, Tailwind 4, TanStack router. Very modern, bleeding edge.
**Risk**: Using alpha/beta versions of React 19 or Tailwind 4 might introduce breaking changes.

## 29. Technical Debt
- Empty `catch` blocks (mostly resolved).
- `@ts-expect-error` used to bypass strict type checking in complex ML data pipelines.
- Tight coupling between the UI and direct database calls in some legacy components.

## 30. Business Logic
**Rule**: Threat Risk Scoring.
Triggered when EDR ingests new logs. ML engine calculates anomaly score. If > 80, marked as CRITICAL and alerted in SOC dashboard.

## 31. UI/UX
**Design System**: "Cyberpunk Glassmorphism". Dark theme, neon accents (cyan, magenta), blurred backdrops. Highly consistent and visually striking.

## 32. Accessibility
Radix UI primitives ensure baseline ARIA compliance and keyboard navigation. Minor issues exist with missing `autocomplete` on some inputs (noted in recent console logs).

## 33. SEO/PWA
SEO is minimal as this is an authenticated internal enterprise dashboard. PWA manifests exist for installability.

## 34. Data Privacy
Processes sensitive vulnerability data and infrastructure maps.
Data is protected via Supabase RLS (Row Level Security) and RBAC.

## 35. Cost Analysis
- **Supabase**: $25/mo (Pro tier).
- **AWS Infrastructure** (Terraform): EC2 for ML engine, Redis cache. Est. $100-$300/mo.
- **AI APIs**: Variable based on token usage.

## 36. Documentation Review
Documentation Quality: 7/10.
Has a solid `README.md`, but lacks detailed API swagger docs and explicit architecture diagrams in the repo.

## 37. Project Health Score
**Overall**: 8.5/10.
Highly advanced feature set and modern stack, but requires careful infrastructure management for the Docker-in-Docker lab orchestration.

## 38. Critical Issues
1. **Broken Supabase Integration**: `ERR_NAME_NOT_RESOLVED` due to deleted remote project in `.env`.
   - *Fix*: User must provision a new Supabase project and update `.env`.

## 39. Recommended Improvements
1. Implement a managed Kubernetes cluster for isolated Pentest Labs rather than local Docker socket mounting.
2. Add comprehensive automated API testing.
3. Centralize logging to Datadog or Splunk.

## 40. Future Roadmap
- **Phase 1 (Stabilization)**: Resolve Database connectivity and finalize CSP headers.
- **Phase 2 (Security)**: Implement robust Secret Scanning pipelines and remove dummy secrets.
- **Phase 3 (Expansion)**: Build automated remediation agents that not only detect threats but execute playbook responses automatically.

## 41. Architecture Diagrams
*(MISSING due to text format, but logically structured as Frontend -> TanStack Server -> Supabase / ML Engine -> Docker)*

## 42. Complete Inventories
*(See Section 5 and 6 for summaries)*

## 43. Glossary
- **PTaaS**: Penetration Testing as a Service.
- **EASM**: External Attack Surface Management.
- **EDR**: Endpoint Detection and Response.

## 44. Final Assessment
StraxonSecure is an ambitious, modern cybersecurity platform bridging the gap between monitoring and active testing. Built on the bleeding edge of the JavaScript ecosystem (React 19, TanStack Start), it delivers a premium, highly interactive user experience. Its primary weakness lies in the complexity of deploying its microservices (Python ML and Docker Labs). Once the database configuration is resolved, it is very close to production readiness for enterprise use.
