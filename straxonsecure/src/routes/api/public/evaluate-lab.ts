import { createFileRoute } from "@tanstack/react-router";
import { evaluateLabSubmission } from "@/server/labs";

export const Route = createFileRoute("/api/public/evaluate-lab")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          // Manually invoke the server function logic
          // Note: createServerFn handlers expect a specific context structure
          const result = await evaluateLabSubmission.handler({
            data: body,
            context: { requestId: "public-eval-" + Date.now() },
          });

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      }
    },
  },
});
