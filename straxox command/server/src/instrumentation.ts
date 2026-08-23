import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import * as Sentry from '@sentry/node';
import { logger } from './utils/logger';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  integrations: [
  ],
  // Tracing
  tracesSampleRate: 1.0, 
});


// Initialize OpenTelemetry
const otlpExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});

const sdk = new NodeSDK({
  traceExporter: otlpExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

logger.info('OpenTelemetry & Sentry instrumentation initialized');

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => logger.info('Tracing terminated'))
    .catch((error) => logger.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
