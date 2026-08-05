import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import {
  Server,
  Database,
  Shield,
  Network,
  Globe,
  Sparkles,
  Cpu,
  Lock,
  Cloud,
  Router,
  Monitor,
  HardDrive,
  Wifi,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  Trash2,
  Copy,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  GitBranch,
  Eye,
  EyeOff,
  Save,
  FileJson,
  Play,
  Pause,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  Link2,
  Unlink,
  Settings,
  FileDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { askAI } from "@/server/ai";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture Designer — Straxon Secure" },
      {
        name: "description",
        content: "Advanced visual security architecture builder with AI threat modeling.",
      },
    ],
  }),
  component: Architecture,
});

// ─── PALETTE ────────────────────────────────────────────────────────────────
const PALETTE_GROUPS = [
  {
    group: "Compute",
    items: [
      {
        type: "Web Server",
        icon: Server,
        color: "var(--neon-cyan)",
        risk: "medium",
        desc: "HTTP/HTTPS endpoint",
      },
      {
        type: "API Gateway",
        icon: Globe,
        color: "var(--warning)",
        risk: "high",
        desc: "API entry point",
      },
      {
        type: "App Server",
        icon: Cpu,
        color: "var(--neon-lime)",
        risk: "medium",
        desc: "Backend application",
      },
      {
        type: "Container",
        icon: Layers,
        color: "var(--neon-cyan)",
        risk: "medium",
        desc: "Docker / K8s pod",
      },
    ],
  },
  {
    group: "Data",
    items: [
      {
        type: "Database",
        icon: Database,
        color: "var(--neon-violet)",
        risk: "critical",
        desc: "Primary data store",
      },
      {
        type: "Cache",
        icon: HardDrive,
        color: "var(--neon-violet)",
        risk: "medium",
        desc: "Redis / Memcached",
      },
      {
        type: "Data Lake",
        icon: Cloud,
        color: "var(--neon-violet)",
        risk: "high",
        desc: "Object / blob storage",
      },
    ],
  },
  {
    group: "Security",
    items: [
      {
        type: "Firewall",
        icon: Shield,
        color: "var(--neon-magenta)",
        risk: "low",
        desc: "Packet filter / WAF",
      },
      {
        type: "IDS/IPS",
        icon: Eye,
        color: "var(--neon-magenta)",
        risk: "low",
        desc: "Intrusion detection",
      },
      {
        type: "IAM",
        icon: Key,
        color: "var(--neon-magenta)",
        risk: "high",
        desc: "Identity & access mgmt",
      },
      {
        type: "HSM",
        icon: Lock,
        color: "var(--neon-magenta)",
        risk: "low",
        desc: "Hardware security module",
      },
    ],
  },
  {
    group: "Network",
    items: [
      {
        type: "Load Balancer",
        icon: Network,
        color: "var(--neon-lime)",
        risk: "medium",
        desc: "Traffic distribution",
      },
      {
        type: "CDN",
        icon: Globe,
        color: "var(--neon-lime)",
        risk: "low",
        desc: "Content delivery",
      },
      {
        type: "VPN",
        icon: Wifi,
        color: "var(--neon-lime)",
        risk: "medium",
        desc: "Encrypted tunnel",
      },
      {
        type: "Router",
        icon: Router,
        color: "var(--neon-lime)",
        risk: "medium",
        desc: "Layer-3 routing",
      },
    ],
  },
  {
    group: "External",
    items: [
      {
        type: "Internet",
        icon: Globe,
        color: "#ff6b35",
        risk: "critical",
        desc: "Public internet",
      },
      {
        type: "User / Client",
        icon: Monitor,
        color: "#aaaaaa",
        risk: "high",
        desc: "End-user device",
      },
      {
        type: "3rd Party API",
        icon: GitBranch,
        color: "#ff6b35",
        risk: "high",
        desc: "External service",
      },
    ],
  },
];

const ALL_PALETTE = PALETTE_GROUPS.flatMap((g) => g.items);

// ─── RISK COLORS ────────────────────────────────────────────────────────────
const RISK_META: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#ff0066", bg: "rgba(255,0,102,0.12)", label: "CRITICAL" },
  high: { color: "#ff6b35", bg: "rgba(255,107,53,0.12)", label: "HIGH" },
  medium: { color: "#ffaa00", bg: "rgba(255,170,0,0.12)", label: "MEDIUM" },
  low: { color: "#00ff88", bg: "rgba(0,255,136,0.1)", label: "LOW" },
};

