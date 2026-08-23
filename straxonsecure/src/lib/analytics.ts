import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

if (typeof window !== "undefined" && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_pageview: true,
  });
}

export const analytics = {
  track: (eventName: string, properties?: Record<string, any>) => {
    if (POSTHOG_KEY) {
      posthog.capture(eventName, properties);
    } else {
      console.log(`[Analytics Mock] ${eventName}`, properties);
    }
  },
  identify: (userId: string, properties?: Record<string, any>) => {
    if (POSTHOG_KEY) {
      posthog.identify(userId, properties);
    } else {
      console.log(`[Analytics Mock] Identify: ${userId}`, properties);
    }
  },
};
