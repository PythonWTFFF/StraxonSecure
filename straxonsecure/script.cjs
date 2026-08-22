const fs = require('fs');
const path = 'c:/project Straxon/straxonsecure/src/integrations/supabase/types.ts';
let content = fs.readFileSync(path, 'utf8');

const additionalTables = `
        ctf_challenges: {
          Row: { id: string; title: string; description: string; points: number; category: string; flag_hash: string; created_at: string; hints: any; max_hints: number; is_active: boolean; solve_count: number; };
          Insert: { id?: string; title: string; description: string; points?: number; category: string; flag_hash: string; created_at?: string; hints?: any; max_hints?: number; is_active?: boolean; solve_count?: number; };
          Update: { id?: string; title?: string; description?: string; points?: number; category?: string; flag_hash?: string; created_at?: string; hints?: any; max_hints?: number; is_active?: boolean; solve_count?: number; };
          Relationships: [];
        };
        ctf_solves: {
          Row: { id: string; user_id: string; challenge_id: string; solved_at: string; hints_used: number; points_earned: number; };
          Insert: { id?: string; user_id: string; challenge_id: string; solved_at?: string; hints_used?: number; points_earned?: number; };
          Update: { id?: string; user_id?: string; challenge_id?: string; solved_at?: string; hints_used?: number; points_earned?: number; };
          Relationships: [];
        };
        ctf_hint_usage: {
          Row: { id: string; user_id: string; challenge_id: string; hint_index: number; used_at: string; };
          Insert: { id?: string; user_id: string; challenge_id: string; hint_index: number; used_at?: string; };
          Update: { id?: string; user_id?: string; challenge_id?: string; hint_index?: number; used_at?: string; };
          Relationships: [];
        };
        warroom_sessions: {
          Row: { id: string; title: string; scenario: string; owner_id: string; status: string; created_at: string; };
          Insert: { id?: string; title: string; scenario: string; owner_id: string; status?: string; created_at?: string; };
          Update: { id?: string; title?: string; scenario?: string; owner_id?: string; status?: string; created_at?: string; };
          Relationships: [];
        };
        warroom_messages: {
          Row: { id: string; session_id: string; user_id: string; content: string; created_at: string; };
          Insert: { id?: string; session_id: string; user_id: string; content: string; created_at?: string; };
          Update: { id?: string; session_id?: string; user_id?: string; content?: string; created_at?: string; };
          Relationships: [];
        };
        ir_playbooks: {
          Row: { id: string; title: string; description: string; author_id: string; steps: any; is_public: boolean; created_at: string; };
          Insert: { id?: string; title: string; description: string; author_id: string; steps?: any; is_public?: boolean; created_at?: string; };
          Update: { id?: string; title?: string; description?: string; author_id?: string; steps?: any; is_public?: boolean; created_at?: string; };
          Relationships: [];
        };
        packet_scans: {
          Row: { id: string; user_id: string; filename: string; size_bytes: number; analysis_results: any; created_at: string; };
          Insert: { id?: string; user_id: string; filename: string; size_bytes: number; analysis_results: any; created_at?: string; };
          Update: { id?: string; user_id?: string; filename?: string; size_bytes?: number; analysis_results?: any; created_at?: string; };
          Relationships: [];
        };
        pentest_jobs: {
          Row: { id: string; user_id: string; target: string; mode: string; status: string; risk_level: string | null; ai_report: string | null; created_at: string; };
          Insert: { id?: string; user_id: string; target: string; mode: string; status?: string; risk_level?: string | null; ai_report?: string | null; created_at?: string; };
          Update: { id?: string; user_id?: string; target?: string; mode?: string; status?: string; risk_level?: string | null; ai_report?: string | null; created_at?: string; };
          Relationships: [];
        };
        posture_evaluations: {
          Row: { id: string; user_id: string; cloud_provider: string; score: number; findings: any; evaluated_at: string; };
          Insert: { id?: string; user_id: string; cloud_provider: string; score: number; findings: any; evaluated_at?: string; };
          Update: { id?: string; user_id?: string; cloud_provider?: string; score?: number; findings?: any; evaluated_at?: string; };
          Relationships: [];
        };
        leads: {
          Row: { id: string; email: string; company: string | null; interest: string | null; created_at: string; };
          Insert: { id?: string; email: string; company?: string | null; interest?: string | null; created_at?: string; };
          Update: { id?: string; email?: string; company?: string | null; interest?: string | null; created_at?: string; };
          Relationships: [];
        };
        lab_sessions: {
          Row: { id: string; user_id: string; lab_id: string; container_id: string | null; container_ip: string | null; container_port: number | null; started_at: string; completed_at: string | null; };
          Insert: { id?: string; user_id: string; lab_id: string; container_id?: string | null; container_ip?: string | null; container_port?: number | null; started_at?: string; completed_at?: string | null; };
          Update: { id?: string; user_id?: string; lab_id?: string; container_id?: string | null; container_ip?: string | null; container_port?: number | null; started_at?: string; completed_at?: string | null; };
          Relationships: [];
        };
`;

content = content.replace("Views: {", additionalTables + "\n      };\n      Views: {");
fs.writeFileSync(path, content);
console.log("Types injected!");
