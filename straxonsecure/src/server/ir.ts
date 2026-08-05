import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─── Incident Response Phase Schema ─────────────────────────────────────────

const phaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "skipped"]),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
      assignee: z.string().optional(),
      notes: z.string().optional(),
      completedAt: z.string().optional(),
    }),
  ),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

const timelineEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  action: z.string(),
  actor: z.string(),
  details: z.string().optional(),
});

// ─── IR Playbook Templates ────────────────────────────────────────────────────

const IR_TEMPLATES: Record<
  string,
  {
    name: string;
    incident_type: string;
    phases: z.infer<typeof phaseSchema>[];
    mitre_tactics: string[];
  }
> = {
  ransomware: {
    name: "Ransomware Response",
    incident_type: "ransomware",
    mitre_tactics: [
      "TA0001 Initial Access",
      "TA0002 Execution",
      "TA0010 Exfiltration",
      "TA0040 Impact",
    ],
    phases: [
      {
        id: "detection",
        name: "Detection & Analysis",
        status: "pending",
        tasks: [
          { id: "t1", title: "Identify affected systems and scope", completed: false },
          { id: "t2", title: "Collect IOCs (file hashes, C2 IPs, ransom note)", completed: false },
          { id: "t3", title: "Determine ransomware family and variant", completed: false },
          { id: "t4", title: "Check for decryption tools (nomoreransom.org)", completed: false },
          {
            id: "t5",
            title: "Preserve forensic evidence (memory dumps, disk images)",
            completed: false,
          },
        ],
      },
      {
        id: "containment",
        name: "Containment",
        status: "pending",
        tasks: [
          { id: "t6", title: "Isolate infected hosts from network immediately", completed: false },
          { id: "t7", title: "Block C2 domains and IP addresses at firewall", completed: false },
          { id: "t8", title: "Disable compromised user accounts", completed: false },
          { id: "t9", title: "Take system snapshots before cleaning", completed: false },
        ],
      },
      {
        id: "eradication",
        name: "Eradication",
        status: "pending",
        tasks: [
          { id: "t10", title: "Remove malware from all affected systems", completed: false },
          { id: "t11", title: "Identify and close initial access vector", completed: false },
          { id: "t12", title: "Reset all potentially compromised credentials", completed: false },
          { id: "t13", title: "Patch exploited vulnerabilities", completed: false },
        ],
      },
      {
        id: "recovery",
        name: "Recovery",
        status: "pending",
        tasks: [
          { id: "t14", title: "Restore systems from clean backups", completed: false },
          { id: "t15", title: "Validate system integrity before reconnecting", completed: false },
          { id: "t16", title: "Monitor for re-infection for 30 days", completed: false },
          { id: "t17", title: "Notify affected stakeholders and regulators", completed: false },
        ],
      },
      {
        id: "lessons",
        name: "Lessons Learned",
        status: "pending",
        tasks: [
          { id: "t18", title: "Conduct post-incident review meeting", completed: false },
          { id: "t19", title: "Update security policies and procedures", completed: false },
          {
            id: "t20",
            title: "Implement additional controls to prevent recurrence",
            completed: false,
          },
          { id: "t21", title: "File insurance claim if applicable", completed: false },
        ],
      },
    ],
  },
  data_breach: {
    name: "Data Breach Response",
    incident_type: "data_breach",
    mitre_tactics: ["TA0006 Credential Access", "TA0009 Collection", "TA0010 Exfiltration"],
    phases: [
      {
        id: "detection",
        name: "Detection & Analysis",
        status: "pending",
        tasks: [
          { id: "t1", title: "Identify what data was accessed or exfiltrated", completed: false },
          { id: "t2", title: "Determine affected user count and PII scope", completed: false },
          { id: "t3", title: "Identify attack vector and timeline", completed: false },
          {
            id: "t4",
            title: "Assess regulatory notification requirements (GDPR 72h)",
            completed: false,
          },
        ],
      },
      {
        id: "containment",
        name: "Containment",
        status: "pending",
        tasks: [
          { id: "t5", title: "Revoke compromised API keys and tokens", completed: false },
          { id: "t6", title: "Force password resets for affected accounts", completed: false },
          {
            id: "t7",
            title: "Enable additional authentication (MFA enforcement)",
            completed: false,
          },
          { id: "t8", title: "Review and restrict data access permissions", completed: false },
        ],
      },
      {
        id: "notification",
        name: "Notification",
        status: "pending",
        tasks: [
          { id: "t9", title: "Notify DPA/regulators within legal timeframe", completed: false },
          { id: "t10", title: "Notify affected individuals with breach details", completed: false },
          { id: "t11", title: "Prepare public disclosure statement", completed: false },
          { id: "t12", title: "Engage legal counsel for liability assessment", completed: false },
        ],
      },
      {
        id: "recovery",
        name: "Recovery & Hardening",
        status: "pending",
        tasks: [
          { id: "t13", title: "Patch the exploited vulnerability", completed: false },
          { id: "t14", title: "Implement DLP (Data Loss Prevention) controls", completed: false },
          { id: "t15", title: "Enable enhanced monitoring and alerting", completed: false },
          { id: "t16", title: "Offer credit monitoring to affected users", completed: false },
        ],
      },
    ],
  },
  ddos: {
    name: "DDoS Attack Response",
    incident_type: "ddos",
    mitre_tactics: ["TA0040 Impact"],
    phases: [
      {
        id: "detection",
        name: "Detection",
        status: "pending",
        tasks: [
          {
            id: "t1",
            title: "Confirm attack type (volumetric/protocol/application)",
            completed: false,
          },
          { id: "t2", title: "Identify source IPs and ASNs", completed: false },
          { id: "t3", title: "Measure bandwidth and packet rates", completed: false },
        ],
      },
      {
        id: "mitigation",
        name: "Mitigation",
        status: "pending",
        tasks: [
          {
            id: "t4",
            title: "Activate DDoS protection service (Cloudflare/AWS Shield)",
            completed: false,
          },
          { id: "t5", title: "Enable rate limiting on edge nodes", completed: false },
          { id: "t6", title: "Null-route source IP ranges at BGP level", completed: false },
          { id: "t7", title: "Scale infrastructure horizontally", completed: false },
        ],
      },
      {
        id: "recovery",
        name: "Recovery",
        status: "pending",
        tasks: [
          { id: "t8", title: "Verify services restored to normal operation", completed: false },
          { id: "t9", title: "Review and tune WAF rules", completed: false },
          { id: "t10", title: "File abuse reports with upstream ISPs", completed: false },
        ],
      },
    ],
  },
};

