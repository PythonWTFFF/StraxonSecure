import os

filepath = r"c:\project Straxon\straxonsecure\src\routes\dashboard.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add useAuth import
if "import { useAuth }" not in content:
    content = content.replace(
        'import { supabase } from "@/integrations/supabase/client";',
        'import { supabase } from "@/integrations/supabase/client";\nimport { useAuth } from "@/hooks/useAuth";'
    )

# 2. Add useAuth and alertedIdsRef to Dashboard component
if "const { user } = useAuth();" not in content:
    content = content.replace(
        'function Dashboard() {\n  const [mounted, setMounted] = useState(false);',
        'function Dashboard() {\n  const { user } = useAuth();\n  const alertedIdsRef = useRef(new Set<string>());\n  const [mounted, setMounted] = useState(false);'
    )

# 3. Update the ML Engine Integration to fire webhooks
old_ml = """        if (res.ok) {
          const data = await res.json();
          if (data.anomalies && data.anomalies.length > 0) {
            setMlAnomalies((prev) => {
              const newMap = new Map(prev.map((a: any) => [a.event_id, a]));
              data.anomalies.forEach((a: any) => newMap.set(a.event_id, a));
              return Array.from(newMap.values())
                .sort((a: any, b: any) => b.anomaly_score - a.anomaly_score)
                .slice(0, 20);
            });
          }
        }"""

new_ml = """        if (res.ok) {
          const data = await res.json();
          if (data.anomalies && data.anomalies.length > 0) {
            setMlAnomalies((prev) => {
              const newMap = new Map(prev.map((a: any) => [a.event_id, a]));
              data.anomalies.forEach((a: any) => {
                newMap.set(a.event_id, a);
                
                // Webhook Alerting Logic
                const webhookUrl = user?.user_metadata?.slack_webhook_url;
                if (
                  (a.severity === 'critical' || a.anomaly_score > 0.85) && 
                  !alertedIdsRef.current.has(a.event_id) && 
                  webhookUrl
                ) {
                  alertedIdsRef.current.add(a.event_id);
                  const payload = {
                    content: `🚨 **STRAXON SECURE: CRITICAL ANOMALY DETECTED** 🚨\\n**Type:** ${a.attack_type || 'Unknown'}\\n**Confidence:** ${Math.round(a.anomaly_score * 100)}%\\n**Details:** ${a.reason}`,
                    text: `🚨 *STRAXON SECURE: CRITICAL ANOMALY DETECTED* 🚨\\n*Type:* ${a.attack_type || 'Unknown'}\\n*Confidence:* ${Math.round(a.anomaly_score * 100)}%\\n*Details:* ${a.reason}`
                  };
                  fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  }).catch(console.error);
                }
              });
              return Array.from(newMap.values())
                .sort((a: any, b: any) => b.anomaly_score - a.anomaly_score)
                .slice(0, 20);
            });
          }
        }"""

content = content.replace(old_ml, new_ml)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
