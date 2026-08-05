import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CommandDialog, CommandInput, CommandList, CommandEmpty, 
  CommandGroup, CommandItem, CommandSeparator 
} from "@/components/ui/command";
import { 
  Home, Briefcase, FolderOpen, Palette, BookOpen, 
  MessageSquare, Users, Terminal, Zap 
} from "lucide-react";

const commands = [
  { icon: Home, label: "Home", path: "/", group: "Navigate" },
  { icon: Users, label: "About Us", path: "/about", group: "Navigate" },
  { icon: Briefcase, label: "Services", path: "/services", group: "Navigate" },
  { icon: FolderOpen, label: "Projects", path: "/projects", group: "Navigate" },
  { icon: Palette, label: "Design Portfolio", path: "/design-portfolio", group: "Navigate" },
  { icon: BookOpen, label: "Blog", path: "/blog", group: "Navigate" },
  { icon: MessageSquare, label: "Contact", path: "/contact", group: "Navigate" },
  { icon: Zap, label: "View Web Development", path: "/projects", group: "Quick Actions" },
  { icon: Terminal, label: "View Security Work", path: "/projects", group: "Quick Actions" },
  { icon: Palette, label: "View Design Work", path: "/design-portfolio", group: "Quick Actions" },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        // Don't trigger if user is typing in an input
        if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const groups = [...new Set(commands.map(c => c.group))];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, gi) => (
          <div key={group}>
            {gi > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {commands.filter(c => c.group === group).map((cmd) => (
                <CommandItem
                  key={cmd.label + cmd.path}
                  onSelect={() => runCommand(cmd.path)}
                  className="cursor-pointer"
                >
                  <cmd.icon className="mr-2 h-4 w-4 text-primary" />
                  <span>{cmd.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
