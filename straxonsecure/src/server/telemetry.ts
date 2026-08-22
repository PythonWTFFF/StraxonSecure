import { trace, Span } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";

// Initialize OpenTelemetry
const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  // Service name can be set via OTEL_SERVICE_NAME=straxon-secure env var
});

sdk.start();

export const tracer = trace.getTracer("straxon-secure-tracer");

export async function withSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      return result;
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}
