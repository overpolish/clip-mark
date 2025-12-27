import { type ComponentProps } from "react";

import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import { tv } from "tailwind-variants";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

const commandVariants = tv({
  base: `
    flex h-full w-full flex-col overflow-hidden rounded-md bg-popover
    text-popover-foreground
  `,
});

type CommandProps = ComponentProps<typeof CommandPrimitive>;

/**
 * @public
 */
export function Command({ className, ...props }: CommandProps) {
  const styles = commandVariants({ className });
  return (
    <CommandPrimitive
      className={styles}
      data-slot="command"
      filter={(_, search, keywords) => {
        return keywords
          ?.map((keyword) => keyword.includes(search))
          .some((result) => !!result)
          ? 1
          : 0;
      }}
      {...props}
    />
  );
}

const commandDialogVariants = tv({
  slots: {
    command: `
      **:data-[slot=command-input-wrapper]:h-12
      [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0
      [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5
      [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5
      **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium
      **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group]]:px-2
      **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3
    `,
    content: "overflow-hidden p-0",
  },
});

type CommandDialogProps = ComponentProps<typeof Dialog> & {
  className?: string;
  description?: string;
  showCloseButton?: boolean;
  title?: string;
};

/**
 * @public
 */
export function CommandDialog({
  children,
  className,
  description = "Search for a command to run...",
  showCloseButton = true,
  title = "Command Palette",
  ...props
}: CommandDialogProps) {
  const { command, content } = commandDialogVariants();
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={content({ className })}
        showCloseButton={showCloseButton}
      >
        <Command className={command()}>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}

const commandInputVariants = tv({
  slots: {
    base: "flex h-9 items-center gap-2 border-b px-3",
    input: `
      flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden
      placeholder:text-muted-foreground
      disabled:cursor-not-allowed disabled:opacity-50
    `,
  },
});

type CommandInputProps = ComponentProps<typeof CommandPrimitive.Input>;

/**
 * @public
 */
export function CommandInput({ className, ...props }: CommandInputProps) {
  const { base, input } = commandInputVariants();
  return (
    <div className={base()} data-slot="command-input-wrapper">
      <SearchIcon className="shrink-0 text-[10px] opacity-50" />
      <CommandPrimitive.Input
        className={input({ className })}
        data-slot="command-input"
        {...props}
      />
    </div>
  );
}

const commandListVariants = tv({
  base: "max-h-75 scroll-py-1 overflow-x-hidden overflow-y-auto",
});

type CommandListProps = ComponentProps<typeof CommandPrimitive.List>;

/**
 * @public
 */
export function CommandList({ className, ...props }: CommandListProps) {
  const styles = commandListVariants({ className });
  return (
    <CommandPrimitive.List
      className={styles}
      data-slot="command-list"
      {...props}
    />
  );
}

type CommandEmptyProps = ComponentProps<typeof CommandPrimitive.Empty>;

/**
 * @public
 */
export function CommandEmpty({ ...props }: CommandEmptyProps) {
  return (
    <CommandPrimitive.Empty
      className="py-6 text-center text-sm"
      data-slot="command-empty"
      {...props}
    />
  );
}

const commandGroupVariants = tv({
  base: `
    overflow-hidden p-1 text-foreground
    **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5
    **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium
    **:[[cmdk-group-heading]]:text-muted-foreground
  `,
});

type CommandGroupProps = ComponentProps<typeof CommandPrimitive.Group>;

/**
 * @public
 */
export function CommandGroup({ className, ...props }: CommandGroupProps) {
  const styles = commandGroupVariants({ className });
  return (
    <CommandPrimitive.Group
      className={styles}
      data-slot="command-group"
      {...props}
    />
  );
}

const commandSeparatorVariants = tv({
  base: "-mx-1 h-px bg-border",
});

type CommandSeparatorProps = ComponentProps<typeof CommandPrimitive.Separator>;

/**
 * @public
 */
export function CommandSeparator({
  className,
  ...props
}: CommandSeparatorProps) {
  const styles = commandSeparatorVariants({ className });
  return (
    <CommandPrimitive.Separator
      className={styles}
      data-slot="command-separator"
      {...props}
    />
  );
}

const commandItemVariants = tv({
  base: `
    relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5
    text-sm outline-hidden select-none
    data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50
    data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
    [&_svg:not([class*='text-'])]:text-muted-foreground
  `,
});

type CommandItemProps = ComponentProps<typeof CommandPrimitive.Item>;

/**
 * @public
 */
export function CommandItem({ className, ...props }: CommandItemProps) {
  const styles = commandItemVariants({ className });
  return (
    <CommandPrimitive.Item
      className={styles}
      data-slot="command-item"
      {...props}
    />
  );
}

const commandShortcutVariants = tv({
  base: "ml-auto text-xs tracking-widest text-muted-foreground",
});

type CommandShortcutProps = ComponentProps<"span">;

/**
 * @public
 */
export function CommandShortcut({ className, ...props }: CommandShortcutProps) {
  const styles = commandShortcutVariants({ className });
  return <span className={styles} data-slot="command-shortcut" {...props} />;
}
