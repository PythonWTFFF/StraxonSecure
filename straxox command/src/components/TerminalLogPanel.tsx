import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export function TerminalLogPanel({ logs, isLive }: { logs: any[], isLive: boolean }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [command, setCommand] = useState('');

  useEffect(() => {
    if (!terminalRef.current) return;

    term.current = new Terminal({
      theme: {
        background: '#020617', // slate-950
        foreground: '#94a3b8', // slate-400
        cursor: '#22d3ee', // cyan-400
        selectionBackground: '#1e293b',
      },
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 12,
      cursorBlink: true,
      disableStdin: false,
    });

    fitAddon.current = new FitAddon();
    term.current.loadAddon(fitAddon.current);
    term.current.open(terminalRef.current);
    fitAddon.current.fit();

    term.current.writeln('\x1b[1;36mStraxon Advanced Terminal Emulator v2.0\x1b[0m');
    term.current.writeln('Type \x1b[1;33mhelp\x1b[0m for commands.\r\n');
    prompt();

    term.current.onData((data) => {
      const code = data.charCodeAt(0);
      
      // Enter
      if (code === 13) {
        term.current!.writeln('');
        handleCommand(command);
        setCommand('');
        prompt();
      }
      // Backspace
      else if (code === 127) {
        if (command.length > 0) {
          term.current!.write('\b \b');
          setCommand((c) => c.slice(0, -1));
        }
      }
      // Printable characters
      else if (code >= 32 && code <= 126) {
        term.current!.write(data);
        setCommand((c) => c + data);
      }
    });

    const handleResize = () => fitAddon.current?.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.current?.dispose();
    };
  }, []);

  const prompt = () => {
    term.current?.write('\r\n\x1b[1;32madmin@straxon\x1b[0m:\x1b[1;34m/var/log/audit\x1b[0m$ ');
  };

  const handleCommand = (cmd: string) => {
    const args = cmd.trim().split(' ');
    const commandName = args[0].toLowerCase();

    if (!term.current) return;

    switch (commandName) {
      case 'help':
        term.current.writeln('Available commands:');
        term.current.writeln('  \x1b[1;33mcat\x1b[0m <file>   - View log file contents (e.g. cat system.log)');
        term.current.writeln('  \x1b[1;33mgrep\x1b[0m <term>  - Search for a specific term in logs');
        term.current.writeln('  \x1b[1;33mclear\x1b[0m        - Clear the terminal screen');
        term.current.writeln('  \x1b[1;33mstatus\x1b[0m       - Show terminal status');
        break;
      case 'clear':
        term.current.clear();
        break;
      case 'status':
        term.current.writeln(`Terminal Status: \x1b[1;32mONLINE\x1b[0m`);
        term.current.writeln(`Live Feed: ${isLive ? '\x1b[1;32mENABLED\x1b[0m' : '\x1b[1;31mDISABLED\x1b[0m'}`);
        term.current.writeln(`Logs Loaded: ${logs.length}`);
        break;
      case 'cat':
        if (args[1] === 'system.log') {
          logs.forEach(log => {
            const color = log.tag === 'SUCCESS' ? '\x1b[1;32m' : log.tag === 'WARN' ? '\x1b[1;33m' : log.tag === 'CRITICAL' ? '\x1b[1;31m' : '\x1b[1;36m';
            term.current!.writeln(`[${log.time}] ${color}[${log.tag}]\x1b[0m ${log.msg || log.action}`);
          });
        } else {
          term.current.writeln(`cat: ${args[1] || ''}: No such file or directory`);
        }
        break;
      case 'grep':
        const search = args.slice(1).join(' ').toLowerCase();
        if (!search) {
          term.current.writeln('Usage: grep <term>');
          break;
        }
        let matches = 0;
        logs.forEach(log => {
          const str = `[${log.time}] [${log.tag || log.severity}] ${log.msg || log.action}`;
          if (str.toLowerCase().includes(search)) {
            const color = log.tag === 'SUCCESS' ? '\x1b[1;32m' : log.tag === 'WARN' ? '\x1b[1;33m' : log.tag === 'CRITICAL' ? '\x1b[1;31m' : '\x1b[1;36m';
            term.current!.writeln(`[${log.time}] ${color}[${log.tag || log.severity}]\x1b[0m ${log.msg || log.action}`);
            matches++;
          }
        });
        term.current.writeln(`\x1b[1;36m${matches} matches found.\x1b[0m`);
        break;
      case '':
        break;
      default:
        term.current.writeln(`bash: ${commandName}: command not found`);
    }
  };

  return (
    <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl overflow-hidden h-[500px]">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
