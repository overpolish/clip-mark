import { Keyboard } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { KbdGroup } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";

type ShortcutsProps = {
  className?: string;
};
export function Shortcuts({ className }: ShortcutsProps) {
  return (
    <Dialog>
      <DialogTrigger className={className} asChild>
        <Button size="sm" variant="muted">
          <Keyboard />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="h-full max-h-[calc(100%-4rem)] max-w-95 gap-2 p-4">
        <DialogHeader>
          <DialogTitle className="text-base text-muted-foreground">
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="sr-only">
            View keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <ScrollArea orientation="vertical" insetShadow>
          <div className="grid grid-cols-2 gap-3 px-2.5 py-2">
            <div className="flex flex-col">
              <span>Capture Note</span>
              <span className="text-xs text-muted-foreground">
                When recording in progress.
              </span>
            </div>
            <KbdGroup
              className="justify-self-end"
              keys={["Ctrl", "Shift", "="]}
              withPlusSigns
            />
            <div className="flex flex-col">
              <span>Capture Note</span>
              <span className="text-xs text-muted-foreground">
                When recording in progress.
              </span>
            </div>
            <KbdGroup
              className="justify-self-end"
              keys={["Ctrl", "Shift", "="]}
              withPlusSigns
            />
            <div className="flex flex-col">
              <span>Capture Note</span>
              <span className="text-xs text-muted-foreground">
                When recording in progress.
              </span>
            </div>
            <KbdGroup
              className="justify-self-end"
              keys={["Ctrl", "Shift", "="]}
              withPlusSigns
            />
            <div className="flex flex-col">
              <span>Capture Note</span>
              <span className="text-xs text-muted-foreground">
                When recording in progress.
              </span>
            </div>
            <KbdGroup
              className="justify-self-end"
              keys={["Ctrl", "Shift", "="]}
              withPlusSigns
            />
            <div className="flex flex-col">
              <span>Capture Note</span>
              <span className="text-xs text-muted-foreground">
                When recording in progress.
              </span>
            </div>
            <KbdGroup
              className="justify-self-end"
              keys={["Ctrl", "Shift", "="]}
              withPlusSigns
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