// ─── TEMPLATES ───────────────────────────────────────────────────────────────
const TEMPLATES: Record<string, { nodes: Omit<Node, "id">[]; edges: Omit<Edge, "id">[] }> = {
  "3-Tier Web": {
    nodes: [
      {
        position: { x: 200, y: 40 },
        data: { label: "Internet", desc: "Public internet", risk: "critical" },
        style: nodeStyle("#ff6b35"),
      },
      {
        position: { x: 200, y: 130 },
        data: { label: "Firewall", desc: "Packet filter / WAF", risk: "low" },
        style: nodeStyle("var(--neon-magenta)"),
      },
      {
        position: { x: 200, y: 220 },
        data: { label: "Load Balancer", desc: "Traffic distribution", risk: "medium" },
        style: nodeStyle("var(--neon-lime)"),
      },
      {
        position: { x: 80, y: 320 },
        data: { label: "Web Server", desc: "HTTP/HTTPS endpoint", risk: "medium" },
        style: nodeStyle("var(--neon-cyan)"),
      },
      {
        position: { x: 320, y: 320 },
        data: { label: "Web Server", desc: "HTTP/HTTPS endpoint", risk: "medium" },
        style: nodeStyle("var(--neon-cyan)"),
      },
      {
        position: { x: 200, y: 420 },
        data: { label: "Database", desc: "Primary data store", risk: "critical" },
        style: nodeStyle("var(--neon-violet)"),
      },
    ],
    edges: [
      { source: "t0", target: "t1", animated: true },
      { source: "t1", target: "t2", animated: true },
      { source: "t2", target: "t3", animated: true },
      { source: "t2", target: "t4", animated: true },
      { source: "t3", target: "t5", animated: true },
      { source: "t4", target: "t5", animated: true },
    ],
  },
  "Zero Trust": {
    nodes: [
      {
        position: { x: 50, y: 200 },
        data: { label: "User / Client", desc: "End-user device", risk: "high" },
        style: nodeStyle("#aaaaaa"),
      },
      {
        position: { x: 220, y: 120 },
        data: { label: "IAM", desc: "Identity & access", risk: "high" },
        style: nodeStyle("var(--neon-magenta)"),
      },
      {
        position: { x: 220, y: 280 },
        data: { label: "IDS/IPS", desc: "Intrusion detection", risk: "low" },
        style: nodeStyle("var(--neon-magenta)"),
      },
      {
        position: { x: 400, y: 200 },
        data: { label: "API Gateway", desc: "API entry point", risk: "high" },
        style: nodeStyle("var(--warning)"),
      },
      {
        position: { x: 580, y: 120 },
        data: { label: "App Server", desc: "Backend application", risk: "medium" },
        style: nodeStyle("var(--neon-lime)"),
      },
      {
        position: { x: 580, y: 280 },
        data: { label: "Database", desc: "Primary data store", risk: "critical" },
        style: nodeStyle("var(--neon-violet)"),
      },
      {
        position: { x: 760, y: 200 },
        data: { label: "HSM", desc: "Key vault", risk: "low" },
        style: nodeStyle("var(--neon-magenta)"),
      },
    ],
    edges: [
      { source: "t0", target: "t1" },
      { source: "t0", target: "t2" },
      { source: "t1", target: "t3", animated: true },
      { source: "t2", target: "t3", animated: true },
      { source: "t3", target: "t4", animated: true },
      { source: "t4", target: "t5", animated: true },
      { source: "t4", target: "t6" },
    ],
  },
  Microservices: {
    nodes: [
      {
        position: { x: 200, y: 40 },
        data: { label: "CDN", desc: "Content delivery", risk: "low" },
        style: nodeStyle("var(--neon-lime)"),
      },
      {
        position: { x: 200, y: 140 },
        data: { label: "API Gateway", desc: "API entry point", risk: "high" },
        style: nodeStyle("var(--warning)"),
      },
      {
        position: { x: 60, y: 260 },
        data: { label: "App Server", desc: "Auth service", risk: "medium" },
        style: nodeStyle("var(--neon-lime)"),
      },
      {
        position: { x: 200, y: 260 },
        data: { label: "App Server", desc: "Order service", risk: "medium" },
        style: nodeStyle("var(--neon-lime)"),
      },
      {
        position: { x: 340, y: 260 },
        data: { label: "App Server", desc: "Notify service", risk: "medium" },
        style: nodeStyle("var(--neon-lime)"),
      },
      {
        position: { x: 60, y: 380 },
        data: { label: "Database", desc: "Auth DB", risk: "critical" },
        style: nodeStyle("var(--neon-violet)"),
      },
      {
        position: { x: 200, y: 380 },
        data: { label: "Database", desc: "Orders DB", risk: "critical" },
        style: nodeStyle("var(--neon-violet)"),
      },
      {
        position: { x: 340, y: 380 },
        data: { label: "Cache", desc: "Notification cache", risk: "medium" },
        style: nodeStyle("var(--neon-violet)"),
      },
    ],
    edges: [
      { source: "t0", target: "t1", animated: true },
      { source: "t1", target: "t2", animated: true },
      { source: "t1", target: "t3", animated: true },
      { source: "t1", target: "t4", animated: true },
      { source: "t2", target: "t5" },
      { source: "t3", target: "t6" },
      { source: "t4", target: "t7" },
    ],
  },
};

