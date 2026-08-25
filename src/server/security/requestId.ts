import { createMiddleware } from "@tanstack/react-start";

export const requireRequestId = createMiddleware().server(async ({ next, context }) => {
  // Generate a correlation ID for this request
  const requestId = crypto.randomUUID();

  // Pass it down the context chain
  return next({
    context: {
      ...(context as any),
      requestId,
    },
  });
});
