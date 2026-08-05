import React, { createContext, useContext, useState, type ReactNode } from "react";

export interface Workspace {
  id: string;
  name: string;
  tagline: string;
  accentHue: number;     // CSS hue for primary
  secondaryHue: number;  // CSS hue for secondary
  defaultTaxRate: number;
  defaultCurrency: string;
  invoicePrefix: string;
}

export const defaultWorkspaces: Workspace[] = [
  {
    id: "straxon-agency",
    name: "Straxon Labs Agency",
    tagline: "Technology & Security Solutions",
    accentHue: 185,
    secondaryHue: 270,
    defaultTaxRate: 18,
    defaultCurrency: "INR",
    invoicePrefix: "STX",
  },
  {
    id: "edtech-platform",
    name: "EdTech Platform",
    tagline: "Digital Learning Solutions",
    accentHue: 142,
    secondaryHue: 210,
    defaultTaxRate: 18,
    defaultCurrency: "INR",
    invoicePrefix: "EDU",
  },
  {
    id: "cyber-division",
    name: "Cyber Division",
    tagline: "Offensive Security & Red Teaming",
    accentHue: 0,
    secondaryHue: 30,
    defaultTaxRate: 18,
    defaultCurrency: "USD",
    invoicePrefix: "CYB",
  },
];

interface WorkspaceContextType {
  workspace: Workspace;
  workspaces: Workspace[];
  setWorkspaceById: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: defaultWorkspaces[0],
  workspaces: defaultWorkspaces,
  setWorkspaceById: () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentId, setCurrentId] = useState(defaultWorkspaces[0].id);
  const workspace = defaultWorkspaces.find((w) => w.id === currentId) || defaultWorkspaces[0];

  return (
    <WorkspaceContext.Provider value={{ workspace, workspaces: defaultWorkspaces, setWorkspaceById: setCurrentId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
