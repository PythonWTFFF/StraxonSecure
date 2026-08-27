export function getSecurityHeaders() {
  return {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' wss://* ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:* https://*.supabase.co wss://*.supabase.co; frame-src 'self' https://js.stripe.com; img-src 'self' data: https:;",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}
