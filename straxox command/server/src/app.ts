import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ipFirewall } from "./middleware/firewall";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import cookieParser from "cookie-parser";

// Route imports
import authRoutes from "./modules/auth/auth.routes";
import invoicesRoutes from "./modules/invoices/invoices.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import proposalsRoutes from "./modules/proposals/proposals.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import dealsRoutes from "./modules/deals/deals.routes";
import projectsRoutes from "./modules/projects/projects.routes";
import portalRoutes from "./modules/portal/portal.routes";
import billingRoutes from "./modules/billing/billing.routes";
import communicationsRoutes from "./modules/communications/communications.routes";
import aiRoutes from "./modules/ai/ai.routes";
import intelligenceRoutes from "./modules/intelligence/intelligence.routes";
import teamRoutes from "./modules/team/team.routes";
import searchRoutes from "./modules/search/search.routes";
import auditRoutes from "./modules/audit/audit.routes";
import documentsRoutes from "./modules/documents/documents.routes";
import webhooksRoutes from "./modules/webhooks/webhooks.routes";
import complianceRoutes from "./modules/compliance/compliance.routes";
import mobileRoutes from "./modules/mobile/mobile.routes";

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: "*", credentials: true }
});

const pubClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
pubClient.on("error", () => {}); // Prevent crash if Redis isn't running locally

const subClient = pubClient.duplicate();
subClient.on("error", () => {}); // Prevent crash if Redis isn't running locally
io.adapter(createAdapter(pubClient, subClient));

app.use(cors({
  origin: (origin, callback) => callback(null, true), 
  credentials: true,
}));

// We need raw parsing for Stripe webhooks, but express.json() for everything else.
// Mount billing routes before express.json() so it can use express.raw() internally for webhooks
app.use("/api/v1/billing", billingRoutes);

// Apply Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss://straxon-pulse.onrender.com", "ws://localhost:8081"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));
app.use(ipFirewall);

app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/invoices", invoicesRoutes);
app.use("/api/v1/clients", clientsRoutes);
app.use("/api/v1/proposals", proposalsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/deals", dealsRoutes);
app.use("/api/v1/projects", projectsRoutes);
app.use("/api/v1/portal", portalRoutes);
app.use("/api/v1/communications", communicationsRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/intelligence", intelligenceRoutes);
app.use("/api/v1/team", teamRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/documents", documentsRoutes);
app.use("/api/v1/webhooks", webhooksRoutes);
app.use("/api/v1/compliance", complianceRoutes);
app.use("/api/v1/mobile", mobileRoutes);

// Health check endpoint (used by DevTools and Docker healthcheck)
app.get("/api/v1/health", (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
});


// Production Static Serving
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  // Serve static files from the frontend dist folder
  app.use(express.static(path.join(__dirname, "../../dist")));
  
  // Catch-all route to serve index.html for React Router
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../../dist/index.html"));
  });
}

// Export for use in tests or other modules
export { app, httpServer };
