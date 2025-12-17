"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

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

type ComboboxProps = {
  data: { label: string; value: string }[];
  emptyMessage?: string;
  placeholder?: string;
  searchPlaceholder?: string;
};
function Combobox({
  data,
  emptyMessage,
  placeholder,
  searchPlaceholder,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const [triggerWidth, setTriggerWidth] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = data.find((item) => item.value === value);

  useLayoutEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, []);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          aria-expanded={open}
          className="w-full justify-between"
          role="combobox"
          variant="outline"
        >
          <span
            className={cn("truncate", !selected && "text-muted-foreground")}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDownIcon className="ml-auto shrink-0 text-[10px] opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: triggerWidth }}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.value}
                  className="justify-between"
                  value={item.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{item.label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-2 text-[10px]",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default Combobox;
