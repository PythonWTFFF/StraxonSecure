import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { withSpan } from "@/server/telemetry";
import type { ServerContext } from "@/server/context";

/**
 * Global OpenTelemetry middleware for server functions.
 * Wraps every server function execution in an active span.
 */
export const traceRequest = createMiddleware().server(async ({ next, context }) => {
  const request = getRequest();
  const url = new URL(request.url);
  const spanName = `RPC ${url.pathname}`;

  return withSpan(spanName, async (span) => {
    const ctx = context as unknown as ServerContext;
    if (ctx.userId) span.setAttribute("userId", ctx.userId);
    if (ctx.requestId) span.setAttribute("requestId", ctx.requestId);
    span.setAttribute("http.method", request.method);
    span.setAttribute("http.url", request.url);

    try {
      const result = await next();
      return result;
    } catch (err) {
      if (err instanceof Error) {
        span.recordException(err);
      }
      throw err;
    }
  });
});
