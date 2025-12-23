import { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import { Keyboard } from "lucide-react";
import z from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Shortcut } from "./shortcut";

const commands = {
  GetShortcuts: "get_shortcuts",
} as const;

const shortcutSchema = z.object({
  description: z.string().optional().nullable(),
  shortcut: z.array(z.string()),
  title: z.string().min(1, "Title is required"),
});

export type Shortcut = z.infer<typeof shortcutSchema>;

async function getShortcuts(): Promise<Shortcut[]> {
  const shortcuts = await invoke(commands.GetShortcuts);
  console.log("Shortcuts fetched:", shortcuts);
  return z.array(shortcutSchema).parse(shortcuts);
}

type ShortcutsProps = {
  className?: string;
};
export function Shortcuts({ className }: ShortcutsProps) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  useEffect(() => {
    getShortcuts().then((data) => {
      setShortcuts(data);
    });
  }, []);

  return (
    <Dialog>
      <DialogTrigger className={className} asChild>
        <Button size="sm" variant="muted">
          <Keyboard />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-full max-h-[calc(100%-4rem)] max-w-95 flex-col gap-2 p-4">
        <DialogHeader>
          <DialogTitle className="text-base text-muted-foreground">
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="sr-only">
            View keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full" orientation="vertical" insetShadow>
          <div className="grid grid-cols-2 gap-3 px-2.5 py-2">
            {shortcuts.map((shortcut) => (
              <Shortcut key={shortcut.title} shortcut={shortcut} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
