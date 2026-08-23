import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Github, Figma, Link as LinkIcon,
  CheckCircle2, Circle, Clock, AlertTriangle, Pause,
  Trash2, MoreVertical, ChevronDown, Users, Target
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  "todo":        { label: "To Do",       color: "text-zinc-400",   bg: "bg-zinc-500/10",   border: "border-zinc-500/20",   icon: Circle },
  "in-progress": { label: "In Progress", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: Clock },
  "blocked":     { label: "Blocked",     color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    icon: AlertTriangle },
  "review":      { label: "Review",      color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: Pause },
  "completed":   { label: "Completed",   color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20",   icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<string, { color: string; dot: string }> = {
  "low":    { color: "text-zinc-500", dot: "bg-zinc-500" },
  "medium": { color: "text-amber-400", dot: "bg-amber-400" },
  "high":   { color: "text-red-400", dot: "bg-red-400" },
};

const PROJECT_STATUS_TABS = ["all", "active", "paused", "completed", "cancelled"] as const;

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Projects() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState<string | null>(null); // projectId
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({ clientId: "", name: "", status: "active", repoUrl: "", figmaUrl: "", envUrl: "" });
  const [taskForm, setTaskForm] = useState({ title: "", status: "todo", priority: "medium", dueDate: "" });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/projects");
      return res.json();
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/clients");
      return res.json();
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch("/api/v1/projects", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowProjectModal(false);
      setProjectForm({ clientId: "", name: "", status: "active", repoUrl: "", figmaUrl: "", envUrl: "" });
      toast.success("Project created!");
    },
    onError: () => toast.error("Failed to create project"),
  });

  const createTaskMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
      const res = await authFetch(`/api/v1/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowTaskModal(null);
      setTaskForm({ title: "", status: "todo", priority: "medium", dueDate: "" });
      toast.success("Task added!");
    },
    onError: () => toast.error("Failed to add task"),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "completed" ? "todo" : "completed";
      const res = await authFetch(`/api/v1/projects/tasks/${taskId}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    onError: () => toast.error("Failed to update task"),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted"); },
    onError: () => toast.error("Failed to delete project"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await authFetch(`/api/v1/projects/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    onError: () => toast.error("Failed to delete task"),
  });

  const filtered = statusFilter === "all" ? projects : projects.filter((p: any) => p.status === statusFilter);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-mono">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Projects & Delivery</h1>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">{projects.length} projects total</p>
        </div>
        <Button onClick={() => setShowProjectModal(true)} className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-900/30">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800 w-fit">
        {PROJECT_STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${statusFilter === tab ? "bg-zinc-700 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {tab}
            <span className="ml-1.5 text-[10px] opacity-60">
              {tab === "all" ? projects.length : projects.filter((p: any) => p.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((project: any, idx: number) => {
              const completedTasks = project.tasks?.filter((t: any) => t.status === "completed").length || 0;
              const totalTasks = project.tasks?.length || 0;
              const blockedTasks = project.tasks?.filter((t: any) => t.status === "blocked").length || 0;
              const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
              const isExpanded = expandedProject === project.id;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="glass-card border-zinc-800 hover:border-zinc-700 transition-all group">
                    <CardHeader className="pb-3 border-b border-zinc-800/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Badge variant="outline" className="mb-2 text-zinc-400 border-zinc-700 bg-zinc-900/50 uppercase tracking-widest text-[10px]">
                            {project.client?.name || "No Client"}
                          </Badge>
                          <CardTitle className="text-base text-zinc-100 leading-tight">{project.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className={
                            project.status === "active" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_-3px_var(--glow-cyan)] border text-[10px]" :
                            project.status === "completed" ? "bg-green-500/10 text-green-400 border-green-500/20 border text-[10px]" :
                            "bg-zinc-800 text-zinc-400 text-[10px]"
                          }>{project.status}</Badge>
                          <button
                            onClick={() => deleteProjectMutation.mutate(project.id)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Quick links */}
                      <div className="flex gap-1.5 mt-3">
                        {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"><Github className="w-3 h-3" /></a>}
                        {project.figmaUrl && <a href={project.figmaUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"><Figma className="w-3 h-3" /></a>}
                        {project.envUrl && <a href={project.envUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"><LinkIcon className="w-3 h-3" /></a>}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-3">
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1.5">
                          <span>{completedTasks}/{totalTasks} tasks</span>
                          <span className="text-cyan-400">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full ${blockedTasks > 0 ? "bg-gradient-to-r from-red-600 to-amber-500" : "bg-gradient-to-r from-cyan-600 to-indigo-600"} shadow-sm`}
                          />
                        </div>
                        {blockedTasks > 0 && (
                          <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />{blockedTasks} blocked</p>
                        )}
                      </div>

                      {/* Tasks (collapsible) */}
                      <button
                        onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                        className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest font-medium text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
                      >
                        <span>Tasks</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1.5 mb-3">
                              {project.tasks?.length === 0 && (
                                <p className="text-xs text-zinc-600 italic py-2">No tasks yet</p>
                              )}
                              {project.tasks?.map((task: any) => {
                                const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG["todo"];
                                const priCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG["medium"];
                                return (
                                  <div key={task.id} className="flex items-center gap-2 group/task p-1.5 rounded-lg hover:bg-zinc-800/30 transition-colors">
                                    <button onClick={() => toggleTaskMutation.mutate({ taskId: task.id, currentStatus: task.status })} className={`flex-shrink-0 ${cfg.color} hover:scale-110 transition-transform`}>
                                      <cfg.icon className="w-4 h-4" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs transition-all ${task.status === "completed" ? "line-through text-zinc-600" : "text-zinc-300"}`}>{task.title}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-mono flex items-center gap-1 ${priCfg.color}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />{task.priority}
                                        </span>
                                        {task.dueDate && <span className="text-[10px] text-zinc-600 font-mono">{formatDate(task.dueDate)}</span>}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => deleteTaskMutation.mutate(task.id)}
                                      className="opacity-0 group-hover/task:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setShowTaskModal(project.id)}
                        className="w-full mt-1 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 border border-dashed border-zinc-800 hover:border-cyan-500/30 transition-all text-[10px] font-mono tracking-widest uppercase"
                      >
                        <Plus className="w-3 h-3 mr-1.5" /> Add Task
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <Target className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-zinc-400 font-medium">No projects found</p>
              <p className="text-zinc-600 text-sm mt-1">Create your first project to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowProjectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg glass-card border border-zinc-700 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-lg font-bold text-zinc-100">New Project</h2><p className="text-xs text-zinc-500 font-mono mt-0.5">Start tracking a delivery</p></div>
                <button onClick={() => setShowProjectModal(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Client *</Label>
                  <select value={projectForm.clientId} onChange={(e) => setProjectForm(f => ({ ...f, clientId: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors">
                    <option value="">Select a client...</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Project Name *</Label>
                    <Input placeholder="e.g. Straxon Secure v2" value={projectForm.name} onChange={(e) => setProjectForm(f => ({ ...f, name: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-cyan-500" />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Status</Label>
                    <select value={projectForm.status} onChange={(e) => setProjectForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors">
                      <option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider flex items-center gap-1"><Github className="w-3 h-3" />Repo URL</Label>
                    <Input placeholder="https://github.com/..." value={projectForm.repoUrl} onChange={(e) => setProjectForm(f => ({ ...f, repoUrl: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-zinc-200 text-xs focus:border-cyan-500" />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider flex items-center gap-1"><Figma className="w-3 h-3" />Figma URL</Label>
                    <Input placeholder="https://figma.com/..." value={projectForm.figmaUrl} onChange={(e) => setProjectForm(f => ({ ...f, figmaUrl: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-zinc-200 text-xs focus:border-cyan-500" />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider flex items-center gap-1"><LinkIcon className="w-3 h-3" />Live URL</Label>
                    <Input placeholder="https://app.client.com" value={projectForm.envUrl} onChange={(e) => setProjectForm(f => ({ ...f, envUrl: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-zinc-200 text-xs focus:border-cyan-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowProjectModal(false)} className="flex-1 text-zinc-400 hover:text-zinc-200 border border-zinc-700">Cancel</Button>
                <Button onClick={() => {
                  if (!projectForm.clientId) return toast.error("Select a client");
                  if (!projectForm.name.trim()) return toast.error("Enter a project name");
                  createProjectMutation.mutate(projectForm);
                }} disabled={createProjectMutation.isPending} className="flex-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white">
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowTaskModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-card border border-zinc-700 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-lg font-bold text-zinc-100">Add Task</h2><p className="text-xs text-zinc-500 font-mono mt-0.5">Add a new task to this project</p></div>
                <button onClick={() => setShowTaskModal(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Task Title *</Label>
                  <Input placeholder="e.g. Design login screen" value={taskForm.title} onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-cyan-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Priority</Label>
                    <select value={taskForm.priority} onChange={(e) => setTaskForm(f => ({ ...f, priority: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Due Date</Label>
                    <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-cyan-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowTaskModal(null)} className="flex-1 text-zinc-400 border border-zinc-700">Cancel</Button>
                <Button onClick={() => {
                  if (!taskForm.title.trim()) return toast.error("Enter a task title");
                  createTaskMutation.mutate({ projectId: showTaskModal!, data: taskForm });
                }} disabled={createTaskMutation.isPending} className="flex-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white">
                  {createTaskMutation.isPending ? "Adding..." : "Add Task"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
