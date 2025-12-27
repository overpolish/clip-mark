import { Link, Unlink, Wand2 } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/inputs/input-group";
import { Label } from "@/components/typography/label";

type SizeInputProps = { label: string };

function SizeInput({ label }: SizeInputProps) {
  return (
    <div className="group relative">
      <InputGroupInput id={label.toLowerCase()} type="number" />
      <Label
        htmlFor={label.toLowerCase()}
        className={`
          absolute -bottom-5 left-3.5 text-[10px] text-muted-foreground
          transition-colors
          group-focus-within:text-primary
        `}
      >
        {label}
      </Label>
    </div>
  );
}

export function SizingUtilities() {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>Size</InputGroupText>
      </InputGroupAddon>
      <SizeInput label="Width" />
      <InputGroupButton
        deselectedContent={<Unlink className="text-[10px]" />}
        size="icon-sm"
        asToggle
      >
        <Link className="text-[10px]" />
      </InputGroupButton>
      <SizeInput label="Height" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-sm">
          <Wand2 />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
