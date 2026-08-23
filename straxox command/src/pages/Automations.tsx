import { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Workflow, Plus, Save, Zap, Globe, MessageSquare, Bot } from "lucide-react";

// Custom Trigger Node
const TriggerNode = ({ data }: any) => {
  return (
    <div className="bg-slate-900 border border-indigo-500 rounded-xl p-4 shadow-xl shadow-indigo-500/10 min-w-[200px]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Zap className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider">Trigger</div>
          <div className="text-sm font-semibold text-slate-100">{data.label}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
};

// Custom Action Node
const ActionNode = ({ data }: any) => {
  const Icon = data.icon === "slack" ? MessageSquare : data.icon === "bot" ? Bot : Globe;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-600" />
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-800 rounded-lg">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Action</div>
          <div className="text-sm font-semibold text-slate-100">{data.label}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500" />
    </div>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
};

const initialNodes = [
  { id: "1", type: "trigger", position: { x: 50, y: 150 }, data: { label: "Deal Won" } },
  { id: "2", type: "action", position: { x: 350, y: 100 }, data: { label: "Send Slack Alert", icon: "slack" } },
  { id: "3", type: "action", position: { x: 350, y: 200 }, data: { label: "Generate Proposal", icon: "bot" } },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#6366f1" } },
  { id: "e1-3", source: "1", target: "3", animated: true, style: { stroke: "#6366f1" } },
];

export default function Automations() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [saving, setSaving] = useState(false);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#6366f1" } }, eds));
  }, [setEdges]);

  const onSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  const addAction = () => {
    const newNode = {
      id: crypto.randomUUID(),
      type: "action",
      position: { x: 600, y: 150 },
      data: { label: "Fire Webhook", icon: "globe" },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="p-6 border-b border-slate-800/60 bg-slate-950/50 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Workflow className="w-5 h-5 text-indigo-400" />
            </div>
            Visual Builder
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-mono">Drag and drop to automate workflows</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={addAction}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Add Action
          </button>
          <button 
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            {saving ? <span className="animate-pulse">Saving...</span> : <><Save className="w-4 h-4" /> Save Flow</>}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-950"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls className="bg-slate-900 border-slate-800 text-slate-400 [&>button]:border-slate-800 [&>button]:bg-slate-900 hover:[&>button]:bg-slate-800" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'trigger') return '#6366f1';
              return '#10b981';
            }}
            maskColor="rgba(2, 6, 23, 0.7)"
            style={{ backgroundColor: '#0f172a' }}
            className="border-slate-800"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
