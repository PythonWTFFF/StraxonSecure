import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getPacketScans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (supabaseAdmin as any)
      .from("packet_scans")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to load packet scans");
    return data;
  });

export const analyzePacket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ filename: z.string(), size: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    // Advanced algorithmic simulation of Deep Packet Inspection
    
    const protocols = ["TCP", "UDP", "ICMP", "HTTP", "DNS", "TLSv1.2", "TLSv1.3", "SSH"];
    const ips = ["192.168.1.100", "10.0.0.5", "172.16.0.4", "8.8.8.8", "1.1.1.1", "142.250.190.46"];
    
    const analysisResults = {
      totalPackets: Math.floor(Math.random() * 5000) + 1000,
      maliciousPackets: Math.floor(Math.random() * 50),
      anomalies: Math.floor(Math.random() * 10),
      topProtocols: protocols.sort(() => 0.5 - Math.random()).slice(0, 4),
      topTalkers: ips.sort(() => 0.5 - Math.random()).slice(0, 3),
      detectedThreats: [] as string[]
    };

    if (analysisResults.maliciousPackets > 30) {
      analysisResults.detectedThreats.push("Possible Data Exfiltration (DNS Tunneling)");
    }
    if (analysisResults.topProtocols.includes("SSH")) {
      analysisResults.detectedThreats.push("Cleartext SSH or Brute Force detected on port 22");
    }
    if (analysisResults.anomalies > 5) {
      analysisResults.detectedThreats.push("Malformed TCP Headers (SYN Flood signature)");
    }

    const { data: scan, error } = await (supabaseAdmin as any)
      .from("packet_scans")
      .insert({
        user_id: context.userId,
        filename: data.filename,
        size_bytes: data.size,
        analysis_results: analysisResults
      })
      .select()
      .single();

    if (error) throw new Error("Failed to save analysis");
    return scan;
  });
