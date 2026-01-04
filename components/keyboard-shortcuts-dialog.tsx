"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Playback",
    shortcuts: [
      { keys: ["Space", "K"], description: "Play/Pause" },
      { keys: ["N"], description: "Next track" },
      { keys: ["P"], description: "Previous track" },
      { keys: ["→", "L"], description: "Skip forward 10s" },
      { keys: ["←", "J"], description: "Skip backward 10s" },
    ],
  },
  {
    title: "Volume",
    shortcuts: [
      { keys: ["↑"], description: "Increase volume 5%" },
      { keys: ["↓"], description: "Decrease volume 5%" },
      { keys: ["M"], description: "Mute/Unmute" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [{ keys: ["1-9"], description: "Play intent card 1-9" }],
  },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Open dialog with ? key
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // Don't trigger if typing in input/textarea
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-6 right-6 z-50 size-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="size-4 text-white/80" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl flex-col flex sm:h-[75vh] bg-[#0a0a0a] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-xs font-normal uppercase tracking-wider text-white/60">
                {group.title}
              </h3>
              <div className="space-y-3">
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex flex-row items-center justify-between gap-1.5 text-sm"
                  >
                    <span className="text-sm text-foreground">
                      {shortcut.description}
                    </span>

                    <div className="flex flex-wrap gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="inline-flex items-center justify-center rounded border border-white/20 bg-white/5 px-2 py-1 font-mono text-xs text-white/90">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="text-white/40 self-center">
                              or
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex-none rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/60">
            Press{" "}
            <kbd className="inline-flex items-center justify-center rounded border border-white/20 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
              ?
            </kbd>{" "}
            to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
