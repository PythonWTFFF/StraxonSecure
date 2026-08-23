import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger";

// Create a rate limiter for authentication routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// IP Firewall Middleware
export const ipFirewall = (req: Request, res: Response, next: NextFunction) => {
  // In development, we can just log. In production, we'd enforce this.
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const allowedIpsStr = process.env.ALLOWED_IPS || "";
  
  if (!allowedIpsStr) {
    // If no IPs are explicitly allowed in env, bypass the firewall.
    // This prevents accidental lockouts in dev environments without the env var set.
    return next();
  }

  const allowedIps = allowedIpsStr.split(",").map(ip => ip.trim());
  
  // Localhost is always allowed for basic dev purposes
  if (clientIp === "::1" || clientIp === "127.0.0.1" || clientIp === "::ffff:127.0.0.1") {
    return next();
  }

  if (typeof clientIp === "string" && allowedIps.includes(clientIp)) {
    return next();
  }

  logger.warn(`[FIREWALL] Blocked unauthorized access attempt from IP: ${clientIp}`);
  
  // Respond with a generic 403 Forbidden
  return res.status(403).json({ 
    error: "Access Denied", 
    message: "Your IP address is not authorized to access the Straxon Command Center." 
  });
};
