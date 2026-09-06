import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export interface SandboxExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runInSandbox(
  code: string,
  image: string = "node:18-alpine",
  command: string = "npm test"
): Promise<SandboxExecutionResult> {
  // 1. Create a secure temporary directory
  const tempDir = await mkdtemp(join(tmpdir(), "devlab-sandbox-"));
  
  try {
    // 2. Write the candidate's code to a known file (e.g., index.js or similar based on scenario)
    // For simplicity, we just dump it to candidate_code.ts. In a real scenario, this would be a full repo clone.
    const codePath = join(tempDir, "candidate_code.ts");
    await writeFile(codePath, code, "utf-8");

    // 3. Construct the Docker run command
    // --rm: Remove container when done
    // --network none: Prevent outbound network access
    // --memory: Limit memory to 256m
    // --cpus: Limit CPU to 0.5
    // -v: Mount the temp dir as readonly to /workspace
    const containerName = `sandbox-${Math.random().toString(36).substring(7)}`;
    const dockerCmd = `docker run --rm --name ${containerName} --network none --memory 256m --cpus 0.5 -v "${tempDir}:/workspace:ro" -w /workspace ${image} ${command}`;

    // 4. Execute the command (with a timeout of 10s)
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    try {
      const { stdout: out, stderr: err } = await execAsync(dockerCmd, { timeout: 10000 });
      stdout = out;
      stderr = err;
    } catch (error: any) {
      stdout = error.stdout || "";
      stderr = error.stderr || error.message;
      exitCode = error.code ?? 1;
    }

    return { stdout, stderr, exitCode };
  } finally {
    // 5. Cleanup the temporary directory to prevent storage exhaustion
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.error(`Failed to cleanup temp dir ${tempDir}:`, cleanupErr);
    }
  }
}
