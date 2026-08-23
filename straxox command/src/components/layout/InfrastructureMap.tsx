import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { Server, Database, Activity, Cpu, Cloud, Smartphone } from 'lucide-react';
import { usePulseStore } from '@/stores/pulse.store';

// Custom Node for Straxon
function CustomNode({ data }: { data: any }) {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl border ${data.color} bg-slate-900/90 backdrop-blur-sm min-w-[150px]`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${data.iconBg} ${data.iconColor}`}>
          <data.icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-200">{data.label}</div>
          <div className="text-[10px] font-mono text-slate-500">{data.status}</div>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  {
    id: 'client',
    type: 'custom',
    position: { x: 50, y: 150 },
    data: { label: 'Frontend Client', status: 'Active (React)', icon: Smartphone, color: 'border-blue-500/50', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400' },
  },
  {
    id: 'gateway',
    type: 'custom',
    position: { x: 300, y: 150 },
    data: { label: 'API Gateway', status: 'Node.js/Express', icon: Cloud, color: 'border-violet-500/50', iconBg: 'bg-violet-500/20', iconColor: 'text-violet-400' },
  },
  {
    id: 'pulse',
    type: 'custom',
    position: { x: 550, y: 50 },
    data: { label: 'Straxon Pulse', status: 'Go WebSocket', icon: Activity, color: 'border-emerald-500/50', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400' },
  },
  {
    id: 'cortex',
    type: 'custom',
    position: { x: 550, y: 250 },
    data: { label: 'Cortex AI', status: 'Python Service', icon: Cpu, color: 'border-cyan-500/50', iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400' },
  },
  {
    id: 'db',
    type: 'custom',
    position: { x: 800, y: 150 },
    data: { label: 'PostgreSQL DB', status: 'pgvector Enabled', icon: Database, color: 'border-rose-500/50', iconBg: 'bg-rose-500/20', iconColor: 'text-rose-400' },
  },
  {
    id: 'redis',
    type: 'custom',
    position: { x: 800, y: 50 },
    data: { label: 'Redis Cache', status: 'Pub/Sub Active', icon: Server, color: 'border-amber-500/50', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400' },
  },
];

const initialEdges = [
  { id: 'e1', source: 'client', target: 'gateway', animated: true, style: { stroke: '#8b5cf6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
  { id: 'e2', source: 'client', target: 'pulse', animated: true, style: { stroke: '#10b981' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },
  { id: 'e3', source: 'gateway', target: 'cortex', animated: false, style: { stroke: '#06b6d4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' } },
  { id: 'e4', source: 'gateway', target: 'db', animated: false, style: { stroke: '#f43f5e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f43f5e' } },
  { id: 'e5', source: 'cortex', target: 'db', animated: false, style: { stroke: '#f43f5e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f43f5e' } },
  { id: 'e6', source: 'pulse', target: 'redis', animated: true, style: { stroke: '#f59e0b' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' } },
  { id: 'e7', source: 'gateway', target: 'redis', animated: false, style: { stroke: '#f59e0b' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' } },
];

export function InfrastructureMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const { metrics, isConnected } = usePulseStore();

  useEffect(() => {
    if (isConnected) {
      setEdges((eds) => eds.map(e => {
        // Animate all edges when traffic is high
        if (metrics.requestsPerSecond > 50) {
           return { ...e, animated: true };
        }
        // Restore original animation states
        const original = initialEdges.find(o => o.id === e.id);
        return { ...e, animated: original?.animated || false };
      }));
    }
  }, [metrics.requestsPerSecond, isConnected, setEdges]);

  return (
    <div className="w-full h-[400px] bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Live Infrastructure Topology</h3>
        <p className="text-[10px] font-mono text-slate-500 mt-1">Real-time macro view of Straxon Command microservices</p>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Background color="#334155" gap={24} />
        <Controls className="!bg-slate-900/80 !border-slate-800 !fill-slate-400" />
      </ReactFlow>
    </div>
  );
}
