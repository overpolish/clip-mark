import { KbdGroup } from "@/components/typography/kbd";

import { type Shortcut } from "./shortcuts";

type ShortcutProps = {
  shortcut: Shortcut;
};

export function Shortcut({ shortcut }: ShortcutProps) {
  return (
    <>
      <div className="flex flex-col">
        <span>{shortcut.title}</span>
        <span className="text-xs text-muted-foreground">
          {shortcut.description}
        </span>
      </div>
      <KbdGroup
        className="justify-self-end"
        keys={shortcut.shortcut}
        withPlusSigns
      />
    </>
  );
}