// ─── NODE STYLE ──────────────────────────────────────────────────────────────
function nodeStyle(color: string): React.CSSProperties {
  return {
    background: "oklch(0.14 0.04 265)",
    border: `1px solid ${color}`,
    color: "var(--foreground)",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 11,
    padding: "8px 12px",
    borderRadius: 6,
    boxShadow: `0 0 10px ${color}55, inset 0 0 20px ${color}08`,
    minWidth: 110,
    textAlign: "center" as const,
  };
}

// ─── EDGE STYLE ──────────────────────────────────────────────────────────────
const EDGE_PRESETS = [
  {
    label: "Data Flow",
    style: { stroke: "var(--neon-cyan)", strokeWidth: 2 },
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--neon-cyan)" },
  },
  {
    label: "Encrypted",
    style: { stroke: "var(--neon-magenta)", strokeWidth: 2 },
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--neon-magenta)" },
  },
  {
    label: "Trust Boundary",
    style: { stroke: "#ffaa00", strokeWidth: 1, strokeDasharray: "6 3" },
    animated: false,
    markerEnd: undefined,
  },
  {
    label: "Control Plane",
    style: { stroke: "var(--neon-lime)", strokeWidth: 1 },
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--neon-lime)" },
  },
];

// ─── VALIDATION RULES ────────────────────────────────────────────────────────
function runValidation(nodes: Node[], edges: Edge[]) {
  const labels = nodes.map((n) => String(n.data.label));
  const findings: { sev: "critical" | "high" | "medium" | "low"; msg: string }[] = [];

  if (!labels.includes("Firewall"))
    findings.push({ sev: "critical", msg: "No firewall — all traffic is unfiltered." });
  if (labels.includes("Database") && !labels.includes("Firewall"))
    findings.push({ sev: "critical", msg: "Database exposed without a firewall layer." });
  if (!labels.includes("IAM") && labels.length > 3)
    findings.push({ sev: "high", msg: "No IAM component — authentication path undefined." });
  if (
    labels.includes("Internet") &&
    !labels.some((l) => ["Firewall", "IDS/IPS", "WAF"].includes(l))
  )
    findings.push({ sev: "critical", msg: "Internet-facing component has no security control." });
  if (labels.filter((l) => l === "Web Server").length > 1 && !labels.includes("Load Balancer"))
    findings.push({ sev: "medium", msg: "Multiple web servers without a load balancer." });
  if (labels.includes("Database") && !labels.some((l) => ["Cache", "Load Balancer"].includes(l)))
    findings.push({ sev: "low", msg: "No caching layer — DB may face excess load." });
  if (!labels.includes("HSM") && labels.includes("Database"))
    findings.push({ sev: "medium", msg: "No HSM — encryption key management unspecified." });
  if (nodes.length > 0 && edges.length === 0)
    findings.push({ sev: "high", msg: "Nodes present but no connections defined." });
  // Isolated nodes
  nodes.forEach((n) => {
    const connected = edges.some((e) => e.source === n.id || e.target === n.id);
    if (!connected)
      findings.push({ sev: "medium", msg: `Node "${n.data.label}" is isolated (no connections).` });
  });

  return findings;
}

// ─── THREAT MODEL ─────────────────────────────────────────────────────────────
const THREAT_MAP: Record<string, string[]> = {
  "Web Server": ["XSS", "CSRF", "DDoS", "Directory Traversal"],
  "API Gateway": ["Broken Auth", "Rate-limit bypass", "Injection", "Mass Assignment"],
  Database: ["SQL Injection", "Data Exfiltration", "Privilege Escalation", "Ransomware"],
  Firewall: ["Rule misconfiguration", "Bypass via tunneling"],
  IAM: ["Credential stuffing", "Token hijacking", "Privilege escalation"],
  "Load Balancer": ["Session fixation", "IP spoofing"],
  Container: ["Escape to host", "Image tampering", "Secrets in env vars"],
  Internet: ["MITM", "DDoS origin", "Phishing vector"],
  CDN: ["Cache poisoning", "TLS stripping"],
  VPN: ["Credential theft", "Split tunneling abuse"],
};

