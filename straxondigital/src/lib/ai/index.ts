// AI engine injection point — future prompt engines live here.
export interface AIEngine {
  name: string;
  generate: (intake: Record<string, unknown>) => Promise<string>;
}

export const registry: Record<string, AIEngine> = {};

export const registerEngine = (engine: AIEngine) => {
  registry[engine.name] = engine;
};
