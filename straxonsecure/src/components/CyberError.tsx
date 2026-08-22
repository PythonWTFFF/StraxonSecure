import { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CyberError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/50 border border-red-500/30 rounded-xl p-8 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20" />

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-100">System Error</h2>
            <p className="text-sm text-slate-400">
              An unexpected failure occurred while processing this request.
            </p>
          </div>

          <div className="w-full bg-black/40 rounded-lg p-4 font-mono text-xs text-left overflow-x-auto text-red-400/80 border border-red-500/10">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </div>

          <Button
            onClick={reset}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    </div>
  );
}
