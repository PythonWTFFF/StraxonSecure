// Lightweight client-side attack replay recorder.
// Each lab pushes events into a shared store; user can play them back.

export interface ReplayEvent {
  t: number; // ms since recording started
  lab: string; // lab slug
  kind: string; // event kind (input, request, result, ...)
  label: string;
  data?: Record<string, unknown>;
  severity?: "info" | "warn" | "danger" | "success";
}

export interface ReplaySession {
  id: string;
  lab: string;
  startedAt: number;
  endedAt: number | null;
  events: ReplayEvent[];
}

const KEY = "straxon_replays_v1";
const MAX_SESSIONS = 20;

let active: ReplaySession | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function load(): ReplaySession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function persist(sessions: ReplaySession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
}

export const Replay = {
  start(lab: string) {
    active = {
      id: crypto.randomUUID(),
      lab,
      startedAt: Date.now(),
      endedAt: null,
      events: [],
    };
    emit();
  },
  push(ev: Omit<ReplayEvent, "t" | "lab">) {
    if (!active) return;
    active.events.push({
      ...ev,
      lab: active.lab,
      t: Date.now() - active.startedAt,
    });
  },
  stop(): ReplaySession | null {
    if (!active) return null;
    active.endedAt = Date.now();
    const sessions = [active, ...load()];
    persist(sessions);
    const finished = active;
    active = null;
    emit();
    return finished;
  },
  isRecording() {
    return !!active;
  },
  current() {
    return active;
  },
  list(): ReplaySession[] {
    return load();
  },
  remove(id: string) {
    persist(load().filter((s) => s.id !== id));
    emit();
  },
  clear() {
    persist([]);
    emit();
  },
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