// ─── Create Playbook from Template ───────────────────────────────────────────

export const createIRPlaybook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        templateKey: z.enum(["ransomware", "data_breach", "ddos", "custom"]),
        name: z.string().max(200).optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).default("high"),
        affectedSystems: z.array(z.string()).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const template = data.templateKey !== "custom" ? IR_TEMPLATES[data.templateKey] : null;

    const playbook = {
      user_id: context.userId,
      name: data.name ?? template?.name ?? "Custom IR Playbook",
      incident_type: template?.incident_type ?? "custom",
      severity: data.severity,
      phases: template?.phases ?? [],
      mitre_tactics: template?.mitre_tactics ?? [],
      affected_systems: data.affectedSystems,
      timeline: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: "Playbook created",
          actor: "System",
          details: `Template: ${data.templateKey}`,
        },
      ],
    };

    const { data: saved, error } = await supabaseAdmin
      .from("ir_playbooks")
      .insert(playbook)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: saved.id, playbook };
  });

// ─── Get All Playbooks ───────────────────────────────────────────────────────

export const getIRPlaybooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("ir_playbooks")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { playbooks: data ?? [] };
  });

// ─── Update Phase Status ─────────────────────────────────────────────────────

export const updateIRPhase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        playbookId: z.string().uuid(),
        phaseId: z.string(),
        taskId: z.string().optional(),
        phaseStatus: z.enum(["pending", "in_progress", "completed", "skipped"]).optional(),
        taskCompleted: z.boolean().optional(),
        notes: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: pb } = await supabaseAdmin
      .from("ir_playbooks")
      .select("phases, timeline")
      .eq("id", data.playbookId)
      .eq("user_id", context.userId)
      .single();

    if (!pb) throw new Error("Playbook not found");

    const phases = pb.phases as z.infer<typeof phaseSchema>[];
    const timeline = pb.timeline as z.infer<typeof timelineEntrySchema>[];
    const phaseIdx = phases.findIndex((p) => p.id === data.phaseId);

    if (phaseIdx === -1) throw new Error("Phase not found");

    if (data.phaseStatus) {
      phases[phaseIdx].status = data.phaseStatus;
      if (data.phaseStatus === "in_progress" && !phases[phaseIdx].startedAt) {
        phases[phaseIdx].startedAt = new Date().toISOString();
      }
      if (data.phaseStatus === "completed") {
        phases[phaseIdx].completedAt = new Date().toISOString();
      }
    }

    if (data.taskId !== undefined && data.taskCompleted !== undefined) {
      const taskIdx = phases[phaseIdx].tasks.findIndex((t) => t.id === data.taskId);
      if (taskIdx !== -1) {
        phases[phaseIdx].tasks[taskIdx].completed = data.taskCompleted;
        if (data.taskCompleted) {
          phases[phaseIdx].tasks[taskIdx].completedAt = new Date().toISOString();
        }
        if (data.notes) {
          phases[phaseIdx].tasks[taskIdx].notes = data.notes;
        }
      }
    }

    timeline.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: data.taskId
        ? `Task ${data.taskCompleted ? "completed" : "reopened"}: ${data.taskId}`
        : `Phase ${data.phaseId} → ${data.phaseStatus}`,
      actor: context.userId.slice(0, 8),
    });

    await supabaseAdmin
      .from("ir_playbooks")
      .update({ phases, timeline })
      .eq("id", data.playbookId)
      .eq("user_id", context.userId);

    return { ok: true, phases };
  });

// ─── Delete Playbook ─────────────────────────────────────────────────────────

export const deleteIRPlaybook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ playbookId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await supabaseAdmin
      .from("ir_playbooks")
      .delete()
      .eq("id", data.playbookId)
      .eq("user_id", context.userId);
    return { ok: true };
  });