let _nodeId = 100;
function nextId() {
  return `n${++_nodeId}-${Date.now()}`;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
function Architecture() {
  const { hasAccess } = useSubscription();
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "1",
      position: { x: 100, y: 150 },
      data: { label: "Firewall", desc: "Packet filter / WAF", risk: "low" },
      style: nodeStyle("var(--neon-magenta)"),
    },
    {
      id: "2",
      position: { x: 340, y: 80 },
      data: { label: "Web Server", desc: "HTTP/HTTPS endpoint", risk: "medium" },
      style: nodeStyle("var(--neon-cyan)"),
    },
    {
      id: "3",
      position: { x: 340, y: 240 },
      data: { label: "Database", desc: "Primary data store", risk: "critical" },
      style: nodeStyle("var(--neon-violet)"),
    },
  ]);
  const [edges, setEdges] = useState<Edge[]>([
    {
      id: "e1-2",
      source: "1",
      target: "2",
      animated: true,
      style: { stroke: "var(--neon-cyan)", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--neon-cyan)" },
    },
    {
      id: "e1-3",
      source: "1",
      target: "3",
      animated: true,
      style: { stroke: "var(--neon-violet)", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--neon-violet)" },
    },
  ]);

  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMode, setAiMode] = useState<"review" | "threats" | "compliance" | "optimize">("review");
  const [selectedEdgePreset, setSelectedEdgePreset] = useState(0);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [findings, setFindings] = useState<ReturnType<typeof runValidation>>([]);
  const [showFindings, setShowFindings] = useState(false);
  const [showThreats, setShowThreats] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState<Record<string, boolean>>({
    Compute: true,
    Data: true,
    Security: true,
    Network: false,
    External: false,
  });
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [nodeLabel, setNodeLabel] = useState("");
  const [rfInstance, setRfInstance] = useState<any>(null);

  // Snapshot for undo
  const pushHistory = useCallback(
    (n: Node[], e: Edge[]) => {
      setHistory((h) => [...h.slice(0, historyIdx + 1), { nodes: n, edges: e }].slice(-30));
      setHistoryIdx((i) => Math.min(i + 1, 29));
    },
    [historyIdx],
  );

  const undo = () => {
    if (historyIdx <= 0) return;
    const prev = history[historyIdx - 1];
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setHistoryIdx((i) => i - 1);
  };

  // ── Flow callbacks ──────────────────────────────────────────────────────────
  const onNodesChange = useCallback(
    (c: NodeChange[]) => setNodes((n) => applyNodeChanges(c, n)),
    [],
  );
  const onEdgesChange = useCallback(
    (c: EdgeChange[]) => setEdges((e) => applyEdgeChanges(c, e)),
    [],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      const preset = EDGE_PRESETS[selectedEdgePreset];
      const newEdge: Edge = {
        ...c,
        id: `e-${c.source}-${c.target}-${Date.now()}`,
        animated: isAnimating && preset.animated,
        style: preset.style,
        ...(preset.markerEnd ? { markerEnd: preset.markerEnd } : {}),
        label: preset.label,
        labelStyle: { fill: "var(--foreground)", fontFamily: "monospace", fontSize: 10 },
        labelBgStyle: { fill: "oklch(0.17 0.04 265)", fillOpacity: 0.9 },
      };
      setEdges((e) => {
        const next = addEdge(newEdge, e);
        pushHistory(nodes, next);
        return next;
      });
    },
    [selectedEdgePreset, isAnimating, nodes, pushHistory],
  );

  const onNodeClick = useCallback((_: any, node: Node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  // ── Add node ────────────────────────────────────────────────────────────────
  const addNode = (type: string, color: string, risk: string, desc: string) => {
    const id = nextId();
    const newNode: Node = {
      id,
      position: { x: 180 + Math.random() * 280, y: 160 + Math.random() * 220 },
      data: { label: type, desc, risk },
      style: nodeStyle(color),
    };
    setNodes((n) => {
      const next = [...n, newNode];
      pushHistory(next, edges);
      return next;
    });
    toast.success(`Added "${type}" node`);
  };

  // ── Delete selected node ─────────────────────────────────────────────────────
  const deleteSelected = () => {
    if (!selectedNode) return;
    setNodes((n) => {
      const next = n.filter((x) => x.id !== selectedNode.id);
      pushHistory(next, edges);
      return next;
    });
    setEdges((e) => e.filter((x) => x.source !== selectedNode.id && x.target !== selectedNode.id));
    setSelectedNode(null);
    toast("Node deleted");
  };

  // ── Rename selected node ─────────────────────────────────────────────────────
  const renameSelected = () => {
    if (!selectedNode || !nodeLabel.trim()) return;
    setNodes((n) =>
      n.map((x) =>
        x.id === selectedNode.id ? { ...x, data: { ...x.data, label: nodeLabel.trim() } } : x,
      ),
    );
    setSelectedNode((s) => (s ? { ...s, data: { ...s.data, label: nodeLabel.trim() } } : null));
    setNodeLabel("");
    toast.success("Node renamed");
  };

  // ── Duplicate ────────────────────────────────────────────────────────────────
  const duplicateSelected = () => {
    if (!selectedNode) return;
    const id = nextId();
    const dup: Node = {
      ...selectedNode,
      id,
      position: { x: selectedNode.position.x + 40, y: selectedNode.position.y + 40 },
    };
    setNodes((n) => {
      const next = [...n, dup];
      pushHistory(next, edges);
      return next;
    });
    toast("Node duplicated");
  };

  // ── Clear all ────────────────────────────────────────────────────────────────
  const clearAll = () => {
    pushHistory(nodes, edges);
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    toast("Canvas cleared");
  };

  // ── Load template ────────────────────────────────────────────────────────────
  const loadTemplate = (name: string) => {
    const tpl = TEMPLATES[name];
    if (!tpl) return;
    const newNodes = tpl.nodes.map((n, i) => ({ ...n, id: `t${i}` }));
    const newEdges = tpl.edges.map((e, i) => ({
      ...e,
      id: `te${i}`,
      animated: true,
      style: { stroke: "var(--neon-cyan)", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--neon-cyan)" },
    }));
    pushHistory(nodes, edges);
    setNodes(newNodes);
    setEdges(newEdges);
    toast.success(`Template "${name}" loaded`);
  };

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = () => {
    const f = runValidation(nodes, edges);
    setFindings(f);
    setShowFindings(true);
    if (f.length === 0) toast.success("Architecture passes all checks!");
    else toast.error(`${f.length} finding${f.length > 1 ? "s" : ""} detected`);
  };

  // ── AI ──────────────────────────────────────────────────────────────────────
  const askAINow = async () => {
    setAiBusy(true);
    setAiText("");
    try {
      const summary = `
Architecture nodes: ${nodes.map((n) => `${n.data.label} (risk: ${n.data.risk ?? "unknown"})`).join(", ")}.
Connections: ${edges
        .map((e) => {
          const src = nodes.find((n) => n.id === e.source)?.data.label;
          const tgt = nodes.find((n) => n.id === e.target)?.data.label;
          return `${src} → ${tgt}`;
        })
        .join("; ")}.
      `.trim();

      const prompts: Record<typeof aiMode, string> = {
        review: `Review this security architecture and give hardening recommendations: ${summary}`,
        threats: `Perform a STRIDE threat model analysis on this architecture. Identify spoofing, tampering, repudiation, information disclosure, denial of service, and elevation of privilege threats: ${summary}`,
        compliance: `Analyze this architecture for compliance gaps against NIST CSF, ISO 27001, and SOC 2 Type II: ${summary}`,
        optimize: `Suggest architectural optimizations for resilience, scalability, and cost efficiency while maintaining security: ${summary}`,
      };

      const res = await askAI({
        data: {
          mode: "architect",
          messages: [{ role: "user", content: prompts[aiMode] }],
        },
      });
      setAiText(res.reply);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI error");
    } finally {
      setAiBusy(false);
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const exportJSON = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            nodes,
            edges,
            meta: {
              exported: new Date().toISOString(),
              tool: "Straxon Secure Architecture Designer",
            },
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "straxon-architecture.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported architecture JSON");
  };

  const exportSVG = () => {
    const svg = document.querySelector(".react-flow__renderer svg");
    if (!svg) {
      toast.error("Could not capture SVG");
      return;
    }
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "straxon-architecture.svg";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported SVG");
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { nodes: n, edges: ed } = JSON.parse(ev.target?.result as string);
        pushHistory(nodes, edges);
        setNodes(n ?? []);
        setEdges(ed ?? []);
        toast.success("Architecture imported");
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Metrics ──────────────────────────────────────────────────────────────────
  const metrics = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    criticalNodes: nodes.filter((n) => n.data.risk === "critical").length,
    highNodes: nodes.filter((n) => n.data.risk === "high").length,
    isolated: nodes.filter((n) => !edges.some((e) => e.source === n.id || e.target === n.id))
      .length,
    securityComponents: nodes.filter((n) =>
      ["Firewall", "IDS/IPS", "IAM", "HSM"].includes(n.data.label),
    ).length,
  };

  const secureScore = Math.max(
    0,
    Math.min(
      100,
      (metrics.securityComponents > 0 ? 30 : 0) +
        (nodes.some((n) => n.data.label === "Firewall") ? 20 : 0) +
        (nodes.some((n) => n.data.label === "IAM") ? 20 : 0) +
        (metrics.isolated === 0 ? 15 : 0) +
        (nodes.some((n) => n.data.label === "IDS/IPS") ? 15 : 0),
    ),
  );

  const scoreColor = secureScore >= 80 ? "#00ff88" : secureScore >= 50 ? "#ffaa00" : "#ff0066";

  // ── Threats for selected node ────────────────────────────────────────────────
  const nodeThreats = selectedNode ? (THREAT_MAP[selectedNode.data.label] ?? []) : [];

  // ── Filtered palette ─────────────────────────────────────────────────────────
  const filteredGroups = searchTerm
    ? [
        {
          group: "Results",
          items: ALL_PALETTE.filter((p) => p.type.toLowerCase().includes(searchTerm.toLowerCase())),
        },
      ]
    : PALETTE_GROUPS;

  // ─── Toggle edge animation globally ──────────────────────────────────────────
  const toggleAnimation = () => {
    setIsAnimating((a) => {
      const next = !a;
      setEdges((es) =>
        es.map((e) => ({ ...e, animated: next && e.data?.preset?.animated !== false })),
      );
      return next;
    });
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1600px] mx-auto space-y-5">
      <SectionHeading
        eyebrow="DESIGN"
        title="Architecture Designer"
        description="Drag, connect, and threat-model your security architecture. AI-powered review with STRIDE, NIST, and compliance analysis."
      />

      {/* ── TOOLBAR ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border bg-card/50 backdrop-blur">
        {/* Templates */}
        <div className="flex items-center gap-1 border-r border-border pr-3 mr-1">
          <span className="text-xs font-mono text-muted-foreground mr-1">TEMPLATE:</span>
          {Object.keys(TEMPLATES).map((name) => (
            <button
              key={name}
              onClick={() => loadTemplate(name)}
              className="px-2 py-1 text-xs font-mono rounded border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
            >
              {name}
            </button>
          ))}
        </div>

        {/* Edge preset */}
        <div className="flex items-center gap-1 border-r border-border pr-3 mr-1">
          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          {EDGE_PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setSelectedEdgePreset(i)}
              className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${i === selectedEdgePreset ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={undo}
            title="Undo"
            disabled={historyIdx <= 0}
            className="p-1.5 rounded border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={toggleAnimation}
            title={isAnimating ? "Pause animations" : "Play animations"}
            className="p-1.5 rounded border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
          >
            {isAnimating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setShowGrid((g) => !g)}
            title="Toggle grid"
            className={`p-1.5 rounded border transition-colors ${showGrid ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowMinimap((m) => !m)}
            title="Toggle minimap"
            className={`p-1.5 rounded border transition-colors ${showMinimap ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={validate}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono rounded border border-border hover:border-yellow-400 text-muted-foreground hover:text-yellow-400 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Validate
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono rounded border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          <button
            onClick={exportSVG}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono rounded border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> SVG
          </button>
          <label className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono rounded border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            <Upload className="h-3.5 w-3.5" /> Import
            <input type="file" accept=".json" className="hidden" onChange={importJSON} />
          </label>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono rounded border border-border hover:border-red-500 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* ── METRICS BAR ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Nodes", value: metrics.totalNodes, icon: Layers, color: "text-primary" },
          {
            label: "Connections",
            value: metrics.totalEdges,
            icon: GitBranch,
            color: "text-primary",
          },
          { label: "Critical", value: metrics.criticalNodes, icon: XCircle, color: "text-red-500" },
          {
            label: "High Risk",
            value: metrics.highNodes,
            icon: AlertTriangle,
            color: "text-orange-400",
          },
          {
            label: "Isolated",
            value: metrics.isolated,
            icon: Unlink,
            color: metrics.isolated > 0 ? "text-yellow-400" : "text-green-400",
          },
          {
            label: "Secure Score",
            value: `${secureScore}%`,
            icon: BarChart3,
            color: "",
            style: { color: scoreColor },
          },
        ].map((m) => (
          <CyberCard key={m.label} variant="cyan" className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xl font-mono font-bold ${m.color}`} style={m.style ?? {}}>
                  {m.value}
                </div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  {m.label}
                </div>
              </div>
              <m.icon className={`h-5 w-5 opacity-30 ${m.color}`} style={m.style ?? {}} />
            </div>
          </CyberCard>
        ))}
      </div>

      {/* ── MAIN CANVAS AREA ─────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[240px_1fr_240px] gap-4">
        {/* LEFT: Component Palette */}
        <div className="space-y-3">
          <CyberCard variant="cyan" className="p-3">
            <div className="text-xs font-mono uppercase text-primary mb-2 flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" /> Components
            </div>
            <input
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-xs font-mono rounded border border-border bg-background/60 text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:border-primary"
            />
            <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
              {filteredGroups.map((g) => (
                <div key={g.group}>
                  <button
                    onClick={() => setPaletteOpen((o) => ({ ...o, [g.group]: !o[g.group] }))}
                    className="w-full flex items-center justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider py-1 hover:text-primary transition-colors"
                  >
                    {g.group}
                    {paletteOpen[g.group] ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  {(paletteOpen[g.group] || !!searchTerm) && (
                    <div className="space-y-1 mb-2">
                      {g.items.map((p) => {
                        const Icon = p.icon;
                        const rm = RISK_META[p.risk];
                        return (
                          <button
                            key={p.type}
                            onClick={() => addNode(p.type, p.color, p.risk, p.desc)}
                            title={p.desc}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded border border-border hover:border-primary text-xs font-mono text-left transition-all hover:bg-primary/5 group"
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: p.color }} />
                            <span className="flex-1 text-foreground/80 group-hover:text-foreground">
                              {p.type}
                            </span>
                            <span
                              className="text-[9px] px-1 rounded"
                              style={{ background: rm.bg, color: rm.color }}
                            >
                              {rm.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CyberCard>

          {/* Selected Node Inspector */}
          {selectedNode && (
            <CyberCard variant="magenta" className="p-3">
              <div className="text-xs font-mono uppercase text-accent mb-2 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Inspector
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground font-mono">Label</div>
                  <div className="text-sm font-mono text-foreground font-bold">
                    {selectedNode.data.label}
                  </div>
                </div>
                {selectedNode.data.desc && (
                  <div>
                    <div className="text-xs text-muted-foreground font-mono">Description</div>
                    <div className="text-xs text-foreground/70">{selectedNode.data.desc}</div>
                  </div>
                )}
                {selectedNode.data.risk && (
                  <div>
                    <div className="text-xs text-muted-foreground font-mono">Risk</div>
                    <span
                      className="text-xs px-2 py-0.5 rounded font-mono"
                      style={{
                        background: RISK_META[selectedNode.data.risk]?.bg,
                        color: RISK_META[selectedNode.data.risk]?.color,
                      }}
                    >
                      {RISK_META[selectedNode.data.risk]?.label}
                    </span>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground font-mono mb-1">Rename</div>
                  <div className="flex gap-1">
                    <input
                      value={nodeLabel}
                      onChange={(e) => setNodeLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && renameSelected()}
                      placeholder="New name…"
                      className="flex-1 px-2 py-1 text-xs font-mono rounded border border-border bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={renameSelected}
                      className="px-2 py-1 text-xs font-mono rounded border border-primary text-primary hover:bg-primary/10"
                    >
                      OK
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 pt-1">
                  <button
                    onClick={duplicateSelected}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-mono rounded border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Copy className="h-3 w-3" /> Clone
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-mono rounded border border-border hover:border-red-500 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
                {nodeThreats.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowThreats((t) => !t)}
                      className="w-full flex items-center justify-between text-xs font-mono text-yellow-400 hover:text-yellow-300 py-1"
                    >
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Known Threats ({nodeThreats.length})
                      </span>
                      {showThreats ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    {showThreats && (
                      <ul className="space-y-1 mt-1">
                        {nodeThreats.map((t) => (
                          <li
                            key={t}
                            className="text-[10px] font-mono text-orange-400 flex items-start gap-1"
                          >
                            <span className="mt-0.5">›</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </CyberCard>
          )}
        </div>

        {/* CENTER: Canvas */}
        <CyberCard variant="cyan" className="p-0 overflow-hidden min-h-[580px]">
          <div className="h-[580px] bg-background/30 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onInit={setRfInstance}
              fitView
              deleteKeyCode="Delete"
            >
              {showGrid && (
                <Background color="var(--neon-cyan)" gap={24} style={{ opacity: 0.15 }} />
              )}
              <Controls className="!bg-card !border-border !shadow-none" />
              {showMinimap && (
                <MiniMap
                  className="!bg-card !border !border-border"
                  maskColor="rgba(0,0,0,0.6)"
                  nodeColor={(n) => {
                    const rm = RISK_META[n.data?.risk];
                    return rm?.color ?? "var(--neon-cyan)";
                  }}
                />
              )}
            </ReactFlow>
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-muted-foreground font-mono text-sm">
                  <Layers className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <div className="opacity-40">Click a component to add it,</div>
                  <div className="opacity-40">or load a template from the toolbar.</div>
                </div>
              </div>
            )}
          </div>
        </CyberCard>

        {/* RIGHT: AI Panel */}
        <div className="space-y-3">
          {/* AI Controls */}
          <CyberCard variant="magenta" className="p-3">
            <div className="text-xs font-mono uppercase text-accent mb-3 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Analysis
            </div>
            <div className="space-y-1 mb-3">
              {(["review", "threats", "compliance", "optimize"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setAiMode(m)}
                  className={`w-full text-left px-2 py-1.5 text-xs font-mono rounded border transition-colors ${aiMode === m ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground hover:border-accent"}`}
                >
                  {m === "review" && "🔍 Architecture Review"}
                  {m === "threats" && "⚡ STRIDE Threat Model"}
                  {m === "compliance" && "📋 Compliance Gap (NIST/ISO)"}
                  {m === "optimize" && "🚀 Optimization Suggestions"}
                </button>
              ))}
            </div>
            <CyberButton
              size="sm"
              variant="magenta"
              className="w-full"
              onClick={askAINow}
              disabled={aiBusy || nodes.length === 0}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiBusy ? "Analyzing…" : "Run Analysis"}
            </CyberButton>
            <CyberButton
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => {
                if (!hasAccess) {
                  toast.error("PDF export is a Pro feature");
                  window.location.href = "/pricing";
                  return;
                }
                generateArchitectureReport(
                  "Untitled Design",
                  nodes.map((n) => ({ id: n.id, label: String(n.data.label) })),
                  edges.map((e) => ({ source: e.source, target: e.target })),
                  aiText || undefined,
                );
                toast.success("Architecture PDF downloaded");
              }}
            >
              <FileDown className="h-3.5 w-3.5" /> Export PDF {!hasAccess && "🔒"}
            </CyberButton>
          </CyberCard>

          {/* Validation Findings */}
          {showFindings && findings.length > 0 && (
            <CyberCard variant="cyan" className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono uppercase text-primary flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Findings ({findings.length})
                </div>
                <button
                  onClick={() => setShowFindings(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {findings.map((f, i) => {
                  const rm = RISK_META[f.sev];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-1.5 rounded text-[11px] font-mono"
                      style={{ background: rm.bg }}
                    >
                      <span className="shrink-0 mt-0.5 font-bold" style={{ color: rm.color }}>
                        {rm.label}
                      </span>
                      <span className="text-foreground/80">{f.msg}</span>
                    </div>
                  );
                })}
              </div>
            </CyberCard>
          )}

          {showFindings && findings.length === 0 && (
            <CyberCard variant="cyan" className="p-3">
              <div className="flex items-center gap-2 text-xs font-mono text-green-400">
                <CheckCircle2 className="h-4 w-4" /> All checks passed
              </div>
            </CyberCard>
          )}

          {/* Legend */}
          <CyberCard variant="cyan" className="p-3">
            <div className="text-xs font-mono uppercase text-primary mb-2 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> Risk Legend
            </div>
            <div className="space-y-1">
              {Object.entries(RISK_META).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-[11px] font-mono">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: v.color, boxShadow: `0 0 4px ${v.color}` }}
                  />
                  <span style={{ color: v.color }}>{v.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              <div className="text-xs font-mono uppercase text-primary mb-1">Security Score</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${secureScore}%`,
                      background: scoreColor,
                      boxShadow: `0 0 6px ${scoreColor}`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: scoreColor }}>
                  {secureScore}%
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {secureScore >= 80
                  ? "Strong security posture"
                  : secureScore >= 50
                    ? "Moderate — add controls"
                    : "Weak — immediate action needed"}
              </div>
            </div>
          </CyberCard>
        </div>
      </div>

      {/* ── AI OUTPUT ────────────────────────────────────────────────────── */}
      {(aiText || aiBusy) && (
        <CyberCard variant="magenta">
          <div className="text-xs font-mono uppercase text-accent mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI{" "}
            {aiMode === "review"
              ? "Architecture Review"
              : aiMode === "threats"
                ? "STRIDE Threat Model"
                : aiMode === "compliance"
                  ? "Compliance Analysis"
                  : "Optimization Report"}
          </div>
          {aiBusy ? (
            <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm py-4">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              Analyzing architecture…
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{aiText}</ReactMarkdown>
            </div>
          )}
        </CyberCard>
      )}
    </div>
  );
}
