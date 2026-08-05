import { DeliverableContent } from "./deliverables";

export interface Profile {
  id?: string;
  full_name: string | null;
  email: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  workspace_id: string | null;
  service_type: string;
  service_name: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  progress: number;
  price_cents: number;
  intake_data: Record<string, unknown>;
  deliverable_url: string | null;
  generated_content: DeliverableContent | null;
  error_message: string | null;
  created_at: string;
  is_public: boolean;
  share_token: string;
  revisions_count: number;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  message: string;
  admin_response: string | null;
  order_id: string | null;
  user_id: string | null;
  contact_email?: string;
  contact_name?: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  email: string;
  name: string | null;
  status: string;
  score: number;
  created_at: string;
}
