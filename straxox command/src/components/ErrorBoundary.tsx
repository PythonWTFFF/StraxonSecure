import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[STRAXON_FAULT]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card p-6 border-destructive/30 bg-destructive/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-destructive font-mono uppercase tracking-wider">
                ⚠ System Fault Detected
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                {this.props.fallbackTitle || "Module"} · Exception caught by boundary
              </p>
            </div>
          </div>

          <div className="bg-background/60 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-3 h-3 text-destructive" />
              <span className="text-[10px] font-mono text-destructive uppercase">Error Stack</span>
            </div>
            <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap max-h-32 overflow-auto">
              {this.state.error?.message}
              {"\n"}
              {this.state.error?.stack?.split("\n").slice(0, 4).join("\n")}
            </pre>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10 font-mono"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Attempt Recovery
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
