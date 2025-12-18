"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentRef,
} from "overlayscrollbars-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxData = {
  label: string;
  value: string;
  left?: React.ReactNode;
};

type ComboboxProps = {
  data: ComboboxData[];
  emptyMessage?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  onOpen?: () => void;
};
function Combobox({
  data,
  emptyMessage,
  onOpen,
  placeholder,
  searchPlaceholder,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const [triggerWidth, setTriggerWidth] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const osRef = useRef<OverlayScrollbarsComponentRef>(null);

  const selected = data.find((item) => item.value === value);

  function checkOverflow() {
    const hasY = osRef.current?.osInstance()?.state().hasOverflow.y ?? false;
    setHasOverflow(hasY);
  }

  useLayoutEffect(() => {
    if (!triggerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const width =
        entry.borderBoxSize?.[0]?.inlineSize ??
        entry.target.getBoundingClientRect().width;

      setTriggerWidth(width);
    });

    observer.observe(triggerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (open) {
      onOpen?.();
    }
  }, [open]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          aria-expanded={open}
          role="combobox"
          variant="outline"
          className={cn(
            "w-full justify-between",
            !selected && "text-muted-foreground"
          )}
        >
          <div className="flex w-full items-center gap-2">
            {selected?.left && <div className="shrink-0">{selected.left}</div>}
            <span className={"truncate"}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDownIcon className="ml-auto shrink-0 text-[10px] opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: triggerWidth }}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <OverlayScrollbarsComponent
                ref={osRef}
                className={cn("max-h-40 w-full", hasOverflow && "pr-2.5")}
                events={{
                  initialized: checkOverflow,
                  updated: checkOverflow,
                }}
                options={{
                  scrollbars: {
                    autoHide: "never",
                    theme: "os-theme-clip-mark",
                  },
                }}
                defer
              >
                {data.map((item) => (
                  <CommandItem
                    key={item.value}
                    className="justify-between"
                    keywords={[item.label.toLowerCase()]}
                    value={item.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {item.left && <div className="shrink-0">{item.left}</div>}
                      <span className="truncate">{item.label}</span>
                    </div>

                    <CheckIcon
                      className={cn(
                        "text-[10px]",
                        value === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </OverlayScrollbarsComponent>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default Combobox;
