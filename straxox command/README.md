# StraxonLabs Command Center

The world's most advanced internal command center and company management application, designed exclusively for StraxonLabs.

## Features

- **Advanced Cybersecurity & Firewall**: Secured with comprehensive IP filtering, rate-limiting, and XSS protection.
- **Ultra Experience UI**: Smooth, glassmorphism design with `framer-motion` micro-animations and a futuristic ambient background.
- **Global Scale (i18n)**: Fully internationalized with native React i18n support, complete with on-the-fly language switching (EN, ES, FR) and native locale formatting.
- **Hyper-Performance Code Splitting**: Utilizes `React.lazy` and Suspense to lazy-load routes on demand, ensuring zero latency on initial load.
- **Docker-Ready Production Build**: Optimized multi-stage Docker builds ready to scale seamlessly on Render or Kubernetes.

## Getting Started

### Prerequisites

- Node.js (v20+)
- PostgreSQL (with pgvector)
- Redis

### Installation

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```
2. Setup environment variables by copying `.env.example` to `.env`.
3. Generate the Prisma Client and migrate the database:
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

### Running Locally

```bash
# In the root directory (starts both frontend and backend)
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 SwarajPanti
