import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getPostureEvaluations = createServerFn({ method: "GET" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (supabaseAdmin as any)
      .from("posture_evaluations")
      .select("*")
      .eq("user_id", (context as any).userId as string)
      .order("evaluated_at", { ascending: false });

    if (error) throw new Error("Failed to load evaluations");
    return data;
  });

export const evaluatePosture = createServerFn({ method: "POST" })
  .middleware([requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ provider: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    // Simulate Cloud Posture Evaluation
    const score = Math.floor(Math.random() * 40) + 50; // Score between 50-90

    const possibleFindings = [
      { id: "S3-1", desc: "Publicly accessible S3 bucket", severity: "critical", passed: false },
      { id: "IAM-4", desc: "Root account MFA not enabled", severity: "high", passed: false },
      { id: "VPC-2", desc: "Default VPC is in use", severity: "medium", passed: false },
      { id: "RDS-1", desc: "Database encryption at rest", severity: "low", passed: true },
      { id: "EC2-8", desc: "Unused Security Groups", severity: "low", passed: false },
      { id: "KMS-2", desc: "Keys rotated automatically", severity: "low", passed: true },
    ];

    const findings = possibleFindings
      .sort(() => 0.5 - Math.random())
      .map((f) => {
        // randomly pass or fail some for variance, keeping strict ones
        if (f.severity === "critical") f.passed = Math.random() > 0.8;
        return f;
      });

    const { data: evalData, error } = await (supabaseAdmin as any)
      .from("posture_evaluations")
      .insert({
        user_id: (context as any).userId as string,
        cloud_provider: data.provider,
        score,
        findings,
      })
      .select()
      .single();

    if (error) throw new Error("Failed to evaluate posture");
    return evalData;
  });
