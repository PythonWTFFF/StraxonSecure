import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { generateCompletion } from "./ai.service";
export const handleQuery = async (req: any, res: Response) => {
  try {
    const { query } = req.body;
    const organizationId = req.user.organizationId;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // 1. Parse intent using OpenAI
    const intentPrompt = `
    You are Cortex, an autonomous AI assistant for Straxon Labs.
    The user is asking: "${query}"
    
    Determine if this is a command to CREATE a deal, CREATE a client, or a GENERAL question.
    Return JSON with:
    {
      "intent": "create_deal" | "create_client" | "general",
      "parameters": {
         "clientName": "string (for deal)",
         "value": "number (for deal)",
         "name": "string (for client)",
         "email": "string (for client)",
         "industry": "string (for client)"
      }
    }
    `;

    try {
      const intentRes = await generateCompletion({ prompt: intentPrompt, responseFormat: "json_object", timeoutMs: 8000 });
      const parsed = JSON.parse(intentRes);

      if (parsed.intent === "create_client") {
        const client = await prisma.client.create({
          data: {
            name: parsed.parameters.name || "New Client",
            email: parsed.parameters.email || "client@example.com",
            industry: parsed.parameters.industry || "Technology",
            ltv: 0,
            projects: 0,
            color: "#3b82f6",
            organizationId,
          }
        });
        return res.json({ answer: `✅ Automatically created client **${client.name}**!` });
      }

      if (parsed.intent === "create_deal") {
        // Try to find the client first
        let client = await prisma.client.findFirst({
          where: { name: { contains: parsed.parameters.clientName || "", mode: "insensitive" }, organizationId }
        });
        
        if (!client) {
          client = await prisma.client.create({
            data: {
              name: parsed.parameters.clientName || "Unknown Client",
              email: "unknown@example.com",
              industry: "Unknown",
              ltv: 0,
              projects: 0,
              color: "#f59e0b",
              organizationId,
            }
          });
        }

        const deal = await prisma.deal.create({
          data: {
            clientId: client.id,
            stage: "Lead",
            value: Number(parsed.parameters.value) || 0,
            notes: "Created by Cortex AI",
            organizationId,
          }
        });
        return res.json({ answer: `✅ Created a new deal for **${client.name}** valued at ₹${deal.value}.` });
      }
    } catch (e) {
      console.warn("Intent parsing failed, falling back to general search", e);
    }

    // 2. Fallback to Python Cortex service for general queries
    const cortexUrl = process.env.CORTEX_URL || "http://localhost:8000";

    const response = await fetch(`${cortexUrl}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Cortex Error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: "Failed to process query in Cortex service" });
    }

    const data = await response.json();
    return res.json({ answer: data.answer });

  } catch (error) {
    console.error("AI Controller Error:", error);
    return res.status(500).json({ error: "Internal server error connecting to Cortex" });
  }
};

export const syncEmbedding = async (req: Request, res: Response) => {
  try {
    const { sourceType, sourceId, content } = req.body;
    
    // Using any for the user type to avoid typing issues with Express Request
    const organizationId = (req as any).user?.organizationId;

    if (!sourceType || !sourceId || !content) {
      return res.status(400).json({ error: "sourceType, sourceId, and content are required" });
    }

    if (!organizationId) {
       return res.status(401).json({ error: "Unauthorized" });
    }

    const cortexUrl = process.env.CORTEX_URL || "http://localhost:8000";

    const response = await fetch(`${cortexUrl}/embeddings/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceType, sourceId, content, organizationId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Cortex Sync Error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: "Failed to sync embedding in Cortex service" });
    }

    const data = await response.json();
    return res.json(data);

  } catch (error) {
    return res.status(500).json({ error: "Internal server error connecting to Cortex" });
  }
};

export const draftProposal = async (req: any, res: Response) => {
  try {
    const { dealId } = req.body;
    const organizationId = req.user.organizationId;
    
    if (!dealId) return res.status(400).json({ error: "dealId is required" });
    
    const deal = await prisma.deal.findUnique({
      where: { id: dealId, organizationId },
      include: { client: { include: { projectList: { include: { tasks: true } } } } }
    });
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const context = `
      Client Name: ${deal.client.name}
      Industry: ${deal.client.industry}
      Deal Value: ${deal.value}
      Deal Notes: ${deal.notes || "None"}
      Past Projects: ${deal.client.projectList.map(p => p.name).join(", ")}
    `;

    const prompt = `
    You are an expert agency proposal writer. Draft a professional project proposal in JSON format based on the following context.
    Context:
    ${context}

    Return ONLY a JSON object with these exact keys:
    - executiveSummary (string)
    - systemScope (string)
    - objectives (string)
    - techStack (string)
    - budgetTotal (string)
    - nextSteps (string)
    `;

    try {
      const responseStr = await generateCompletion({ prompt, responseFormat: "json_object" });
      const draft = JSON.parse(responseStr);
      return res.json({ success: true, draft });
    } catch (aiError) {
      console.error("AI Generation failed, using fallback draft:", aiError);
      const fallbackDraft = {
        executiveSummary: `Proposal for ${deal.client.name} (Auto-generated placeholder)`,
        systemScope: "Scope to be determined based on detailed requirements.",
        objectives: "Deliver high-quality solutions aligned with client goals.",
        techStack: "Modern web stack",
        budgetTotal: "TBD",
        nextSteps: "Schedule a discovery call to finalize scope."
      };
      return res.json({ success: true, draft: fallbackDraft, note: "AI generation failed, fallback provided." });
    }
  } catch (error) {
    console.error("AI Draft Error:", error);
    return res.status(500).json({ error: "Failed to generate proposal draft" });
  }
};

export const getClientSummary = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    
    const client = await prisma.client.findUnique({
      where: { id, organizationId },
      include: { deals: true, projectList: true }
    });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const context = `
      Client: ${client.name}
      Deals: ${client.deals.map(d => `${d.stage} - ${d.value}`).join(", ")}
      Projects: ${client.projectList.map(p => p.name).join(", ")}
    `;

    const prompt = `
    Based on the following CRM data for a client, provide a short 2-paragraph executive summary of our relationship and 3 bulleted "Next Best Actions".
    Data:
    ${context}

    Return ONLY a JSON object with these keys:
    - summary (string)
    - nextActions (array of strings)
    `;

    try {
      const responseStr = await generateCompletion({ prompt, responseFormat: "json_object" });
      const insight = JSON.parse(responseStr);
      return res.json({ success: true, insight });
    } catch (aiError) {
      console.error("AI Generation failed, using fallback insight:", aiError);
      const fallbackInsight = {
        summary: `Relationship summary for ${client.name} is currently unavailable.`,
        nextActions: ["Review client account manually", "Schedule a check-in call"]
      };
      return res.json({ success: true, insight: fallbackInsight, note: "AI generation failed, fallback provided." });
    }
  } catch (error) {
    console.error("AI Summary Error:", error);
    return res.status(500).json({ error: "Failed to generate summary" });
  }
};
